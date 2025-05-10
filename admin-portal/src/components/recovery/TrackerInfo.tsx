import React from 'react';

interface TrackerInfoProps {
  id?: string;
  name: string;
  type?: string;
  location?: string;
  batteryLevel?: number;
  lastSeen?: string;
  formatDate: (timestamp: string | null) => string;
}

const TrackerInfo: React.FC<TrackerInfoProps> = ({
  id,
  name,
  type = 'Standard',
  location,
  batteryLevel,
  lastSeen,
  formatDate
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Tracker Information</h3>
      <dl className="space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-gray-500">Tracker ID</dt>
          <dd className="text-sm text-gray-900 col-span-2">{id || 'N/A'}</dd>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-gray-500">Tracker Name</dt>
          <dd className="text-sm text-gray-900 col-span-2">{name}</dd>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-gray-500">Type</dt>
          <dd className="text-sm text-gray-900 col-span-2 capitalize">{type}</dd>
        </div>
        {batteryLevel !== undefined && (
          <div className="grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">Battery</dt>
            <dd className="text-sm text-gray-900 col-span-2">
              <div className="flex items-center">
                <div className="w-16 h-4 bg-gray-200 rounded-full overflow-hidden mr-2">
                  <div 
                    className={`h-full ${
                      batteryLevel > 60 ? 'bg-green-500' :
                      batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${batteryLevel}%` }}
                  ></div>
                </div>
                <span>{batteryLevel}%</span>
              </div>
            </dd>
          </div>
        )}
        {location && (
          <div className="grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">Last Seen</dt>
            <dd className="text-sm text-gray-900 col-span-2">
              {location}
            </dd>
          </div>
        )}
        {lastSeen && (
          <div className="grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">Date Seen</dt>
            <dd className="text-sm text-gray-900 col-span-2">
              {formatDate(lastSeen)}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
};

export default TrackerInfo;