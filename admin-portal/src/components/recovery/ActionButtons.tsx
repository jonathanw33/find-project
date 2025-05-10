import React from 'react';
import { Edit, Mail, ClipboardCheck, XCircle, ChevronRight } from 'lucide-react';

interface ActionButtonsProps {
  status: string;
  onMarkDelivered: () => void;
  onCancel: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  status,
  onMarkDelivered,
  onCancel
}) => {
  return (
    <div className="p-4">
      <ul className="divide-y divide-gray-200">
        <li className="py-2">
          <button className="w-full text-left flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-50">
            <div className="flex items-center">
              <Edit className="h-5 w-5 text-gray-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Edit Recovery Details</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </li>
        <li className="py-2">
          <button className="w-full text-left flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-50">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Contact User</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </li>
        <li className="py-2">
          <button 
            className="w-full text-left flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-50"
            onClick={onMarkDelivered}
            disabled={status === 'delivered' || status === 'cancelled'}
          >
            <div className="flex items-center">
              <ClipboardCheck className="h-5 w-5 text-gray-500 mr-3" />
              <span className={`text-sm font-medium ${
                status === 'delivered' ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {status === 'delivered' ? 'Marked as Delivered' : 'Mark as Delivered'}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </li>
        <li className="py-2">
          <button 
            className="w-full text-left flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-50"
            onClick={onCancel}
            disabled={status === 'cancelled' || status === 'delivered'}
          >
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className={`text-sm font-medium ${
                status === 'cancelled' || status === 'delivered' 
                  ? 'text-gray-400' 
                  : 'text-red-600'
              }`}>
                {status === 'cancelled' 
                  ? 'Request Cancelled' 
                  : status === 'delivered'
                    ? 'Cannot Cancel Delivered Request'
                    : 'Cancel Recovery'}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </li>
      </ul>
    </div>
  );
};

export default ActionButtons;