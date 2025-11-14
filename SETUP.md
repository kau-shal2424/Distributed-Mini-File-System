# Quick Setup Guide

## Prerequisites
- Python 3.7+
- Node.js 14+ and npm

## Quick Start

### Step 1: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 3: Start Services (in separate terminals)

**Terminal 1 - Master Node:**
```bash
cd backend
python master_node.py
```

**Terminal 2 - Data Node 1:**
```bash
cd backend
python data_node.py 1
```

**Terminal 3 - Data Node 2:**
```bash
cd backend
python data_node.py 2
```

**Terminal 4 - Data Node 3:**
```bash
cd backend
python data_node.py 3
```

**Terminal 5 - REST API Server:**
```bash
cd backend
python api_server.py
```

**Terminal 6 - React Frontend:**
```bash
cd frontend
npm start
```

The React app will open at `http://localhost:3000`

## What's Running

- **Master Node**: Port 5000 (coordinates file operations)
- **Data Nodes**: Ports 5001, 5002, 5003 (store file chunks)
- **REST API**: Port 8000 (bridges frontend with master node)
- **React Frontend**: Port 3000 (web interface)

## Troubleshooting

1. **Port already in use**: Stop any processes using ports 5000-5003, 8000, or 3000
2. **Master node not responding**: Make sure master node is running before starting API server
3. **Data nodes not connecting**: Ensure all 3 data nodes are running before creating files
4. **CORS errors**: Make sure API server is running and accessible on port 8000

