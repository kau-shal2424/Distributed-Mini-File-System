import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
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

function ChunkDistributionChart({ metadata }) {
  if (!metadata || !metadata.replicas || metadata.replicas.length === 0) {
    return <div className="chart-empty">No data to display</div>;
  }

  // Calculate node usage
  const nodeUsage = {};
  metadata.replicas.forEach(chunk => {
    chunk.replica_nodes.forEach(nodeId => {
      nodeUsage[nodeId] = (nodeUsage[nodeId] || 0) + 1;
    });
  });

  const nodeIds = Object.keys(nodeUsage).sort((a, b) => parseInt(a) - parseInt(b));
  const chunkCounts = nodeIds.map(nodeId => nodeUsage[nodeId]);

  // Doughnut chart data
  const doughnutData = {
    labels: nodeIds.map(id => `Node ${id}`),
    datasets: [
      {
        label: 'Chunks Stored',
        data: chunkCounts,
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(102, 126, 234, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Bar chart data
  const barData = {
    labels: nodeIds.map(id => `Node ${id}`),
    datasets: [
      {
        label: 'Number of Chunks',
        data: chunkCounts,
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
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
            return `${label}: ${value} chunk${value !== 1 ? 's' : ''}`;
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
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Number of Chunks',
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
        <h4>Chunk Distribution (Doughnut)</h4>
        <div className="chart-wrapper">
          <Doughnut data={doughnutData} options={chartOptions} />
        </div>
      </div>
      <div className="chart-section">
        <h4>Chunk Distribution (Bar)</h4>
        <div className="chart-wrapper">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}

export default ChunkDistributionChart;

