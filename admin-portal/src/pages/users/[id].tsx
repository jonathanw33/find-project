import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Map, 
  Activity, 
  AlertTriangle,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Signal,
  SignalZero,
  Eye,
  Truck,
  RefreshCw,
  UserCircle,
  Clock,
  MapPin
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { supabase } from '@/utils/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { getTrackerDisplayStatus } from '@/utils/trackerRecoveryStatus';

interface UserDetails {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
}

interface UserTracker {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  battery_level: number | null;
  connection_status: string;
  is_active: boolean;
  last_seen_timestamp: string | null;
  last_seen_latitude: number | null;
  last_seen_longitude: number | null;
  created_at: string;
  is_lost?: boolean;
  recovery_status?: string;
}

const UserDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<UserDetails | null>(null);
  const [trackers, setTrackers] = useState<UserTracker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // Fetch user's trackers
      const { data: trackersData, error: trackersError } = await supabase
        .from('trackers')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (trackersError) throw trackersError;

      // Transform trackers data to include loss status
      const transformedTrackers: UserTracker[] = (trackersData || []).map(tracker => {
        const lastSeen = tracker.last_seen_timestamp ? new Date(tracker.last_seen_timestamp) : null;
        const isDisconnected = tracker.connection_status === 'disconnected';
        const isLostTime = lastSeen ? (Date.now() - lastSeen.getTime() > 24 * 60 * 60 * 1000) : false;
        
        const recoveryDisplayStatus = getTrackerDisplayStatus(tracker.id);
        const isLost = recoveryDisplayStatus.status === 'lost' || 
                       (recoveryDisplayStatus.status === 'normal' && (isDisconnected || isLostTime));

        return {
          ...tracker,
          is_lost: isLost,
          recovery_status: recoveryDisplayStatus.status
        };
      });

      setUser(userData);
      setTrackers(transformedTrackers);
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      setError(error.message || 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getConnectionStatus = (tracker: UserTracker) => {
    if (tracker.recovery_status === 'recovering') return 'Recovering';
    if (tracker.is_lost) return 'Lost';
    if (!tracker.connection_status) return 'Unknown';
    return tracker.connection_status.charAt(0).toUpperCase() + tracker.connection_status.slice(1);
  };

  const getStatusBadge = (tracker: UserTracker) => {
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
    if (batteryLevel === null) return <Battery className="h-4 w-4 text-gray-400" />;
    if (batteryLevel < 20) return <BatteryWarning className="h-4 w-4 text-red-500" />;
    if (batteryLevel >= 20 && batteryLevel < 50) return <Battery className="h-4 w-4 text-amber-500" />;
    return <BatteryCharging className="h-4 w-4 text-green-500" />;
  };

  const formatLastSeen = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate statistics
  const totalTrackers = trackers.length;
  const activeTrackers = trackers.filter(t => t.is_active).length;
  const connectedTrackers = trackers.filter(t => t.connection_status === 'connected').length;
  const lostTrackers = trackers.filter(t => t.is_lost).length;
  const lowBatteryTrackers = trackers.filter(t => t.battery_level !== null && t.battery_level < 20).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-64">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested user could not be found.'}</p>
          <Link href="/users" className="btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const displayName = user.name || user.email.split('@')[0] || 'Unknown User';

  return (
    <AdminLayout>
      <Head>
        <title>{displayName} - User Details | FIND Admin Portal</title>
      </Head>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/users"
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              <p className="text-gray-600">User Details</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={fetchUserDetails}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* User Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
          
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url}
                    alt={displayName} 
                    className="h-20 w-20 rounded-full"
                  />
                ) : (
                  <UserCircle className="h-12 w-12" />
                )}
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Name</span>
                  <span className="text-sm text-gray-900 font-medium">{displayName}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm text-gray-900">{user.email}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">User ID</span>
                  <span className="text-sm text-gray-900 font-mono">{user.id.slice(0, 8)}...</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Joined</span>
                  <span className="text-sm text-gray-900">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Last Updated</span>
                  <span className="text-sm text-gray-900">
                    {user.updated_at ? format(new Date(user.updated_at), 'MMM d, yyyy') : 'Never'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Member For</span>
                  <span className="text-sm text-gray-900">
                    {formatDistanceToNow(new Date(user.created_at))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalTrackers}</div>
            <div className="text-sm text-gray-500">Total Trackers</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">{connectedTrackers}</div>
            <div className="text-sm text-gray-500">Connected</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{activeTrackers}</div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">{lostTrackers}</div>
            <div className="text-sm text-gray-500">Lost</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-amber-600">{lowBatteryTrackers}</div>
            <div className="text-sm text-gray-500">Low Battery</div>
          </div>
        </div>

        {/* User's Trackers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">User's Trackers</h2>
            <p className="text-sm text-gray-600">All tracking devices owned by this user</p>
          </div>
          
          {trackers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracker
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Battery
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Seen
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trackers.map((tracker) => (
                    <tr key={tracker.id} className={tracker.is_lost ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                            <Map className="h-4 w-4" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{tracker.name}</div>
                            <div className="text-sm text-gray-500 capitalize">{tracker.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={getStatusBadge(tracker)}>
                            {getConnectionStatus(tracker)}
                          </span>
                          {tracker.recovery_status === 'recovering' && (
                            <RefreshCw className="ml-2 h-4 w-4 text-amber-500 animate-spin" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getBatteryIcon(tracker.battery_level)}
                          <span className="ml-2 text-sm text-gray-500">
                            {tracker.battery_level !== null ? `${tracker.battery_level}%` : 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastSeen(tracker.last_seen_timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/trackers/${tracker.id}`}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded-md hover:bg-gray-100"
                            title="View Tracker Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {tracker.is_lost && (
                            <Link
                              href={`/recovery/new?tracker=${tracker.id}`}
                              className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-gray-100"
                              title="Create Recovery Request"
                            >
                              <Truck className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Map className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900">No Trackers</h3>
              <p className="text-sm text-gray-500">This user hasn't added any trackers yet.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserDetailsPage;