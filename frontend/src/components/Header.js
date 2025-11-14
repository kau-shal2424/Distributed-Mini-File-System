import React from 'react';
import './Header.css';

function Header({ onRefresh, onNewFile }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <span className="header-icon">📁</span>
          Distributed File System
        </h1>
        <div className="header-actions">
          <button className="new-file-btn" onClick={onNewFile} title="Create New File">
            <span className="btn-icon">+</span>
            New File
          </button>
          <button className="refresh-btn" onClick={onRefresh} title="Refresh">
            🔄
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;

