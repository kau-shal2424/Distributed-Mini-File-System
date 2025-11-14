import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function FileTypeDistributionChart() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const getFileTypeCounts = () => {
    const counts = {};

    files.forEach((filename) => {
      if (typeof filename !== 'string') return;
      const lastDot = filename.lastIndexOf('.');
      const ext = lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : 'no extension';
      counts[ext] = (counts[ext] || 0) + 1;
    });

    return counts;
  };

  const typeCounts = getFileTypeCounts();
  const labels = Object.keys(typeCounts);
  const values = Object.values(typeCounts);

  const pieData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(244, 114, 182, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(52, 211, 153, 0.8)',
          'rgba(248, 113, 113, 0.8)',
          'rgba(96, 165, 250, 0.8)'
        ],
        borderColor: [
          'rgba(102, 126, 234, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(244, 114, 182, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(52, 211, 153, 1)',
          'rgba(248, 113, 113, 1)',
          'rgba(96, 165, 250, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value} file${value === 1 ? '' : 's'}`;
          }
        }
      }
    }
  };

  if (loading) {
    return <div className="chart-loading">Loading file type distribution...</div>;
  }

  if (error) {
    return <div className="chart-empty">Error: {error}</div>;
  }

  if (!labels.length) {
    return <div className="chart-empty">No files available to show distribution.</div>;
  }

  return (
    <div className="chart-section">
      <h4>File Types in System (Pie)</h4>
      <div className="chart-wrapper">
        <Pie data={pieData} options={pieOptions} />
      </div>
    </div>
  );
}

export default FileTypeDistributionChart;
