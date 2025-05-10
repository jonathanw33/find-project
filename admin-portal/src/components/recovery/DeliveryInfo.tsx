import React from 'react';
import { Clipboard } from 'lucide-react';

interface DeliveryInfoProps {
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
  address?: string;
  onCopyTrackingNumber: () => void;
  formatDate: (timestamp: string | null) => string;
}

const DeliveryInfo: React.FC<DeliveryInfoProps> = ({
  trackingNumber,
  carrier,
  createdAt,
  updatedAt,
  address,
  onCopyTrackingNumber,
  formatDate
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
      <dl className="space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-gray-500">Tracking #</dt>
          <dd className="text-sm text-gray-900 col-span-2 flex items-center">
            {trackingNumber ? (
              <>
                <span className="mr-2">{trackingNumber}</span>
                <button 
                  onClick={onCopyTrackingNumber}
                  className="text-primary-600 hover:text-primary-800"
                  title="Copy tracking number"
                >
                  <Clipboard className="h-4 w-4" />
                </button>
              </>
            ) : (
              <span className="text-gray-400">Not assigned</span>
            )}
          </dd>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-gray-500">Carrier</dt>
          <dd className="text-sm text-gray-900 col-span-2">
            {carrier || 'Not assigned'}
          </dd>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-gray-500">Created</dt>
          <dd className="text-sm text-gray-900 col-span-2">
            {formatDate(createdAt)}
          </dd>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
          <dd className="text-sm text-gray-900 col-span-2">
            {formatDate(updatedAt)}
          </dd>
        </div>
        {address && (
          <div className="grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="text-sm text-gray-900 col-span-2 whitespace-pre-line">
              {address}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
};

export default DeliveryInfo;