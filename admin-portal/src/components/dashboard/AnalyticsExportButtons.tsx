import React from 'react';
import { Download, FileText, Database } from 'lucide-react';
import { exportToCSV, exportToJSON } from '@/utils/export';

interface AnalyticsExportButtonsProps {
  trackerData: any[];
  userActivityData: any[];
  batteryData: any[];
  alertsData: any[];
}

const AnalyticsExportButtons: React.FC<AnalyticsExportButtonsProps> = ({
  trackerData,
  userActivityData,
  batteryData,
  alertsData,
}) => {
  const handleExportAll = (format: 'csv' | 'json') => {
    const allData = {
      trackers: trackerData,
      userActivity: userActivityData,
      batteryDistribution: batteryData,
      alertTrends: alertsData,
      exportDate: new Date().toISOString(),
      summary: {
        totalTrackers: trackerData?.length || 0,
        totalUsers: userActivityData?.reduce((sum, day) => sum + day.activeUsers, 0) || 0,
        totalAlerts: alertsData?.reduce((sum, day) => sum + day.lowBattery + day.disconnected + day.geofence + day.leftBehind, 0) || 0,
      }
    };

    if (format === 'csv') {
      // For CSV, we'll export each dataset separately
      exportToCSV(trackerData, 'trackers_data');
      exportToCSV(userActivityData, 'user_activity_data');
      exportToCSV(batteryData, 'battery_distribution_data');
      exportToCSV(alertsData, 'alert_trends_data');
    } else {
      exportToJSON([allData], 'dashboard_analytics');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleExportAll('csv')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <FileText className="h-4 w-4 mr-2" />
        Export CSV
      </button>
      <button
        onClick={() => handleExportAll('json')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <Database className="h-4 w-4 mr-2" />
        Export JSON
      </button>
    </div>
  );
};

export default AnalyticsExportButtons;