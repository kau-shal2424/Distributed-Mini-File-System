import socket
import threading
import os
import sys
import time
from typing import Dict

if len(sys.argv) != 2:
    print("Usage: python data_node.py <node_id>")
    sys.exit(1)

node_id = int(sys.argv[1])
node_dir = f'./data_node_{node_id}'
os.makedirs(node_dir, exist_ok=True)
storage: Dict[str, str] = {}  

def save_chunk(fname: str, cid: int, content: str):
    key = f"{fname}:{cid}"  
    full_path = os.path.join(node_dir, f"{key}.chunk")  
    directory = os.path.dirname(full_path)  
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)  
    print(f"Writing content to {full_path}: '{content}'")
    with open(full_path, 'w') as f:
        f.write(content)

def load_chunk(fname: str, cid: int) -> str:
    key = f"{fname}:{cid}"
    if key in storage:
        return storage[key]
    path = os.path.join(node_dir, f"{key}.chunk")
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
            storage[key] = content
            return content
    return ''

def handle_requests(node_sock):
    while True:
        client_sock, addr = node_sock.accept()
        threading.Thread(target=process_request, args=(client_sock,)).start()

def process_request(client_sock):
    data = client_sock.recv(4096).decode()
    parts = data.split(':', 3)
    cmd = parts[0]
    response = ''
    
    if cmd == 'write':
        fname, cid, content = parts[1], int(parts[2]), parts[3]
        save_chunk(fname, cid, content)
        response = 'OK'
    elif cmd == 'read':
        fname, cid = parts[1], int(parts[2])
        response = load_chunk(fname, cid)
    elif cmd == 'delete':
        fname, cid = parts[1], int(parts[2])
        key = f"{fname}:{cid}"
        storage.pop(key, None)
        path = os.path.join(node_dir, f"{key}.chunk")
        if os.path.exists(path):
            os.remove(path)
        response = 'OK'
    elif cmd == 'delete_file':
       
        fname = parts[1]
        
        to_delete_keys = [k for k in list(storage.keys()) if k.startswith(f"{fname}:")]
        for k in to_delete_keys:
            storage.pop(k, None)
        
        removed = 0
        for entry in os.listdir(node_dir):
            if entry.startswith(f"{fname}:") and entry.endswith('.chunk'):
                try:
                    os.remove(os.path.join(node_dir, entry))
                    removed += 1
                except Exception:
                    pass
        response = f'OK:{removed}'
    
    client_sock.send(response.encode())
    client_sock.close()

def send_heartbeat_to_master():
    while True:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect(('localhost', 5000))  
            msg = f'heartbeat:{node_id}'
            sock.send(msg.encode())
            response = sock.recv(1024).decode()  
            sock.close()
            if response != 'OK':
                print(f"Node {node_id}: Unexpected heartbeat response: {response}")
        except Exception as e:
            print(f"Node {node_id}: Heartbeat failed: {e}")
        time.sleep(5)  

if __name__ == '__main__':
    
    node_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    node_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    node_sock.bind(('localhost', 5000 + node_id))
    node_sock.listen(5)
    print(f"Data Node {node_id} started on port {5000 + node_id}")
    
    threading.Thread(target=handle_requests, args=(node_sock,)).start()
    threading.Thread(target=send_heartbeat_to_master).start()
    
    while True:
        time.sleep(1)