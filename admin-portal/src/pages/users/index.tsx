import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  UserCircle, 
  Users, 
  Map, 
  Search, 
  ArrowUpDown, 
  X, 
  Filter, 
  Mail, 
  Eye
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { supabase } from '@/utils/supabase';
import { UserWithTrackersCount } from '@/types/supabase';
import { format } from 'date-fns';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserWithTrackersCount[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithTrackersCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get trackers count for each user
      const userIds = profiles.map(profile => profile.id);
      const { data: trackers, error: trackersError } = await supabase
        .from('trackers')
        .select('user_id, is_active');

      if (trackersError) throw trackersError;

      // Get admin users to exclude them from the list
      const { data: adminUsers } = await supabase
        .from('admin_users')
        .select('user_id');
      
      const adminUserIds = adminUsers?.map(admin => admin.user_id) || [];

      // Transform data to include tracker counts and exclude admin users
      const usersWithTrackersCount: UserWithTrackersCount[] = profiles
        .filter(user => !adminUserIds.includes(user.id)) // Filter out admin users
        .map(user => {
          const userTrackers = trackers.filter(t => t.user_id === user.id);
          const activeTrackers = userTrackers.filter(t => t.is_active);
          
          return {
            ...user,
            trackers_count: userTrackers.length,
            active_trackers_count: activeTrackers.length
          };
        });

      setUsers(usersWithTrackersCount);
      setFilteredUsers(usersWithTrackersCount);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply search and sort when dependency values change
    let result = [...users];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        user =>
          user.email.toLowerCase().includes(query) ||
          user.id.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const valueA = a[sortField as keyof UserWithTrackersCount];
      const valueB = b[sortField as keyof UserWithTrackersCount];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // For dates
      if (valueA instanceof Date && valueB instanceof Date) {
        return sortDirection === 'asc'
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }

      // String conversion for other types
      const strA = String(valueA);
      const strB = String(valueB);
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    setFilteredUsers(result);
  }, [users, searchQuery, sortField, sortDirection]);

  // Format date function
  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Users | FIND Admin Portal</title>
      </Head>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-gray-600">Manage user accounts and their trackers</p>
        </div>
        
        {/* Search and filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by email or user ID..."
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
                <option value="email-asc">Email (A-Z)</option>
                <option value="email-desc">Email (Z-A)</option>
                <option value="trackers_count-desc">Trackers (Most-Least)</option>
                <option value="trackers_count-asc">Trackers (Least-Most)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-primary-600"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trackers
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img 
                                src={user.avatar_url}
                                alt={user.email} 
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <UserCircle className="h-6 w-6" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              User ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                            <Map className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.trackers_count} Trackers
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.active_trackers_count} Active
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex justify-center space-x-3">
                          <Link
                            href={`/users/${user.id}`}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded-md hover:bg-gray-100"
                            title="View User Details"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <Link
                            href={`/trackers?user=${user.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-gray-100"
                            title="View User's Trackers"
                          >
                            <Map className="h-5 w-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery ? 'Try changing your search terms' : 'No users have been added yet'}
              </p>
            </div>
          )}
        </div>
        
        {/* User Statistics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Map className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trackers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.reduce((sum, user) => sum + user.trackers_count, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Map className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Trackers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.reduce((sum, user) => sum + user.active_trackers_count, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UsersPage;