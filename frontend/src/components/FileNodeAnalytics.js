import React, { useEffect, useState } from 'react';
import './Dashboard.css';

function FileNodeAnalytics() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filesRes = await fetch('/api/files');
        if (!filesRes.ok) throw new Error('Failed to fetch files');
        const filesData = await filesRes.json();
        const files = filesData.files || [];

        if (!files.length) {
          setRows([]);
          setLoading(false);
          return;
        }

        const limitedFiles = files.slice(0, 20); // limit for dashboard view

        const metadataPromises = limitedFiles.map(async (fname) => {
          try {
            const res = await fetch(`/api/files/${encodeURIComponent(fname)}/metadata`);
            if (!res.ok) return { filename: fname, chunks: 0, nodes: [], replicas: 0 };
            const meta = await res.json();
            const replicas = meta.replicas || [];
            const nodeSet = new Set();
            replicas.forEach((r) => {
              (r.replica_nodes || []).forEach((nid) => nodeSet.add(nid));
            });
            return {
              filename: fname,
              chunks: meta.chunks || replicas.length || 0,
              nodes: Array.from(nodeSet).sort((a, b) => a - b),
              replicas: replicas.length,
            };
          } catch {
            return { filename: fname, chunks: 0, nodes: [], replicas: 0 };
          }
        });

        const results = await Promise.all(metadataPromises);
        setRows(results);
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="chart-loading">Loading file-node analytics...</div>;
  }

  if (error) {
    return <div className="chart-empty">Error: {error}</div>;
  }

  if (!rows.length) {
    return <div className="chart-empty">No files available for analytics.</div>;
  }

  return (
    <div className="file-node-analytics">
      <div className="analytics-header">
        <span>File</span>
        <span>Chunks</span>
        <span>Replica Entries</span>
        <span>Data Nodes</span>
      </div>
      <div className="analytics-body">
        {rows.map((row) => (
          <div className="analytics-row" key={row.filename}>
            <span className="analytics-file" title={row.filename}>{row.filename}</span>
            <span>{row.chunks}</span>
            <span>{row.replicas}</span>
            <span className="analytics-nodes">
              {row.nodes.length ? row.nodes.map((nid) => `Node ${nid}`).join(', ') : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FileNodeAnalytics;
