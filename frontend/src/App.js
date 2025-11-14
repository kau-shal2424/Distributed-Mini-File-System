import React, { useState, useEffect } from 'react';
import './App.css';
import FileList from './components/FileList';
import FileEditor from './components/FileEditor';
import SystemStatus from './components/SystemStatus';
import Header from './components/Header';
import FileMetadata from './components/FileMetadata';
import Dashboard from './components/Dashboard';

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [metadataFile, setMetadataFile] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/files');
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data.files || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (filename) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}`);
      if (!response.ok) throw new Error('Failed to fetch file');
      const data = await response.json();
      setSelectedFile(filename);
      setFileContent(data.content || '');
    } catch (err) {
      setError(err.message);
      setFileContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleFileCreate = async (filename, content) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create file');
      }
      setRefreshTrigger(prev => prev + 1);
      setSelectedFile(filename);
      setFileContent(content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileWrite = async (filename, content) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to write file');
      }
      setFileContent(content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileAppend = async (filename, content) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}/append`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to append to file');
      }
      await handleFileSelect(filename); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete file');
      }
      if (selectedFile === filename) {
        setSelectedFile(null);
        setFileContent('');
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewFile = () => {
    setSelectedFile(null);
    setFileContent('');
    setError(null);
    
  };

  if (showDashboard) {
    return (
      <div className="App">
        <Header onRefresh={fetchFiles} onNewFile={handleNewFile} />
        <div className="dashboard-toggle">
          <button className="toggle-btn" onClick={() => setShowDashboard(false)}>
            ← Back to Files
          </button>
        </div>
        <Dashboard />
      </div>
    );
  }

  return (
    <div className="App">
      <Header onRefresh={fetchFiles} onNewFile={handleNewFile} />
      <div className="dashboard-toggle">
        <button className="toggle-btn" onClick={() => setShowDashboard(true)}>
          📊 View Dashboard
        </button>
      </div>
      <div className="app-container">
        <aside className="sidebar">
          <SystemStatus />
          <FileList
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onFileDelete={handleFileDelete}
            onNewFile={handleNewFile}
            onShowMetadata={setMetadataFile}
            loading={loading}
          />
        </aside>
        <main className="main-content">
          <FileEditor
            selectedFile={selectedFile}
            content={fileContent}
            onContentChange={setFileContent}
            onCreate={handleFileCreate}
            onWrite={handleFileWrite}
            onAppend={handleFileAppend}
            onNewFile={handleNewFile}
            loading={loading}
            error={error}
          />
        </main>
      </div>
      {metadataFile && (
        <FileMetadata
          filename={metadataFile}
          onClose={() => setMetadataFile(null)}
        />
      )}
    </div>
  );
}

export default App;

