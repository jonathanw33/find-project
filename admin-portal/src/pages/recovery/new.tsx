import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Map, 
  Truck, 
  AlertTriangle, 
  User, 
  Package, 
  CheckCircle, 
  ArrowLeft, 
  Loader, 
  X
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { supabase } from '@/utils/supabase';
import { TrackerWithUserInfo } from '@/types/supabase';
import { createShippingRequest } from '@/services/logisticsService';

const NewRecoveryRequest: React.FC = () => {
  const router = useRouter();
  const { tracker: trackerId } = router.query;

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const [lostTrackers, setLostTrackers] = useState<TrackerWithUserInfo[]>([]);
  const [selectedTracker, setSelectedTracker] = useState<TrackerWithUserInfo | null>(null);
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    fetchLostTrackers();
  }, []);

  useEffect(() => {
    // If trackerId is provided in the URL, select that tracker
    if (trackerId && lostTrackers.length > 0) {
      const tracker = lostTrackers.find(t => t.id === trackerId);
      if (tracker) {
        setSelectedTracker(tracker);
      }
    }
  }, [trackerId, lostTrackers]);

  const fetchLostTrackers = async () => {
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
        `);

      if (error) throw error;

      // Transform data and filter for lost trackers
      const transformedData: TrackerWithUserInfo[] = data.map(tracker => {
        // Determine if tracker is lost based on connection status and last seen time
        const lastSeen = tracker.last_seen_timestamp ? new Date(tracker.last_seen_timestamp) : null;
        const isDisconnected = tracker.connection_status === 'disconnected';
        const isLostTime = lastSeen ? (Date.now() - lastSeen.getTime() > 24 * 60 * 60 * 1000) : false; // 24 hours
        
        return {
          ...tracker,
          user_email: tracker.profiles?.email || 'Unknown',
          user_name: tracker.profiles?.name || 'Unknown',
          is_lost: isDisconnected || isLostTime
        };
      }).filter(tracker => tracker.is_lost);

      setLostTrackers(transformedData);
    } catch (err) {
      console.error('Error fetching lost trackers:', err);
      setError('Failed to load lost trackers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTracker) {
      setError('Please select a tracker');
      return;
    }

    if (!shippingAddress.trim()) {
      setError('Please enter a shipping address');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // 1. Call the logistics API
      const logisticsResponse = await createShippingRequest(
        selectedTracker.id,
        selectedTracker.user_id,
        shippingAddress,
        notes
      );

      if (!logisticsResponse.success) {
        throw new Error(logisticsResponse.errors?.join(', ') || 'Failed to create shipping request');
      }

      // 2. Store the request in our database
      const { data, error } = await supabase
        .from('logistics_requests')
        .insert({
          tracker_id: selectedTracker.id,
          user_id: selectedTracker.user_id,
          status: 'processing',
          tracking_number: logisticsResponse.trackingNumber,
          shipping_address: shippingAddress,
          notes: notes
        });

      if (error) throw error;

      // Success!
      setSuccess(true);
      setTimeout(() => {
        router.push('/recovery');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating recovery request:', err);
      setError(err.message || 'Failed to create recovery request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>New Recovery Request | FIND Admin Portal</title>
      </Head>
      
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center">
          <Link 
            href="/recovery" 
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            aria-label="Back to recovery management"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Recovery Request</h1>
            <p className="mt-1 text-gray-600">Create a new logistics request for a lost tracker</p>
          </div>
        </div>
        
        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader className="h-8 w-8 text-primary-600 animate-spin" />
              <span className="ml-2 text-gray-500">Loading trackers...</span>
            </div>
          ) : success ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Recovery Request Created!</h2>
              <p className="mt-2 text-gray-600">
                The recovery request has been created successfully. You will be redirected to the recovery management page.
              </p>
            </div>
          ) : (
            <div className="p-6">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                  <button 
                    onClick={() => setError(null)}
                    className="ml-auto p-1 rounded-full hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tracker selection */}
                <div>
                  <label htmlFor="tracker" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Lost Tracker
                  </label>
                  {lostTrackers.length > 0 ? (
                    <select
                      id="tracker"
                      value={selectedTracker?.id || ''}
                      onChange={(e) => {
                        const tracker = lostTrackers.find(t => t.id === e.target.value);
                        setSelectedTracker(tracker || null);
                      }}
                      className="input-field"
                      required
                    >
                      <option value="">-- Select a Tracker --</option>
                      {lostTrackers.map((tracker) => (
                        <option key={tracker.id} value={tracker.id}>
                          {tracker.name} - {tracker.user_name} ({tracker.user_email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>No lost trackers found. Return to the trackers page to find trackers that need recovery.</span>
                    </div>
                  )}
                </div>
                
                {/* Selected tracker details */}
                {selectedTracker && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-2">Tracker Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Tracker Name</p>
                        <p className="font-medium">{selectedTracker.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium">{selectedTracker.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">User</p>
                        <p className="font-medium">{selectedTracker.user_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedTracker.user_email}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Shipping address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Address
                  </label>
                  <textarea
                    id="address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Enter the full shipping address"
                    required
                  />
                </div>
                
                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="input-field"
                    placeholder="Add any special instructions or notes"
                  />
                </div>
                
                {/* Submit button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Link
                    href="/recovery"
                    className="btn-outline mr-4"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn-primary flex items-center"
                    disabled={submitting || !selectedTracker || lostTrackers.length === 0}
                  >
                    {submitting ? (
                      <>
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Truck className="h-5 w-5 mr-2" />
                        Create Recovery Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        
        {/* Additional helpful information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">About Recovery Requests</h3>
          <p className="text-gray-600 mb-4">
            Recovery requests are created when a tracker is lost and needs to be returned to the user.
            The logistics service will handle shipping the tracker back to the user's address.
          </p>
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Recovery Process</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Select a lost tracker that needs to be recovered</li>
              <li>Enter the shipping address where the tracker should be sent</li>
              <li>Add any special instructions or notes for the logistics team</li>
              <li>Submit the request and a tracking number will be generated</li>
              <li>The tracker will be shipped and delivered to the user</li>
            </ol>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NewRecoveryRequest;