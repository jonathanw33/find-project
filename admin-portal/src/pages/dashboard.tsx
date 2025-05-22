import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Users, Map, Truck, AlertTriangle, CheckCircle, 
  ExternalLink, Battery, BatteryCharging, BatteryWarning
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { supabase } from '@/utils/supabase';
import { TrackerWithUserInfo, UserWithTrackersCount } from '@/types/supabase';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';

const Dashboard: React.FC = () => {
  const [usersCount, setUsersCount] = useState<number>(0);
  const [trackersStats, setTrackersStats] = useState({
    total: 0,
    connected: 0,
    disconnected: 0,
    lowBattery: 0
  });
  const [recoveryRequestsCount, setRecoveryRequestsCount] = useState<number>(0);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get users count
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;
        setUsersCount(usersCount || 0);

        // Get trackers stats
        const { data: trackers, error: trackersError } = await supabase
          .from('trackers')
          .select('*');

        if (trackersError) throw trackersError;
        
        if (trackers) {
          const connected = trackers.filter(t => t.connection_status === 'connected').length;
          const disconnected = trackers.filter(t => t.connection_status === 'disconnected').length;
          const lowBattery = trackers.filter(t => t.battery_level !== null && t.battery_level < 20).length;
          
          setTrackersStats({
            total: trackers.length,
            connected,
            disconnected,
            lowBattery
          });
        }

        // Get recovery requests count
        const { count: recoveryCount, error: recoveryError } = await supabase
          .from('logistics_requests')
          .select('*', { count: 'exact', head: true });

        if (recoveryError) throw recoveryError;
        setRecoveryRequestsCount(recoveryCount || 0);

        // Get recent alerts
        const { data: alerts, error: alertsError } = await supabase
          .from('alerts')
          .select('*, trackers(name), profiles(email)')
          .order('timestamp', { ascending: false })
          .limit(5);

        if (alertsError) throw alertsError;
        setRecentAlerts(alerts || []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AdminLayout>
      <Head>
        <title>Dashboard | FIND Admin Portal</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">Overview of the FIND tracking system</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Users */}
          <div className="card bg-white flex items-center p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{loading ? '...' : usersCount}</p>
            </div>
          </div>

          {/* Trackers */}
          <div className="card bg-white flex items-center p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Trackers</p>
              <p className="text-2xl font-semibold text-gray-900">{loading ? '...' : trackersStats.total}</p>
            </div>
          </div>

          {/* Disconnected Trackers */}
          <div className="card bg-white flex items-center p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Disconnected</p>
              <p className="text-2xl font-semibold text-gray-900">{loading ? '...' : trackersStats.disconnected}</p>
            </div>
          </div>

          {/* Recovery Requests */}
          <div className="card bg-white flex items-center p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Recovery Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{loading ? '...' : recoveryRequestsCount}</p>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Alerts</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary-600"></div>
              </div>
            ) : recentAlerts.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentAlerts.map((alert: any) => (
                  <div key={alert.id} className="py-4 flex items-start">
                    <div className={`mr-4 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      alert.type === 'left_behind' ? 'bg-amber-100 text-amber-600' :
                      alert.type === 'low_battery' ? 'bg-red-100 text-red-600' :
                      alert.type === 'moved' ? 'bg-blue-100 text-blue-600' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {alert.type === 'left_behind' && <AlertTriangle className="h-5 w-5" />}
                      {alert.type === 'low_battery' && <BatteryWarning className="h-5 w-5" />}
                      {alert.type === 'moved' && <Map className="h-5 w-5" />}
                      {alert.type === 'out_of_range' && <ExternalLink className="h-5 w-5" />}
                      {alert.type === 'custom' && <AlertTriangle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-500">{alert.message}</p>
                      <div className="mt-1 flex items-center">
                        <p className="text-xs text-gray-500">
                          Tracker: {alert.trackers?.name || 'Unknown'}
                        </p>
                        <span className="mx-2 text-gray-300">•</span>
                        <p className="text-xs text-gray-500">
                          User: {alert.profiles?.email || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent alerts found</p>
            )}
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <Link href="/alerts" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              View all alerts
            </Link>
          </div>
        </div>

        {/* Battery Status */}
        <div className="card bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Battery Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center bg-green-50 p-4 rounded-lg">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <BatteryCharging className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Good</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? '...' : trackersStats.total - trackersStats.lowBattery - trackersStats.disconnected}
                  </p>
                  <p className="text-xs text-gray-500">Battery &gt; 20%</p>
                </div>
              </div>
              
              <div className="flex items-center bg-amber-50 p-4 rounded-lg">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <BatteryWarning className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Low</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? '...' : trackersStats.lowBattery}
                  </p>
                  <p className="text-xs text-gray-500">Battery &lt; 20%</p>
                </div>
              </div>
              
              <div className="flex items-center bg-red-50 p-4 rounded-lg">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Unknown</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? '...' : trackersStats.disconnected}
                  </p>
                  <p className="text-xs text-gray-500">Disconnected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Analytics & Insights</h2>
              <p className="text-gray-600">Comprehensive data visualization and trends analysis</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>
          <DashboardAnalytics className="mb-8" />
        </div>

        {/* Quick Action Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/trackers" className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              <Map className="h-5 w-5 mr-2 text-primary-600" />
              View All Trackers
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Monitor and manage all tracking devices
            </p>
          </Link>
          
          <Link href="/users" className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              <Users className="h-5 w-5 mr-2 text-primary-600" />
              Manage Users
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              View user accounts and their trackers
            </p>
          </Link>
          
          <Link href="/recovery" className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              <Truck className="h-5 w-5 mr-2 text-primary-600" />
              Recovery Requests
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage logistics for lost trackers
            </p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;