import socket
import threading
import json
import time
import os
import sys
from typing import Dict, List, Tuple

metadata: Dict[str, List[Tuple[int, List[int]]]] = {}
data_nodes_status: Dict[int, bool] = {}
last_heartbeat: Dict[int, float] = {}
data_nodes: List[str] = ['localhost']
data_node_ports = {1: 5001, 2: 5002, 3: 5003}
HEARTBEAT_TIMEOUT = 15
CHUNK_SIZE = 1024

def get_alive_nodes() -> List[int]:
    return [nid for nid, alive in data_nodes_status.items() if alive]

def choose_additional_nodes(exclude: List[int], needed: int) -> List[int]:
    alive = [n for n in get_alive_nodes() if n not in exclude]
    return alive[:max(0, needed)]

def write_chunk_to_replicas(fname: str, cid: int, chunk: str, desired_rf: int = 2) -> List[int]:
    replicas: List[int] = []
    candidates = choose_additional_nodes([], desired_rf)
    if not candidates:
        return replicas
    for nid in candidates:
        ok = get_from_node(nid, f'write:{fname}:{cid}:{chunk}')
        if ok == 'OK':
            replicas.append(nid)
        
    if len(replicas) < desired_rf:
        extra_needed = desired_rf - len(replicas)
        tried = set(candidates)
        more = [n for n in get_alive_nodes() if n not in tried]
        for nid in more:
            if extra_needed <= 0:
                break
            ok = get_from_node(nid, f'write:{fname}:{cid}:{chunk}')
            if ok == 'OK':
                replicas.append(nid)
                extra_needed -= 1
    return replicas

def ensure_replication_for_file(fname: str, desired_rf: int = 2):
    if fname not in metadata:
        return
    new_entries: List[Tuple[int, List[int]]] = []
    for cid, replicas in metadata[fname]:
        alive_replicas = [n for n in replicas if data_nodes_status.get(n, False)]
        if len(alive_replicas) >= desired_rf:
            new_entries.append((cid, alive_replicas[:desired_rf]))
            continue
       
        chunk_data = ''
        for nid in alive_replicas:
            chunk_data = get_from_node(nid, f'read:{fname}:{cid}')
            if chunk_data:
                break
        if chunk_data == '':
            
            new_entries.append((cid, alive_replicas))
            continue
        needed = desired_rf - len(alive_replicas)
        add_nodes = choose_additional_nodes(alive_replicas, needed)
        for nid in add_nodes:
            ok = get_from_node(nid, f'write:{fname}:{cid}:{chunk_data}')
            if ok == 'OK':
                alive_replicas.append(nid)
        new_entries.append((cid, alive_replicas))
    metadata[fname] = new_entries

def ensure_replication_all(desired_rf: int = 2):
    for fname in list(metadata.keys()):
        ensure_replication_for_file(fname, desired_rf)

def handle_connections(master_sock):
    while True:
        client_sock, addr = master_sock.accept()
        threading.Thread(target=process_connection, args=(client_sock,)).start()

