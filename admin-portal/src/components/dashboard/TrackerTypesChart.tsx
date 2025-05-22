import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

interface TrackerTypesChartProps {
  physicalCount: number;
  virtualCount: number;
  loading?: boolean;
}

const TrackerTypesChart: React.FC<TrackerTypesChartProps> = ({
  physicalCount,
  virtualCount,
  loading = false,
}) => {
  const total = physicalCount + virtualCount;
  
  const data = {
    labels: ['Physical Trackers', 'Virtual Trackers'],
    datasets: [
      {
        label: 'Tracker Types',
        data: [physicalCount, virtualCount],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue for physical
          'rgba(168, 85, 247, 0.8)', // Purple for virtual
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500' as const,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '60%',
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show message if no trackers
  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tracker Types Distribution</h3>
          <p className="text-sm text-gray-600">Physical vs Virtual tracker breakdown</p>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📍</div>
            <p className="text-sm">No trackers found</p>
            <p className="text-xs text-gray-400">Tracker distribution will appear here once trackers are added</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tracker Types Distribution</h3>
        <p className="text-sm text-gray-600">Physical vs Virtual tracker breakdown</p>
      </div>
      <div className="h-64">
        <Doughnut data={data} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{physicalCount}</div>
          <div className="text-xs text-blue-500">Physical Trackers</div>
          <div className="text-xs text-gray-500 mt-1">Hardware devices</div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{virtualCount}</div>
          <div className="text-xs text-purple-500">Virtual Trackers</div>
          <div className="text-xs text-gray-500 mt-1">Software-based</div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">{total}</span> trackers
        </div>
      </div>
    </div>
  );
};

export default TrackerTypesChart;