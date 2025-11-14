# Distributed Mini File System

A distributed file system implementation with a React frontend, similar to Google File System (GFS) and Hadoop Distributed File System (HDFS).

## Features

- **Distributed Storage**: Files are chunked and replicated across multiple data nodes
- **Fault Tolerance**: Automatic replication with RF=2 (2 replicas per chunk)
- **Heartbeat Monitoring**: Master node monitors data node health
- **Automatic Recovery**: Failed chunks are automatically re-replicated
- **Modern Web UI**: Beautiful React frontend for file management
- **REST API**: RESTful API for frontend-backend communication

## Architecture

```
React Frontend → REST API Server (Flask) → Master Node → Data Nodes
     (3000)              (8000)              (5000)      (5001-5003)
```

### Components

1. **Master Node** (`backend/master_node.py`): Coordinates file operations, manages metadata, handles replication
2. **Data Nodes** (`backend/data_node.py`): Store file chunks on disk
3. **REST API Server** (`backend/api_server.py`): Bridges React frontend with socket-based master node
4. **React Frontend** (`frontend/`): Modern web interface for file operations

## Setup Instructions

### Prerequisites

- Python 3.7+
- Node.js 14+ and npm
- pip (Python package manager)

### Backend Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Start the Master Node (Terminal 1):
```bash
cd backend
python master_node.py
```

3. Start Data Nodes (Terminal 2, 3, 4):
```bash
cd backend
python data_node.py 1    # Terminal 2 - Node 1 (port 5001)
python data_node.py 2    # Terminal 3 - Node 2 (port 5002)
python data_node.py 3    # Terminal 4 - Node 3 (port 5003)
```

4. Start the REST API Server (Terminal 5):
```bash
cd backend
python api_server.py
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the React development server:
```bash
npm start
```

The frontend will open at `http://localhost:3000`

## Usage

### Web UI

1. Open `http://localhost:3000` in your browser
2. Create files, read, edit, append, and delete files through the intuitive interface
3. Monitor system status and data node health in real-time

### Command Line Client

You can also use the CLI client:

```bash
cd backend
python client.py
```

Available commands:
- `create <file> <content>` - Create a new file
- `read <file>` - Read file contents
- `write <file> <data>` - Overwrite file
- `append <file> <data>` - Append to file
- `delete <file>` - Delete a file
- `list` - List all files
- `exit` - Exit the client

## API Endpoints

The REST API provides the following endpoints:

- `GET /api/health` - Health check
- `GET /api/files` - List all files
- `GET /api/files/<filename>` - Read file content
- `POST /api/files/<filename>` - Create new file
- `PUT /api/files/<filename>` - Write/overwrite file
- `POST /api/files/<filename>/append` - Append to file
- `DELETE /api/files/<filename>` - Delete file
- `GET /api/files/<filename>/metadata` - Get file metadata (chunks, replicas)
- `GET /api/system/status` - Get system status and node information

## File Operations

- **Create**: Files are automatically chunked (1024 bytes per chunk) and replicated
- **Read**: Reads from available replicas (handles node failures gracefully)
- **Write**: Overwrites entire file, redistributes chunks
- **Append**: Appends content and redistributes chunks as needed
- **Delete**: Removes file from all nodes

## System Monitoring

The frontend displays:
- System health status
- Number of files in the system
- Data node status (alive/dead)
- Active node count
- Real-time updates (refreshes every 5 seconds)

## Technical Details

- **Chunk Size**: 1024 bytes
- **Replication Factor**: 2 (each chunk stored on 2 nodes)
- **Heartbeat Interval**: 5 seconds
- **Heartbeat Timeout**: 15 seconds
- **Auto Replication**: Checks and re-replicates every 10 seconds

## Project Structure

```
Distributed-Mini-File-System/
├── backend/
│   ├── master_node.py      # Master node server
│   ├── data_node.py        # Data node server
│   ├── client.py           # CLI client
│   ├── api_server.py       # REST API server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── package.json        # Node dependencies
└── README.md
```

## Development

### Running in Development Mode

Backend (API Server) runs with debug mode enabled.
Frontend runs with hot-reload enabled.

### Testing

1. Start all backend services (master, 3 data nodes, API server)
2. Start frontend
3. Test file operations through the UI
4. Monitor logs in terminal windows

## License

MIT License
