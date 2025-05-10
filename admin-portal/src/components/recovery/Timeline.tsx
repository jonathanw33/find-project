import React from 'react';
import { Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';

interface TimelineProps {
  status: string;
  createdAt: string;
  updatedAt: string;
  trackerName: string;
  trackingNumber?: string;
  notes?: string;
  formatDate: (timestamp: string | null) => string;
}

const Timeline: React.FC<TimelineProps> = ({
  status,
  createdAt,
  updatedAt,
  trackerName,
  trackingNumber,
  notes,
  formatDate
}) => {
  return (
    <div className="relative pl-8 pb-2">
      <div className="absolute top-0 bottom-0 left-3 w-px bg-gray-200"></div>
      
      {/* Request Created */}
      <div className="relative mb-6">
        <div className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center rounded-full bg-primary-100 border-2 border-primary-500 z-10">
          <Clock className="h-3 w-3 text-primary-600" />
        </div>
        <div className="pl-3">
          <div className="text-sm font-medium text-gray-900">Request Created</div>
          <div className="text-sm text-gray-500">{formatDate(createdAt)}</div>
          <div className="mt-1 text-sm text-gray-600">
            Recovery request for {trackerName} was created
          </div>
        </div>
      </div>
      
      {/* Processing Started */}
      {status !== 'pending' && (
        <div className="relative mb-6">
          <div className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 border-2 border-blue-500 z-10">
            <Package className="h-3 w-3 text-blue-600" />
          </div>
          <div className="pl-3">
            <div className="text-sm font-medium text-gray-900">Processing Started</div>
            <div className="text-sm text-gray-500">{formatDate(updatedAt)}</div>
            <div className="mt-1 text-sm text-gray-600">
              Recovery team started processing the request
            </div>
          </div>
        </div>
      )}
      
      {/* Shipped */}
      {(status === 'shipped' || status === 'delivered') && (
        <div className="relative mb-6">
          <div className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 border-2 border-indigo-500 z-10">
            <Truck className="h-3 w-3 text-indigo-600" />
          </div>
          <div className="pl-3">
            <div className="text-sm font-medium text-gray-900">Shipped</div>
            <div className="text-sm text-gray-500">{formatDate(updatedAt)}</div>
            <div className="mt-1 text-sm text-gray-600">
              Tracker is en route to the destination
              {trackingNumber && (
                <span className="ml-1">
                  with tracking number <span className="font-medium">{trackingNumber}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Delivered */}
      {status === 'delivered' && (
        <div className="relative mb-6">
          <div className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center rounded-full bg-green-100 border-2 border-green-500 z-10">
            <CheckCircle className="h-3 w-3 text-green-600" />
          </div>
          <div className="pl-3">
            <div className="text-sm font-medium text-gray-900">Delivered</div>
            <div className="text-sm text-gray-500">{formatDate(updatedAt)}</div>
            <div className="mt-1 text-sm text-gray-600">
              Tracker was successfully delivered to the user
            </div>
          </div>
        </div>
      )}
      
      {/* Cancelled */}
      {status === 'cancelled' && (
        <div className="relative mb-6">
          <div className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-100 border-2 border-red-500 z-10">
            <XCircle className="h-3 w-3 text-red-600" />
          </div>
          <div className="pl-3">
            <div className="text-sm font-medium text-gray-900">Cancelled</div>
            <div className="text-sm text-gray-500">{formatDate(updatedAt)}</div>
            <div className="mt-1 text-sm text-gray-600">
              Recovery request was cancelled
              {notes && (
                <span className="ml-1">
                  due to: <span className="font-medium">{notes}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Current step - animated pulse */}
      {status !== 'delivered' && status !== 'cancelled' && (
        <div className="relative mb-6">
          <div className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center rounded-full bg-white border-2 border-primary-500 z-10 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
          </div>
          <div className="pl-3">
            <div className="text-sm font-medium text-gray-900">In Progress</div>
            <div className="text-sm text-gray-500">Now</div>
            <div className="mt-1 text-sm text-gray-600">
              {status === 'pending' ? 'Awaiting processing' : 
               status === 'processing' ? 'Preparing for shipping' : 
               'En route to destination'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;