import React, { useState, useEffect } from 'react';
import './FileEditor.css';
import FileMetadata from './FileMetadata';

function FileEditor({
  selectedFile,
  content,
  onContentChange,
  onCreate,
  onWrite,
  onAppend,
  onNewFile,
  loading,
  error
}) {
  const [newFileName, setNewFileName] = useState('');
  const [appendText, setAppendText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  const [shouldShowCreate, setShouldShowCreate] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      setShowCreateForm(false);
      setNewFileName('');
      setShouldShowCreate(false);
    } else if (!selectedFile && shouldShowCreate) {
      // When selectedFile is cleared and shouldShowCreate is true, show form
      setShowCreateForm(true);
      setShouldShowCreate(false);
    }
  }, [selectedFile, shouldShowCreate]);
  
  // Handle new file creation from header/filelist buttons
  const handleNewFileClick = () => {
    if (onNewFile) {
      setShouldShowCreate(true); // Signal that we want to show create form
      onNewFile(); // This will clear selectedFile, triggering the useEffect above
    } else {
      setShowCreateForm(true);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreate(newFileName.trim(), content || '');
    setShowCreateForm(false);
    setNewFileName('');
  };

  const handleSave = () => {
    if (!selectedFile) return;
    onWrite(selectedFile, content);
  };

  const handleAppend = () => {
    if (!selectedFile || !appendText.trim()) return;
    onAppend(selectedFile, appendText);
    setAppendText('');
  };

  return (
    <div className="file-editor">
      {!selectedFile && !showCreateForm ? (
        <div className="editor-empty">
          <div className="empty-icon">📝</div>
          <h2>No File Selected</h2>
          <p>Select a file from the list or create a new one</p>
          <button
            className="create-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New File
          </button>
        </div>
      ) : (!selectedFile && showCreateForm) ? (
        <div className="create-form">
          <h2>Create New File</h2>
          <form onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Enter filename"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="filename-input"
              autoFocus
            />
            <textarea
              placeholder="Enter file content..."
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="content-textarea"
              rows={20}
            />
            <div className="editor-actions">
              <button type="submit" className="save-btn" disabled={loading || !newFileName.trim()}>
                {loading ? 'Creating...' : 'Create File'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewFileName('');
                  onContentChange('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
          {error && <div className="error-message">Error: {error}</div>}
        </div>
      ) : (
        <>
          <div className="editor-header">
            <h3 className="editor-filename">
              <span className="file-icon-header">📄</span>
              {selectedFile}
            </h3>
            <div className="editor-header-actions">
              <button
                className="metadata-btn"
                onClick={() => setShowMetadata(true)}
                title="View File Distribution"
              >
                📊 Nodes
              </button>
              <button
                className="new-file-btn-header"
                onClick={handleNewFileClick}
                title="Create New File"
              >
                + New
              </button>
              <button
                className="append-btn"
                onClick={handleAppend}
                disabled={loading || !appendText.trim()}
              >
                Append
              </button>
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="append-section">
            <input
              type="text"
              placeholder="Enter text to append..."
              value={appendText}
              onChange={(e) => setAppendText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAppend()}
              className="append-input"
            />
          </div>

          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="content-textarea"
            placeholder="File content..."
            disabled={loading}
            rows={25}
          />

          {error && <div className="error-message">Error: {error}</div>}
        </>
      )}
      {showMetadata && selectedFile && (
        <FileMetadata
          filename={selectedFile}
          onClose={() => setShowMetadata(false)}
        />
      )}
    </div>
  );
}

export default FileEditor;

