import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function NodeStatusChart() {
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/system/status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (err) {
      console.error('Error fetching system status:', err);
    }
  };

  if (!systemStatus || !systemStatus.system_info) {
    return <div className="chart-loading">Loading node status...</div>;
  }

  const systemInfo = systemStatus.system_info;
  const nodes = Object.entries(systemInfo.data_nodes || {});
  
  const aliveCount = nodes.filter(([_, node]) => node.status === 'alive').length;
  const deadCount = nodes.filter(([_, node]) => node.status === 'dead').length;

  // Pie chart for node status
  const pieData = {
    labels: ['Alive Nodes', 'Dead Nodes'],
    datasets: [
      {
        label: 'Node Status',
        data: [aliveCount, deadCount],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Bar chart for individual node status
  const nodeLabels = nodes.map(([id]) => `Node ${id}`);
  const nodeStatusData = nodes.map(([_, node]) => node.status === 'alive' ? 1 : 0);
  
  const barData = {
    labels: nodeLabels,
    datasets: [
      {
        label: 'Node Status (1=Alive, 0=Dead)',
        data: nodeStatusData,
        backgroundColor: nodeStatusData.map(status => 
          status === 1 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: nodeStatusData.map(status => 
          status === 1 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'
        ),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || context.raw;
            if (typeof value === 'number') {
              return `${label}: ${value === 1 ? 'Alive' : 'Dead'}`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return value === 1 ? 'Alive' : 'Dead';
          }
        },
        title: {
          display: true,
          text: 'Status',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Data Nodes',
        },
      },
    },
  };

  return (
    <div className="charts-container">
      <div className="chart-section">
        <h4>Node Status Overview (Pie)</h4>
        <div className="chart-wrapper">
          <Pie data={pieData} options={chartOptions} />
        </div>
      </div>
      <div className="chart-section">
        <h4>Individual Node Status (Bar)</h4>
        <div className="chart-wrapper">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}

export default NodeStatusChart;