def process_connection(client_sock):
    data = client_sock.recv(4096).decode()
    if not data:
        client_sock.close()
        return
    if data.startswith('heartbeat:'):
        try:
            node_id = int(data.split(':')[1])
            data_nodes_status[node_id] = True
            last_heartbeat[node_id] = time.time()
            print(f"Node {node_id} is alive (heartbeat received)")
            client_sock.send('OK'.encode())
        except:
            pass
        client_sock.close()
        return
    parts = data.split(':', 2)
    if len(parts) < 2:
        client_sock.send('ERROR: Invalid request'.encode())
        client_sock.close()
        return
    cmd, fname = parts[0], parts[1]
    args = parts[2] if len(parts) > 2 else ''
    response = ''
    if cmd == 'create':
        content = args
        chunks = [content[i:i+CHUNK_SIZE] for i in range(0, len(content), CHUNK_SIZE)]
        metadata[fname] = []
        alive = get_alive_nodes()
        if len(alive) == 0:
            response = 'ERROR: No alive data nodes'
        else:
            for cid, chunk in enumerate(chunks):
                replicas = write_chunk_to_replicas(fname, cid, chunk, desired_rf=2)
                if not replicas:
                    client_sock.send('ERROR: Write failed'.encode())
                    client_sock.close()
                    return
                metadata[fname].append((cid, replicas))
            response = f'SUCCESS: Created {fname} with {len(chunks)} chunks (RF={len(metadata[fname][0][1]) if metadata[fname] else 0})'
    elif cmd == 'read':
        if fname not in metadata:
            response = 'ERROR: File not found'
        else:
            chunks_data = []
            for cid, replicas in metadata[fname]:
                chunk_found = False
                for nid in replicas:
                    if data_nodes_status.get(nid, False):
                        chunk = get_from_node(nid, f'read:{fname}:{cid}')
                        if chunk:
                            chunks_data.append(chunk)
                            chunk_found = True
                            break
                if not chunk_found:
                    response += f'WARNING: Chunk {cid} unavailable (node failure)\n'
            if chunks_data:
                response = ''.join(chunks_data) + (response or '')
    elif cmd == 'delete':
        if fname in metadata:
            for cid, replicas in metadata[fname]:
                for nid in replicas:
                    send_to_node(nid, f'delete:{fname}:{cid}')
            del metadata[fname]
          
            for nid in list(data_node_ports.keys()):
                try:
                    send_to_node(nid, f'delete_file:{fname}')
                except Exception:
                    pass
            response = 'SUCCESS: Deleted'
        else:
            
            for nid in list(data_node_ports.keys()):
                try:
                    send_to_node(nid, f'delete_file:{fname}')
                except Exception:
                    pass
            response = 'SUCCESS: Deleted (metadata missing; purged replicas)'
    elif cmd == 'write':
        
        new_content = args
       
        if fname in metadata:
            for cid, replicas in metadata[fname]:
                for nid in replicas:
                    send_to_node(nid, f'delete:{fname}:{cid}')
        
        chunks = [new_content[i:i+CHUNK_SIZE] for i in range(0, len(new_content), CHUNK_SIZE)]
        metadata[fname] = []
        if len(get_alive_nodes()) == 0:
            response = 'ERROR: No alive data nodes'
        else:
            for cid, chunk in enumerate(chunks):
                replicas = write_chunk_to_replicas(fname, cid, chunk, desired_rf=2)
                if not replicas:
                    client_sock.send('ERROR: Write failed'.encode())
                    client_sock.close()
                    return
                metadata[fname].append((cid, replicas))
            response = f'SUCCESS: Replaced file with {len(new_content)} bytes'
    elif cmd == 'append':
        
        new_data = args
        if fname not in metadata:
           
            content = new_data
            chunks = [content[i:i+CHUNK_SIZE] for i in range(0, len(content), CHUNK_SIZE)]
            metadata[fname] = []
            available_nodes = [nid for nid, alive in data_nodes_status.items() if alive]
            if len(get_alive_nodes()) == 0:
                response = 'ERROR: No alive data nodes'
            else:
                for cid, chunk in enumerate(chunks):
                    replicas = write_chunk_to_replicas(fname, cid, chunk, desired_rf=2)
                    if not replicas:
                        client_sock.send('ERROR: Write failed'.encode())
                        client_sock.close()
                        return
                    metadata[fname].append((cid, replicas))
                response = f'SUCCESS: Created {fname} with {len(chunks)} chunks'
        else:
            
            current = []
            for cid, replicas in metadata[fname]:
                chunk_found = False
                for nid in replicas:
                    if data_nodes_status.get(nid, False):
                        chunk = get_from_node(nid, f'read:{fname}:{cid}')
                        if chunk:
                            current.append(chunk)
                            chunk_found = True
                            break
                if not chunk_found:
                    current.append('')
            current_data = ''.join(current)
            new_content = current_data + new_data
           
            for cid, replicas in metadata[fname]:
                for nid in replicas:
                    send_to_node(nid, f'delete:{fname}:{cid}')
            
            chunks = [new_content[i:i+CHUNK_SIZE] for i in range(0, len(new_content), CHUNK_SIZE)]
            metadata[fname] = []
            if len(get_alive_nodes()) == 0:
                response = 'ERROR: No alive data nodes'
            else:
                for cid, chunk in enumerate(chunks):
                    replicas = write_chunk_to_replicas(fname, cid, chunk, desired_rf=2)
                    if not replicas:
                        client_sock.send('ERROR: Write failed'.encode())
                        client_sock.close()
                        return
                    metadata[fname].append((cid, replicas))
                response = f'SUCCESS: Appended {len(new_data)} bytes'
    elif cmd == 'list':
        response = json.dumps(list(metadata.keys()))
    elif cmd == 'metadata':
        if fname not in metadata:
            response = 'ERROR: File not found'
        else:
            file_metadata = {
                'filename': fname,
                'chunks': len(metadata[fname]),
                'replicas': []
            }
            for cid, replicas in metadata[fname]:
                file_metadata['replicas'].append({
                    'chunk_id': cid,
                    'replica_nodes': replicas,
                    'replica_count': len(replicas)
                })
            response = json.dumps(file_metadata)
    elif cmd == 'system_info':
        system_info = {
            'data_nodes': {
                str(nid): {
                    'status': 'alive' if data_nodes_status.get(nid, False) else 'dead',
                    'last_heartbeat': last_heartbeat.get(nid, 0),
                    'port': data_node_ports.get(nid, 0)
                }
                for nid in data_node_ports.keys()
            },
            'total_files': len(metadata),
            'alive_nodes': len(get_alive_nodes())
        }
        response = json.dumps(system_info)
    client_sock.send(response.encode())
    client_sock.close()

