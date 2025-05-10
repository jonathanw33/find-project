import React from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getTrackerDisplayStatus } from '@/utils/trackerRecoveryStatus';

interface TrackerStatusBadgeProps {
  trackerId: string;
  className?: string;
}

const TrackerStatusBadge: React.FC<TrackerStatusBadgeProps> = ({ trackerId, className = '' }) => {
  const displayStatus = getTrackerDisplayStatus(trackerId);
  
  const getStatusConfig = () => {
    switch (displayStatus.status) {
      case 'lost':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'recovering':
        return {
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'normal':
      default:
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}>
      {config.icon}
      {displayStatus.label}
    </span>
  );
};

export default TrackerStatusBadge;