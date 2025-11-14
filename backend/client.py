import socket
import json
import sys

MASTER_HOST = 'localhost'
MASTER_PORT = 5000

def send_command(cmd: str, fname: str, args: str = ''):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.connect((MASTER_HOST, MASTER_PORT))
        msg = f"{cmd}:{fname}:{args}"
        sock.send(msg.encode())
        response = sock.recv(4096).decode()
        print(response)
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        sock.close()

def main():
    print("Mini DFS Client. Commands: create <file> <content>, read <file>, delete <file>, list, write <file> <data>, append <file> <data>, exit")
    while True:
        try:
            line = input("> ").strip()
            if not line or line == 'exit':
                break
            
            if line.startswith('write '):
                _, rest = line.split(' ', 1)
                fname, data = rest.split(' ', 1)
                send_command('write', fname, data)
                continue
            if line.startswith('append '):
                
                _, rest = line.split(' ', 1)
                fname, data = rest.split(' ', 1)
                send_command('append', fname, data)
                continue

            parts = line.split(maxsplit=2)
            cmd = parts[0].lower()
            if cmd == 'create' and len(parts) >= 3:
                fname, content = parts[1], parts[2]
                send_command('create', fname, content)
            elif cmd == 'read' and len(parts) == 2:
                send_command('read', parts[1])
            elif cmd == 'delete' and len(parts) == 2:
                send_command('delete', parts[1])
            elif cmd == 'list':
                send_command('list', '')  
            else:
                print("Invalid command")
        except KeyboardInterrupt:
            break
    print("Client exiting.")

if __name__ == '__main__':
    main()