def send_to_node(node_id: int, msg: str):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((data_nodes[0], data_node_ports[node_id]))
        sock.send(msg.encode())
        sock.close()
    except Exception as e:
        print(f"Failed to send to node {node_id}: {e}")
        data_nodes_status[node_id] = False

def get_from_node(node_id: int, msg: str) -> str:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((data_nodes[0], data_node_ports[node_id]))
        sock.send(msg.encode())
        data = sock.recv(4096).decode()
        sock.close()
        return data
    except Exception as e:
        print(f"Failed to get from node {node_id}: {e}")
        data_nodes_status[node_id] = False
        return ''

def monitor_heartbeats():
    while True:
        time.sleep(5)
        current_time = time.time()
        for node_id in data_node_ports:
            if node_id not in last_heartbeat or (current_time - last_heartbeat[node_id] > HEARTBEAT_TIMEOUT):
                if data_nodes_status.get(node_id, False):
                    data_nodes_status[node_id] = False
                    print(f"Node {node_id} failed (heartbeat timeout). Re-replicate affected chunks.")
                    ensure_replication_all(desired_rf=2)

def periodic_healer():
    while True:
        time.sleep(10)
        ensure_replication_all(desired_rf=2)

if __name__ == '__main__':
    for nid in data_node_ports:
        data_nodes_status[nid] = False
        last_heartbeat[nid] = 0
    master_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    master_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    master_sock.bind(('localhost', 5000))
    master_sock.listen(5)
    print("Master started on port 5000")
    connection_thread = threading.Thread(target=handle_connections, args=(master_sock,), daemon=True)
    heartbeat_thread = threading.Thread(target=monitor_heartbeats, daemon=True)
    healer_thread = threading.Thread(target=periodic_healer, daemon=True)
    connection_thread.start()
    heartbeat_thread.start()
    healer_thread.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Master shutting down gracefully...")
        master_sock.close()
        sys.exit(0)