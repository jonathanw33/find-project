import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, 
  Map, 
  Battery, 
  BatteryCharging, 
  BatteryWarning, 
  Signal, 
  SignalZero,
  Truck,
  RefreshCw,
  Calendar,
  User,
  MapPin,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { supabase } from '@/utils/supabase';
import { TrackerWithUserInfo } from '@/types/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { getTrackerDisplayStatus } from '@/utils/trackerRecoveryStatus';

const TrackerDetails: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [tracker, setTracker] = useState<TrackerWithUserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTrackerDetails();
    }
  }, [id]);

  const fetchTrackerDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('trackers')
        .select(`
          *,
          profiles:user_id (
            email,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Tracker not found');

      // Transform data similar to the trackers list
      const lastSeen = data.last_seen_timestamp ? new Date(data.last_seen_timestamp) : null;
      const isDisconnected = data.connection_status === 'disconnected';
      const isLostTime = lastSeen ? (Date.now() - lastSeen.getTime() > 24 * 60 * 60 * 1000) : false;
      
      const recoveryDisplayStatus = getTrackerDisplayStatus(data.id);
      const isLost = recoveryDisplayStatus.status === 'lost' || 
                     (recoveryDisplayStatus.status === 'normal' && (isDisconnected || isLostTime));

      const transformedTracker: TrackerWithUserInfo = {
        ...data,
        user_email: data.profiles?.email || 'Unknown',
        user_name: data.profiles?.name || 
                   data.profiles?.email?.split('@')[0] || 
                   'Unknown User',
        is_lost: isLost,
        recovery_status: recoveryDisplayStatus.status
      };

      setTracker(transformedTracker);
    } catch (error: any) {
      console.error('Error fetching tracker details:', error);
      setError(error.message || 'Failed to fetch tracker details');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions (same as in trackers list)
  const getConnectionStatus = (tracker: TrackerWithUserInfo) => {
    if (tracker.recovery_status === 'recovering') return 'Recovering';
    if (tracker.is_lost) return 'Lost';
    if (!tracker.connection_status) return 'Unknown';
    return tracker.connection_status.charAt(0).toUpperCase() + tracker.connection_status.slice(1);
  };

  const getStatusBadge = (tracker: TrackerWithUserInfo) => {
    const status = getConnectionStatus(tracker);
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'Connected':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Disconnected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'Lost':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'Recovering':
        return `${baseClasses} bg-amber-100 text-amber-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getBatteryIcon = (batteryLevel: number | null) => {
    if (batteryLevel === null) return <Battery className="h-5 w-5 text-gray-400" />;
    if (batteryLevel < 20) return <BatteryWarning className="h-5 w-5 text-red-500" />;
    if (batteryLevel >= 20 && batteryLevel < 50) return <Battery className="h-5 w-5 text-amber-500" />;
    return <BatteryCharging className="h-5 w-5 text-green-500" />;
  };

  const formatLastSeen = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-64">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !tracker) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Tracker Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested tracker could not be found.'}</p>
          <Link href="/trackers" className="btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trackers
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>{tracker.name} - Tracker Details | FIND Admin Portal</title>
      </Head>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/trackers"
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tracker.name}</h1>
              <p className="text-gray-600">Tracker Details</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {tracker.is_lost && (
              <Link
                href={`/recovery/new?tracker=${tracker.id}`}
                className="btn-primary"
              >
                <Truck className="h-4 w-4 mr-2" />
                Create Recovery Request
              </Link>
            )}
            <button
              onClick={fetchTrackerDetails}
              className="btn-secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {tracker.is_lost && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Tracker Lost</h3>
                <p className="text-sm text-red-700 mt-1">
                  This tracker appears to be lost and may need recovery assistance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracker Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracker Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <Map className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{tracker.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{tracker.type} tracker</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(tracker)}>
                        {getConnectionStatus(tracker)}
                      </span>
                      {tracker.recovery_status === 'recovering' && (
                        <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Battery Level</span>
                    <div className="flex items-center space-x-2">
                      {getBatteryIcon(tracker.battery_level)}
                      <span className="text-sm text-gray-900">
                        {tracker.battery_level !== null ? `${tracker.battery_level}%` : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Connection</span>
                    <div className="flex items-center space-x-2">
                      {tracker.connection_status === 'connected' ? (
                        <Signal className="h-4 w-4 text-green-500" />
                      ) : (
                        <SignalZero className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm text-gray-900 capitalize">
                        {tracker.connection_status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last Seen</span>
                    <span className="text-sm text-gray-900">
                      {formatLastSeen(tracker.last_seen_timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm text-gray-900">
                      {tracker.created_at ? format(new Date(tracker.created_at), 'MMM d, yyyy') : 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last Updated</span>
                    <span className="text-sm text-gray-900">
                      {tracker.updated_at ? format(new Date(tracker.updated_at), 'MMM d, yyyy') : 'Unknown'}
                    </span>
                  </div>
                  
                  {tracker.ble_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">BLE ID</span>
                      <span className="text-sm text-gray-900 font-mono">
                        {tracker.ble_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            {(tracker.last_seen_latitude && tracker.last_seen_longitude) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Known Location</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Latitude</span>
                    <span className="text-sm text-gray-900 font-mono">
                      {tracker.last_seen_latitude}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Longitude</span>
                    <span className="text-sm text-gray-900 font-mono">
                      {tracker.last_seen_longitude}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <a
                    href={`https://www.google.com/maps?q=${tracker.last_seen_latitude},${tracker.last_seen_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    View on Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h2>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{tracker.user_name}</h3>
                  <p className="text-sm text-gray-500">{tracker.user_email}</p>
                </div>
              </div>
              
              <Link
                href={`/users?search=${encodeURIComponent(tracker.user_email)}`}
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
              >
                View User Profile
                <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                {tracker.is_lost && (
                  <Link
                    href={`/recovery/new?tracker=${tracker.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Create Recovery Request
                  </Link>
                )}
                
                <Link
                  href={`/users?search=${encodeURIComponent(tracker.user_email)}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <User className="h-4 w-4 mr-2" />
                  View Owner
                </Link>
                
                <button
                  onClick={fetchTrackerDetails}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TrackerDetails;