import React from 'react';
import { Truck, CheckCircle, Package, Clipboard } from 'lucide-react';

interface ShippingStatusProps {
  status: string;
  trackingNumber?: string;
  carrier?: string;
  onCopyTrackingNumber: () => void;
}

const ShippingStatus: React.FC<ShippingStatusProps> = ({
  status,
  trackingNumber,
  carrier,
  onCopyTrackingNumber
}) => {
  return (
    <div className="p-4">
      <div className={`text-center p-4 mb-4 rounded-lg ${
        status === 'shipped' ? 'bg-indigo-50 border border-indigo-200' : 
        status === 'delivered' ? 'bg-green-50 border border-green-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <div className="mb-2">
          {status === 'shipped' ? (
            <Truck className="h-12 w-12 mx-auto text-indigo-500 animate-bounce" />
          ) : status === 'delivered' ? (
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
          ) : (
            <Package className="h-12 w-12 mx-auto text-gray-400" />
          )}
        </div>
        <p className="text-sm font-medium mb-1">
          {status === 'pending' ? 'Not shipped yet' :
           status === 'processing' ? 'Preparing for shipment' :
           status === 'shipped' ? 'Package in transit' :
           status === 'delivered' ? 'Package delivered' :
           'Shipment cancelled'}
        </p>
        {trackingNumber && status !== 'pending' && status !== 'cancelled' && (
          <p className="text-sm text-gray-600">
            Tracking: <span className="font-medium">{trackingNumber}</span>
          </p>
        )}
      </div>
      
      {status === 'shipped' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Estimated delivery:</span>
            <span className="font-medium">Tomorrow by 2:00 PM</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Carrier:</span>
            <span className="font-medium">{carrier || 'Standard Delivery'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Last update:</span>
            <span className="font-medium">2 hours ago</span>
          </div>
        </div>
      )}
      
      {trackingNumber && (
        <button 
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          onClick={onCopyTrackingNumber}
        >
          <Clipboard className="h-4 w-4" />
          Copy Tracking Number
        </button>
      )}
    </div>
  );
};

export default ShippingStatus;