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
import { format, subDays } from 'date-fns';

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

interface UserActivityTimelineProps {
  data: {
    date: string;
    newUsers: number;
    activeUsers: number;
    newTrackers: number;
  }[];
  loading?: boolean;
}

const UserActivityTimeline: React.FC<UserActivityTimelineProps> = ({
  data,
  loading = false,
}) => {
  // Generate labels for the last 7 days
  const labels = data.length > 0 
    ? data.map(item => format(new Date(item.date), 'MMM dd'))
    : Array.from({ length: 7 }, (_, i) => 
        format(subDays(new Date(), 6 - i), 'MMM dd')
      );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'New Users',
        data: data.map(item => item.newUsers),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Active Users',
        data: data.map(item => item.activeUsers),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'New Trackers',
        data: data.map(item => item.newTrackers),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        fill: true,
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
          padding: 20,
        },
      },
      title: {
        display: false,
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

  // Show message if no data
  const hasData = data.some(item => item.newUsers > 0 || item.activeUsers > 0 || item.newTrackers > 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">User Activity Timeline</h3>
        <p className="text-sm text-gray-600">Daily user engagement and tracker registrations over the past 7 days</p>
      </div>
      <div className="h-64">
        {hasData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-sm">No activity data yet</p>
              <p className="text-xs text-gray-400">User activity will appear here as your system grows</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Summary stats */}
      {hasData && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t pt-4">
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {data.reduce((sum, day) => sum + day.newUsers, 0)}
            </div>
            <div className="text-xs text-gray-500">Total New Users</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {data.length > 0 ? Math.max(...data.map(d => d.activeUsers)) : 0}
            </div>
            <div className="text-xs text-gray-500">Peak Active Users</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-purple-600">
              {data.reduce((sum, day) => sum + day.newTrackers, 0)}
            </div>
            <div className="text-xs text-gray-500">Total New Trackers</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivityTimeline;