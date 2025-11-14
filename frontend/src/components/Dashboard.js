import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import NodeStatusChart from './NodeStatusChart';
import SystemStatus from './SystemStatus';
import FileTypeDistributionChart from './FileTypeDistributionChart';
import FileNodeAnalytics from './FileNodeAnalytics';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [stats, setStats] = useState({
    fileCountHistory: [],
    nodeCountHistory: [],
    labels: []
  });
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/system/status');
        const data = await response.json();
        setSystemStatus(data);
        
        setStats(prev => {
          const newLabels = [...prev.labels];
          const newFileCount = [...prev.fileCountHistory];
          const newNodeCount = [...prev.nodeCountHistory];
          
          const timestamp = new Date().toLocaleTimeString();
          
          // Keep only last 10 data points
          if (newLabels.length >= 10) {
            newLabels.shift();
            newFileCount.shift();
            newNodeCount.shift();
          }
          
          newLabels.push(timestamp);
          newFileCount.push(data.file_count || 0);
          newNodeCount.push(data.system_info?.alive_nodes || 0);
          
          return {
            labels: newLabels,
            fileCountHistory: newFileCount,
            nodeCountHistory: newNodeCount
          };
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const lineData = {
    labels: stats.labels,
    datasets: [
      {
        label: 'File Count',
        data: stats.fileCountHistory,
        borderColor: 'rgba(102, 126, 234, 1)',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Alive Nodes',
        data: stats.nodeCountHistory,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'System Metrics Over Time',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const aliveNodes = systemStatus?.system_info?.alive_nodes || 0;
  const totalNodes = systemStatus?.system_info?.data_nodes
    ? Object.keys(systemStatus.system_info.data_nodes).length
    : 0;
  const totalFiles = systemStatus?.file_count || 0;

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">📊 System Dashboard</h2>

      <div className="dashboard-summary">
        <div className="summary-card">
          <div className="summary-label">Total Files</div>
          <div className="summary-value">{totalFiles}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Alive Nodes</div>
          <div className="summary-value">{aliveNodes}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Dead Nodes</div>
          <div className="summary-value">{Math.max(totalNodes - aliveNodes, 0)}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>System Status</h3>
          <SystemStatus />
        </div>

        <div className="dashboard-card full-width">
          <h3>Real-time Metrics</h3>
          <div className="chart-wrapper-large">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        <div className="dashboard-card">
          <h3>File Type Distribution</h3>
          <FileTypeDistributionChart />
        </div>

        <div className="dashboard-card">
          <h3>Node Status Visualization</h3>
          <NodeStatusChart />
        </div>

        <div className="dashboard-card full-width">
          <h3>File Placement Across Nodes</h3>
          <FileNodeAnalytics />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
