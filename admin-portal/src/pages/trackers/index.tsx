import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Map, 
  Battery, 
  BatteryCharging, 
  BatteryWarning, 
  AlertTriangle, 
  Signal, 
  SignalZero,
  Eye,
  Truck,
  Search,
  Filter,
  ArrowUpDown,
  X,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { supabase } from '@/utils/supabase';
import { TrackerWithUserInfo } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';
import { getTrackerDisplayStatus } from '@/utils/trackerRecoveryStatus';

const Trackers: React.FC = () => {
  const [trackers, setTrackers] = useState<TrackerWithUserInfo[]>([]);
  const [filteredTrackers, setFilteredTrackers] = useState<TrackerWithUserInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('last_seen_timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchTrackers();
  }, []);

  const fetchTrackers = async () => {
    setLoading(true);
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
        .order('last_seen_timestamp', { ascending: false });

      if (error) throw error;

      // Transform data to include user info directly in the tracker object
      const transformedData: TrackerWithUserInfo[] = data.map(tracker => {
        // Determine if tracker is lost based on connection status and last seen time
        const lastSeen = tracker.last_seen_timestamp ? new Date(tracker.last_seen_timestamp) : null;
        const isDisconnected = tracker.connection_status === 'disconnected';
        const isLostTime = lastSeen ? (Date.now() - lastSeen.getTime() > 24 * 60 * 60 * 1000) : false; // 24 hours
        
        // Check recovery status from localStorage
        const recoveryDisplayStatus = getTrackerDisplayStatus(tracker.id);
        
        // A tracker is lost if:
        // 1. It's marked as lost in recovery system OR
        // 2. It's disconnected for a long time and no recovery is in progress
        const isLost = recoveryDisplayStatus.status === 'lost' || 
                       (recoveryDisplayStatus.status === 'normal' && (isDisconnected || isLostTime));
        
        return {
          ...tracker,
          user_email: tracker.profiles?.email || 'Unknown',
          user_name: tracker.profiles?.name || 'Unknown',
          is_lost: isLost,
          // Add recovery status to the tracker object
          recovery_status: recoveryDisplayStatus.status
        };
      });

      setTrackers(transformedData);
      setFilteredTrackers(transformedData);
    } catch (error) {
      console.error('Error fetching trackers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters and search when the dependency values change
    let result = [...trackers];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        tracker =>
          tracker.name.toLowerCase().includes(query) ||
          tracker.user_email.toLowerCase().includes(query) ||
          tracker.user_name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'lost') {
        result = result.filter(tracker => getTrackerDisplayStatus(tracker.id).status === 'lost');
      } else if (filterStatus === 'recovering') {
        result = result.filter(tracker => getTrackerDisplayStatus(tracker.id).status === 'recovering');
      } else if (filterStatus === 'connected') {
        result = result.filter(tracker => tracker.connection_status === 'connected' && getTrackerDisplayStatus(tracker.id).status === 'normal');
      } else if (filterStatus === 'disconnected') {
        result = result.filter(tracker => tracker.connection_status === 'disconnected' && getTrackerDisplayStatus(tracker.id).status === 'normal');
      } else if (filterStatus === 'low_battery') {
        result = result.filter(tracker => tracker.battery_level !== null && tracker.battery_level < 20);
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      // Handle nulls or undefined values
      if (a[sortField as keyof TrackerWithUserInfo] == null) return sortDirection === 'asc' ? -1 : 1;
      if (b[sortField as keyof TrackerWithUserInfo] == null) return sortDirection === 'asc' ? 1 : -1;

      const valueA = a[sortField as keyof TrackerWithUserInfo];
      const valueB = b[sortField as keyof TrackerWithUserInfo];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      // For dates, numbers, and booleans
      return sortDirection === 'asc'
        ? (valueA as any) - (valueB as any)
        : (valueB as any) - (valueA as any);
    });

    setFilteredTrackers(result);
  }, [trackers, searchQuery, filterStatus, sortField, sortDirection]);

  // Function to handle sort changes
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle sort direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Function to get the status badge class
  const getStatusBadge = (tracker: TrackerWithUserInfo) => {
    // Get recovery status from our tracking system
    const recoveryStatus = getTrackerDisplayStatus(tracker.id);
    
    // Priority: recovery status > connection status
    if (recoveryStatus.status === 'lost') {
      return 'badge badge-danger';
    }
    if (recoveryStatus.status === 'recovering') {
      return 'badge badge-warning';
    }
    if (recoveryStatus.status === 'normal' && tracker.connection_status === 'connected') {
      return 'badge badge-success';
    }
    if (tracker.connection_status === 'disconnected') {
      return 'badge badge-danger';
    }
    if (tracker.connection_status === 'connecting') {
      return 'badge badge-warning';
    }
    return 'badge badge-info';
  };

  // Function to get the connection status label
  const getConnectionStatus = (tracker: TrackerWithUserInfo) => {
    // Get recovery status from our tracking system
    const recoveryStatus = getTrackerDisplayStatus(tracker.id);
    
    // Priority: recovery status > connection status
    if (recoveryStatus.status === 'lost') {
      return 'Lost';
    }
    if (recoveryStatus.status === 'recovering') {
      return 'Recovering';
    }
    if (recoveryStatus.status === 'normal' && tracker.connection_status === 'connected') {
      return 'Connected';
    }
    if (tracker.connection_status === 'disconnected') {
      return 'Disconnected';
    }
    if (tracker.connection_status === 'connecting') {
      return 'Connecting';
    }
    return 'Active';
  };

  // Function to get the battery status icon
  const getBatteryIcon = (batteryLevel: number | null) => {
    if (batteryLevel === null) return <Battery className="h-5 w-5 text-gray-400" />;
    if (batteryLevel < 20) return <BatteryWarning className="h-5 w-5 text-red-500" />;
    if (batteryLevel >= 20 && batteryLevel < 50) return <Battery className="h-5 w-5 text-amber-500" />;
    return <BatteryCharging className="h-5 w-5 text-green-500" />;
  };

  // Function to format last seen time
  const formatLastSeen = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Trackers | FIND Admin Portal</title>
      </Head>
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trackers</h1>
            <p className="mt-1 text-gray-600">Manage and monitor tracking devices</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Link href="/recovery/new" className="btn-primary inline-flex items-center justify-center">
              <Truck className="h-5 w-5 mr-2" />
              New Recovery Request
            </Link>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search trackers or users..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
            
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="connected">Connected</option>
                <option value="disconnected">Disconnected</option>
                <option value="lost">Lost</option>
                <option value="recovering">Recovering</option>
                <option value="low_battery">Low Battery</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <ArrowUpDown className="h-5 w-5 text-gray-400 mr-2" />
              <select
                className="input-field"
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortField(field);
                  setSortDirection(direction as 'asc' | 'desc');
                }}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="last_seen_timestamp-desc">Last Seen (Recent First)</option>
                <option value="last_seen_timestamp-asc">Last Seen (Oldest First)</option>
                <option value="battery_level-desc">Battery (High-Low)</option>
                <option value="battery_level-asc">Battery (Low-High)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Trackers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-primary-600"></div>
            </div>
          ) : filteredTrackers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracker
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
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
                  {filteredTrackers.map((tracker) => (
                    <tr key={tracker.id} className={tracker.is_lost ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                            <Map className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{tracker.name}</div>
                            <div className="text-sm text-gray-500">{tracker.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tracker.user_name}</div>
                        <div className="text-sm text-gray-500">{tracker.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={getStatusBadge(tracker)}>
                            {getConnectionStatus(tracker)}
                          </span>
                          {getTrackerDisplayStatus(tracker.id).status === 'recovering' && (
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
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          {tracker.is_lost && (
                            <Link
                              href={`/recovery/new?tracker=${tracker.id}`}
                              className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-gray-100"
                              title="Create Recovery Request"
                            >
                              <Truck className="h-5 w-5" />
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
            <div className="text-center py-10">
              <Map className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No trackers found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery || filterStatus !== 'all' ? 'Try changing your search or filters' : 'No trackers have been added yet'}
              </p>
            </div>
          )}
        </div>
        
        {/* Tracker Statistics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Map className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trackers</p>
                <p className="text-2xl font-semibold text-gray-900">{trackers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Signal className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {trackers.filter(t => t.connection_status === 'connected' && getTrackerDisplayStatus(t.id).status === 'normal').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <SignalZero className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Disconnected</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {trackers.filter(t => t.connection_status === 'disconnected' && getTrackerDisplayStatus(t.id).status === 'normal').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Lost Trackers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {trackers.filter(t => getTrackerDisplayStatus(t.id).status === 'lost').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Recovering</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {trackers.filter(t => getTrackerDisplayStatus(t.id).status === 'recovering').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Trackers;