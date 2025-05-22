import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AlertTrendsChartProps {
  data: {
    date: string;
    lowBattery: number;
    disconnected: number;
    geofence: number;
    leftBehind: number;
  }[];
  loading?: boolean;
}

const AlertTrendsChart: React.FC<AlertTrendsChartProps> = ({
  data,
  loading = false,
}) => {
  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })),
    datasets: [
      {
        label: 'Low Battery',
        data: data.map(item => item.lowBattery),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Disconnected',
        data: data.map(item => item.disconnected),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Geofence',
        data: data.map(item => item.geofence),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Left Behind',
        data: data.map(item => item.leftBehind),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: false, // Changed from stacked to show individual trends
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Check if there's any alert data
  const hasAlerts = data.some(item => 
    item.lowBattery > 0 || item.disconnected > 0 || item.geofence > 0 || item.leftBehind > 0
  );

  // Calculate totals for summary
  const totals = {
    lowBattery: data.reduce((sum, day) => sum + day.lowBattery, 0),
    disconnected: data.reduce((sum, day) => sum + day.disconnected, 0),
    geofence: data.reduce((sum, day) => sum + day.geofence, 0),
    leftBehind: data.reduce((sum, day) => sum + day.leftBehind, 0),
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Alert Trends</h3>
        <p className="text-sm text-gray-600">Alert frequency and patterns over the past 7 days</p>
      </div>
      <div className="h-64">
        {hasAlerts ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-sm">No alerts recorded</p>
              <p className="text-xs text-gray-400">Alert trends will appear here as your system generates alerts</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Alert summary */}
      {hasAlerts && (
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-center border-t pt-4">
          <div className="p-2 bg-red-50 rounded">
            <div className="text-lg font-semibold text-red-600">{totals.lowBattery}</div>
            <div className="text-xs text-red-500">Low Battery</div>
          </div>
          <div className="p-2 bg-orange-50 rounded">
            <div className="text-lg font-semibold text-orange-600">{totals.disconnected}</div>
            <div className="text-xs text-orange-500">Disconnected</div>
          </div>
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-lg font-semibold text-blue-600">{totals.geofence}</div>
            <div className="text-xs text-blue-500">Geofence</div>
          </div>
          <div className="p-2 bg-purple-50 rounded">
            <div className="text-lg font-semibold text-purple-600">{totals.leftBehind}</div>
            <div className="text-xs text-purple-500">Left Behind</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertTrendsChart;