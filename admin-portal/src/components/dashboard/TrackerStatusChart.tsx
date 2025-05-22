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

interface TrackerStatusChartProps {
  connected: number;
  disconnected: number;
  lowBattery: number;
  loading?: boolean;
}

const TrackerStatusChart: React.FC<TrackerStatusChartProps> = ({
  connected,
  disconnected,
  lowBattery,
  loading = false,
}) => {
  const data = {
    labels: ['Connected', 'Disconnected', 'Low Battery'],
    datasets: [
      {
        label: 'Tracker Status',
        data: [connected, disconnected, lowBattery],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green for connected
          'rgba(239, 68, 68, 0.8)',  // Red for disconnected
          'rgba(245, 159, 0, 0.8)',  // Orange for low battery
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(245, 159, 0)',
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
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tracker Status Distribution</h3>
        <p className="text-sm text-gray-600">Real-time status overview of all trackers</p>
      </div>
      <div className="h-64">
        <Doughnut data={data} options={options} />
      </div>      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="p-2">
          <div className="text-2xl font-bold text-green-600">{connected}</div>
          <div className="text-xs text-gray-500">Connected</div>
        </div>
        <div className="p-2">
          <div className="text-2xl font-bold text-red-600">{disconnected}</div>
          <div className="text-xs text-gray-500">Disconnected</div>
        </div>
        <div className="p-2">
          <div className="text-2xl font-bold text-orange-600">{lowBattery}</div>
          <div className="text-xs text-gray-500">Low Battery</div>
        </div>
      </div>
    </div>
  );
};

export default TrackerStatusChart;