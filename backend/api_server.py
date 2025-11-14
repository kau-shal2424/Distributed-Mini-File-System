from flask import Flask, request, jsonify
from flask_cors import CORS
import socket
import json
import time

app = Flask(__name__)
CORS(app)  

MASTER_HOST = 'localhost'
MASTER_PORT = 5000

def send_command_to_master(cmd: str, fname: str = '', args: str = '') -> str:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect((MASTER_HOST, MASTER_PORT))
        if cmd in ['list', 'system_info']:
            
            msg = f"{cmd}::"
        elif fname:
            msg = f"{cmd}:{fname}:{args}"
        else:
            msg = f"{cmd}::{args}"
        sock.send(msg.encode())
        response = sock.recv(65536).decode()  
        sock.close()
        return response
    except Exception as e:
        return f"ERROR: {e}"

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        response = send_command_to_master('list', '')
        return jsonify({'status': 'healthy', 'master_available': True}), 200
    except:
        return jsonify({'status': 'unhealthy', 'master_available': False}), 503

@app.route('/api/files', methods=['GET'])
def list_files():
    try:
        response = send_command_to_master('list', '')
        if response.startswith('ERROR'):
            return jsonify({'error': response}), 500
        files = json.loads(response)
        return jsonify({'files': files}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<path:filename>', methods=['GET'])
def read_file(filename):
    try:
        response = send_command_to_master('read', filename)
        if response.startswith('ERROR'):
            return jsonify({'error': response}), 404
        if response.startswith('WARNING'):
            
            return jsonify({
                'content': response,
                'warning': True
            }), 200
        return jsonify({'content': response, 'filename': filename}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<path:filename>', methods=['POST'])
def create_file(filename):
    try:
        data = request.get_json()
        content = data.get('content', '')
        if not content:
            return jsonify({'error': 'Content is required'}), 400
        
        response = send_command_to_master('create', filename, content)
        if response.startswith('ERROR'):
            return jsonify({'error': response}), 500
        
        return jsonify({
            'message': response,
            'filename': filename
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<path:filename>', methods=['PUT'])
def write_file(filename):
    try:
        data = request.get_json()
        content = data.get('content', '')
        
        response = send_command_to_master('write', filename, content)
        if response.startswith('ERROR'):
            return jsonify({'error': response}), 500
        
        return jsonify({
            'message': response,
            'filename': filename
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<path:filename>/append', methods=['POST'])
def append_to_file(filename):
    try:
        data = request.get_json()
        content = data.get('content', '')
        if not content:
            return jsonify({'error': 'Content is required'}), 400
        
        response = send_command_to_master('append', filename, content)
        if response.startswith('ERROR'):
            return jsonify({'error': response}), 500
        
        return jsonify({
            'message': response,
            'filename': filename
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<path:filename>', methods=['DELETE'])
def delete_file(filename):
    try:
        response = send_command_to_master('delete', filename)
        if response.startswith('ERROR'):
            return jsonify({'error': response}), 500
        
        return jsonify({
            'message': response,
            'filename': filename
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<path:filename>/metadata', methods=['GET'])
def get_file_metadata(filename):
    try:
        response = send_command_to_master('metadata', filename)
        if response.startswith('ERROR'):
            return jsonify({'error': response}), 404
        metadata = json.loads(response)
        return jsonify(metadata), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/system/status', methods=['GET'])
def system_status():
    try:
        file_response = send_command_to_master('list', '')
        files = json.loads(file_response) if not file_response.startswith('ERROR') else []
        
        system_response = send_command_to_master('system_info', '')
        system_info = json.loads(system_response) if not system_response.startswith('ERROR') else {}
        
        return jsonify({
            'status': 'operational',
            'master_available': True,
            'file_count': len(files),
            'system_info': system_info,
            'timestamp': time.time()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'degraded',
            'master_available': False,
            'error': str(e),
            'timestamp': time.time()
        }), 503

if __name__ == '__main__':
    print("REST API Server starting on http://localhost:8000")
    print("Make sure the master node is running on port 5000")
    app.run(host='localhost', port=8000, debug=True)

