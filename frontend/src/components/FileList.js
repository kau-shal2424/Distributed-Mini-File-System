import React from 'react';
import './FileList.css';

function FileList({ files, selectedFile, onFileSelect, onFileDelete, onNewFile, onShowMetadata, loading }) {
  return (
    <div className="file-list">
      <div className="file-list-header">
        <h3>Files ({files.length})</h3>
        <button className="file-list-new-btn" onClick={onNewFile} title="Create New File">
          +
        </button>
      </div>
      <div className="file-list-content">
        {loading && files.length === 0 ? (
          <div className="file-list-empty">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="file-list-empty">No files yet. Create one to get started!</div>
        ) : (
          files.map((file, index) => (
            <div
              key={index}
              className={`file-item ${selectedFile === file ? 'selected' : ''}`}
            >
              <div className="file-item-main" onClick={() => onFileSelect(file)}>
                <span className="file-icon">📄</span>
                <span className="file-name" title={file}>{file}</span>
              </div>
              <div className="file-item-actions">
                <button
                  className="file-metadata-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onShowMetadata) {
                      onShowMetadata(file);
                    }
                  }}
                  title="View file distribution on nodes"
                >
                  📊
                </button>
                <button
                  className="file-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileDelete(file);
                  }}
                  title="Delete file"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FileList;

