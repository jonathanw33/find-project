import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Truck, 
  Map, 
  Box, 
  Clock, 
  User, 
  Calendar, 
  CheckCircle, 
  Plus,
  Search,
  ArrowUpDown,
  X,
  Filter,
  ExternalLink
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { supabase } from '@/utils/supabase';
import { LogisticsRequestWithDetails } from '@/types/supabase';
import { formatDistanceToNow, format } from 'date-fns';

const Recovery: React.FC = () => {
  const [requests, setRequests] = useState<LogisticsRequestWithDetails[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LogisticsRequestWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchRecoveryRequests();
  }, []);

  const fetchRecoveryRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('logistics_requests')
        .select(`
          *,
          trackers:tracker_id (
            name,
            type,
            last_seen_latitude,
            last_seen_longitude
          ),
          profiles:user_id (
            email,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Import the storage utility
      const { getStatusOverride } = await import('@/utils/storage/recoveryStatus');

      // Transform data to include user and tracker info directly
      // Also check for status overrides in localStorage
      const transformedData: LogisticsRequestWithDetails[] = data.map(request => {
        const statusOverride = getStatusOverride(request.id);
        return {
          ...request,
          tracker_name: request.trackers?.name || 'Unknown Tracker',
          user_email: request.profiles?.email || 'Unknown',
          user_name: request.profiles?.name || 'Unknown',
          // Apply status override if exists
          status: statusOverride ? statusOverride.status as any : request.status,
          updated_at: statusOverride ? statusOverride.updated_at : request.updated_at
        };
      });

      setRequests(transformedData);
      setFilteredRequests(transformedData);
    } catch (error) {
      console.error('Error fetching recovery requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters and search when the dependency values change
    let result = [...requests];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        request =>
          request.tracker_name.toLowerCase().includes(query) ||
          request.user_email.toLowerCase().includes(query) ||
          request.user_name.toLowerCase().includes(query) ||
          (request.tracking_number && request.tracking_number.toLowerCase().includes(query)) ||
          (request.notes && request.notes.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(request => request.status === filterStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      // Handle nulls or undefined values
      if (a[sortField as keyof LogisticsRequestWithDetails] == null) 
        return sortDirection === 'asc' ? -1 : 1;
      if (b[sortField as keyof LogisticsRequestWithDetails] == null) 
        return sortDirection === 'asc' ? 1 : -1;

      const valueA = a[sortField as keyof LogisticsRequestWithDetails];
      const valueB = b[sortField as keyof LogisticsRequestWithDetails];

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

    setFilteredRequests(result);
  }, [requests, searchQuery, filterStatus, sortField, sortDirection]);

  // Function to get the status badge class
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge badge-warning';
      case 'processing':
        return 'badge badge-info';
      case 'shipped':
        return 'badge badge-info';
      case 'delivered':
        return 'badge badge-success';
      case 'cancelled':
        return 'badge badge-danger';
      default:
        return 'badge';
    }
  };

  // Function to format dates
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Recovery Management | FIND Admin Portal</title>
      </Head>
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recovery Management</h1>
            <p className="mt-1 text-gray-600">Handle logistics for returning lost trackers to users</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Link href="/recovery/new" className="btn-primary inline-flex items-center justify-center">
              <Plus className="h-5 w-5 mr-2" />
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
                placeholder="Search by tracker, user or tracking..."
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
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
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
                <option value="created_at-desc">Date Created (Newest)</option>
                <option value="created_at-asc">Date Created (Oldest)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="status-desc">Status (Z-A)</option>
                <option value="tracker_name-asc">Tracker (A-Z)</option>
                <option value="tracker_name-desc">Tracker (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Recovery Requests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-primary-600"></div>
            </div>
          ) : filteredRequests.length > 0 ? (
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
                      Date Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                            <Map className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{request.tracker_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.user_name}</div>
                        <div className="text-sm text-gray-500">{request.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.tracking_number ? (
                          <div className="flex items-center">
                            <span>{request.tracking_number}</span>
                            <ExternalLink className="h-4 w-4 ml-1 text-primary-500" />
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/recovery/${request.id}`}
                          className="text-primary-600 hover:text-primary-900 p-1 rounded-md hover:bg-gray-100"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Truck className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No recovery requests found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try changing your search or filters' 
                  : 'No recovery requests have been created yet'}
              </p>
              <div className="mt-6">
                <Link href="/recovery/new" className="btn-primary inline-flex items-center justify-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Recovery Request
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Box className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{requests.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter(r => r.status === 'processing' || r.status === 'shipped').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {requests.filter(r => r.status === 'delivered').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Recovery;