import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { format } from 'date-fns';
import AdminLayout from '@/layouts/AdminLayout';
import { supabase } from '@/utils/supabase';
import { LogisticsRequestWithDetails } from '@/types/supabase';
import toast from 'react-hot-toast';

// Import modularized components
import ProgressTracker from '@/components/recovery/ProgressTracker';
import Timeline from '@/components/recovery/Timeline';
import ShippingStatus from '@/components/recovery/ShippingStatus';
import UserInfo from '@/components/recovery/UserInfo';
import ActionButtons from '@/components/recovery/ActionButtons';
import TrackerInfo from '@/components/recovery/TrackerInfo';
import DeliveryInfo from '@/components/recovery/DeliveryInfo';

// Import the recovery data generator
import { generateRecoveryData } from '@/utils/recovery-generator';

const RecoveryDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState<boolean>(true);
  const [request, setRequest] = useState<LogisticsRequestWithDetails | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<boolean>(false);
  
  // Status options for the dropdown
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];
  
  // Fetch the recovery request details
  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchRecoveryDetail(id);
    }
  }, [id]);
  
  const fetchRecoveryDetail = async (requestId: string) => {
    setLoading(true);
    console.log('Fetching recovery request with ID:', requestId);
    
    try {
      // In development mode, use the data generator
      // This ensures the interface works without a database connection
      const dummyData = generateRecoveryData(requestId);
      setRequest(dummyData);
      
    } catch (error) {
      console.error('Error fetching recovery request details:', error);
      toast.error('Error loading recovery details');
    } finally {
      setLoading(false);
    }
  };
  
  // Update the status of the recovery request
  const updateStatus = async (newStatus: string) => {
    if (!request) return;
    
    setStatusUpdateLoading(true);
    
    try {
      // For demo purposes, we'll save to localStorage and update the state
      // Import the storage utilities
      const { saveStatusOverride } = await import('@/utils/storage/recoveryStatus');
      const { updateTrackerStatusOnRecoveryChange } = await import('@/utils/storage/trackerStatus');
      
      // Save the status override
      saveStatusOverride(request.id, newStatus);
      
      // Update the tracker status based on recovery status
      if (request.tracker_id) {
        updateTrackerStatusOnRecoveryChange(request.tracker_id, request.id, newStatus);
      }
      
      // Update the local state
      setTimeout(() => {
        setRequest(prev => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null);
        toast.success(`Status updated to ${newStatus}`);
        
        // Show additional message for delivered status
        if (newStatus === 'delivered') {
          setTimeout(() => {
            toast.success('Tracker status updated to normal', {
              duration: 3000,
              icon: '✅'
            });
          }, 1000);
        }
        
        setStatusUpdateLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  // Copy tracking number to clipboard
  const copyTrackingNumber = () => {
    if (request?.tracking_number) {
      navigator.clipboard.writeText(request.tracking_number);
      toast.success('Tracking number copied to clipboard');
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return 'Not available';
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };
  
  // Get status badge class
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Clock';
      case 'processing':
        return 'Package';
      case 'shipped':
        return 'Truck';
      case 'delivered':
        return 'CheckCircle';
      case 'cancelled':
        return 'XCircle';
      default:
        return 'AlertTriangle';
    }
  };
  
  // Handler for mark as delivered button
  const handleMarkAsDelivered = () => {
    if (request?.status !== 'delivered' && request?.status !== 'cancelled') {
      updateStatus('delivered');
    }
  };
  
  // Handler for cancel recovery button
  const handleCancelRecovery = () => {
    if (request?.status !== 'cancelled' && request?.status !== 'delivered') {
      updateStatus('cancelled');
    }
  };
  
  return (
    <AdminLayout>
      <Head>
        <title>Recovery Request Details | FIND Admin Portal</title>
      </Head>
      
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Link 
            href="/recovery" 
            className="inline-flex items-center justify-center p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recovery Request Details</h1>
            <p className="text-gray-600">
              {request ? `#${request.id.slice(0, 8)}` : 'Loading...'}
            </p>
          </div>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : request ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Details Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 mr-4">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {request.tracker_name}
                        </h2>
                        <p className="text-gray-500">Tracker Recovery</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(request.status)}`}>
                        {getStatusIcon(request.status) === 'Clock' && <span className="h-5 w-5 mr-1.5">⏱️</span>}
                        {getStatusIcon(request.status) === 'Package' && <span className="h-5 w-5 mr-1.5">📦</span>}
                        {getStatusIcon(request.status) === 'Truck' && <span className="h-5 w-5 mr-1.5">🚚</span>}
                        {getStatusIcon(request.status) === 'CheckCircle' && <span className="h-5 w-5 mr-1.5">✅</span>}
                        {getStatusIcon(request.status) === 'XCircle' && <span className="h-5 w-5 mr-1.5">❌</span>}
                        {getStatusIcon(request.status) === 'AlertTriangle' && <span className="h-5 w-5 mr-1.5">⚠️</span>}
                        <span className="capitalize">{request.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Tracker Component */}
                  <ProgressTracker status={request.status} />
                  
                  {/* Status Update Form */}
                  <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Update Status</h3>
                        <p className="text-sm text-gray-500">Change the current status of this recovery</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select 
                          className="input-field"
                          value={request.status}
                          onChange={(e) => updateStatus(e.target.value)}
                          disabled={statusUpdateLoading}
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        
                        <button 
                          className="btn-primary"
                          onClick={() => updateStatus(request.status)}
                          disabled={statusUpdateLoading}
                        >
                          {statusUpdateLoading ? (
                            <span className="inline-flex items-center">
                              <span className="animate-spin h-4 w-4 border-2 border-b-0 border-r-0 border-white rounded-full mr-2"></span>
                              Updating...
                            </span>
                          ) : (
                            <span className="inline-flex items-center">
                              <span className="h-4 w-4 mr-2">📨</span>
                              Update
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tracker and Delivery Information */}
                  <div className="mt-6 border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tracker Information Component */}
                    <TrackerInfo 
                      id={request.trackers?.id}
                      name={request.tracker_name}
                      type={request.trackers?.type}
                      location={request.trackers?.last_seen_latitude && request.trackers?.last_seen_longitude 
                        ? `${request.trackers.last_seen_latitude.toFixed(6)}, ${request.trackers.last_seen_longitude.toFixed(6)}`
                        : undefined}
                      batteryLevel={request.trackers?.battery_level}
                      lastSeen={request.trackers?.last_seen_timestamp}
                      formatDate={formatDate}
                    />
                    
                    {/* Delivery Information Component */}
                    <DeliveryInfo 
                      trackingNumber={request.tracking_number}
                      carrier={request.carrier}
                      createdAt={request.created_at}
                      updatedAt={request.updated_at}
                      address={request.shipping_address || request.user_address}
                      onCopyTrackingNumber={copyTrackingNumber}
                      formatDate={formatDate}
                    />
                  </div>
                  
                  {/* Timeline Component */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recovery Timeline</h3>
                    <Timeline 
                      status={request.status}
                      createdAt={request.created_at}
                      updatedAt={request.updated_at}
                      trackerName={request.tracker_name}
                      trackingNumber={request.tracking_number}
                      notes={request.notes}
                      formatDate={formatDate}
                    />
                  </div>
                  
                  {/* Notes */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {request.notes ? (
                        <p className="text-gray-800 whitespace-pre-line">{request.notes}</p>
                      ) : (
                        <p className="text-gray-500 italic">No notes available for this recovery request.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Shipping Status Component */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Shipping Status</h3>
                </div>
                <ShippingStatus 
                  status={request.status}
                  trackingNumber={request.tracking_number}
                  carrier={request.carrier}
                  onCopyTrackingNumber={copyTrackingNumber}
                />
              </div>
              
              {/* User Information Component */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">User Information</h3>
                  <p className="text-sm text-gray-500">Contact details of the owner</p>
                </div>
                <UserInfo 
                  name={request.user_name}
                  email={request.user_email}
                  phone={request.user_phone || 'Not provided'}
                  address={request.user_address || 'Not provided'}
                />
              </div>
              
              {/* Actions Component */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Actions</h3>
                </div>
                <ActionButtons 
                  status={request.status}
                  onMarkDelivered={handleMarkAsDelivered}
                  onCancel={handleCancelRecovery}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Recovery Not Found</h2>
            <p className="text-gray-500">The recovery request you're looking for doesn't exist or has been removed.</p>
            <div className="mt-6">
              <Link href="/recovery" className="btn-primary inline-flex items-center justify-center">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Recovery List
              </Link>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RecoveryDetail;