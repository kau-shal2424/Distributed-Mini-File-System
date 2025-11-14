import React, { useState, useEffect } from 'react';
import './SystemStatus.css';

function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/system/status');
      const data = await response.json();
      setStatus(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching status:', err);
      setStatus({ status: 'unavailable', master_available: false });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="system-status">
        <h3>System Status</h3>
        <div className="status-loading">Loading...</div>
      </div>
    );
  }

  const isHealthy = status?.master_available && status?.status === 'operational';
  const systemInfo = status?.system_info || {};
  const totalNodes = systemInfo.data_nodes ? Object.keys(systemInfo.data_nodes).length : 0;

  return (
    <div className="system-status">
      <h3>System Status</h3>
      <div className={`status-indicator ${isHealthy ? 'healthy' : 'unhealthy'}`}>
        <span className="status-dot"></span>
        {isHealthy ? 'Operational' : 'Degraded'}
      </div>
      
      {status?.master_available && (
        <div className="status-details">
          <div className="status-item">
            <span className="status-label">Files:</span>
            <span className="status-value">{status.file_count || 0}</span>
          </div>
          {systemInfo.alive_nodes !== undefined && totalNodes > 0 && (
            <div className="status-item">
              <span className="status-label">Active Nodes:</span>
              <span className="status-value">{systemInfo.alive_nodes} / {totalNodes}</span>
            </div>
          )}
          {systemInfo.data_nodes && (
            <div className="node-status">
              <div className="status-label">Data Nodes:</div>
              {Object.entries(systemInfo.data_nodes).map(([nodeId, node]) => (
                <div key={nodeId} className={`node-item ${node.status === 'alive' ? 'alive' : 'dead'}`}>
                  <span>Node {nodeId}</span>
                  <span className="node-status-badge">{node.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SystemStatus;

