import React, { useState, useEffect, useCallback } from 'react';
import './FileMetadata.css';
import ChunkDistributionChart from './ChunkDistributionChart';

function FileMetadata({ filename, onClose }) {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetadata = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}/metadata`);
      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }
      const data = await response.json();
      setMetadata(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filename]);

  useEffect(() => {
    if (filename) {
      fetchMetadata();
    }
  }, [filename, fetchMetadata]);

  if (loading) {
    return (
      <div className="file-metadata-overlay" onClick={onClose}>
        <div className="file-metadata-modal" onClick={(e) => e.stopPropagation()}>
          <div className="metadata-header">
            <h3>File Metadata: {filename}</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="metadata-loading">Loading metadata...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-metadata-overlay" onClick={onClose}>
        <div className="file-metadata-modal" onClick={(e) => e.stopPropagation()}>
          <div className="metadata-header">
            <h3>File Metadata: {filename}</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="metadata-error">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="file-metadata-overlay" onClick={onClose}>
      <div className="file-metadata-modal" onClick={(e) => e.stopPropagation()}>
        <div className="metadata-header">
          <h3>File Distribution: {filename}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="metadata-content">
          <div className="metadata-summary">
            <div className="summary-item">
              <span className="summary-label">Total Chunks:</span>
              <span className="summary-value">{metadata?.chunks || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Replication Factor:</span>
              <span className="summary-value">
                {metadata?.replicas && metadata.replicas.length > 0
                  ? metadata.replicas[0].replica_count || 2
                  : 0}
              </span>
            </div>
          </div>

          <div className="chunks-list">
            <h4>Chunk Distribution:</h4>
            {metadata?.replicas && metadata.replicas.length > 0 ? (
              <div className="chunks-container">
                {metadata.replicas.map((chunk, index) => (
                  <div key={index} className="chunk-item">
                    <div className="chunk-header">
                      <span className="chunk-id">Chunk {chunk.chunk_id}</span>
                      <span className="chunk-replica-count">
                        {chunk.replica_count} replica{chunk.replica_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="replica-nodes">
                      <span className="replica-label">Stored on nodes:</span>
                      <div className="node-tags">
                        {chunk.replica_nodes && chunk.replica_nodes.length > 0 ? (
                          chunk.replica_nodes.map((nodeId, idx) => (
                            <span key={idx} className="node-tag node-alive">
                              Node {nodeId}
                            </span>
                          ))
                        ) : (
                          <span className="node-tag node-dead">No replicas</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-chunks">No chunks found for this file.              </div>
            )}
          </div>

          {metadata && metadata.replicas && metadata.replicas.length > 0 && (
            <div className="metadata-visualization">
              <h4>Visualization</h4>
              <ChunkDistributionChart metadata={metadata} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileMetadata;

