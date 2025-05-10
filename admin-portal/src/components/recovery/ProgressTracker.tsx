import React, { useRef } from 'react';
import { Clock, CheckCircle } from 'lucide-react';

interface ProgressTrackerProps {
  status: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ status }) => {
  const progressRef = useRef<HTMLDivElement>(null);

  // Calculate progress percentage based on status
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 33;
      case 'shipped':
        return 66;
      case 'delivered':
        return 100;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };
  
  // Get step status (completed, active, upcoming)
  const getStepStatus = (stepStatus: string, currentStatus: string) => {
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    
    if (currentStatus === 'cancelled') {
      return stepStatus === 'pending' ? 'completed' : 'cancelled';
    }
    
    const currentIdx = statusOrder.indexOf(currentStatus);
    const stepIdx = statusOrder.indexOf(stepStatus);
    
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'upcoming';
  };

  return (
    <div className="mt-8">
      <div className="relative">
        {/* Progress bar */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`absolute h-full transition-all duration-1000 ease-out ${
              status === 'cancelled' ? 'bg-red-500' : 'bg-primary-500'
            }`}
            style={{ width: `${getProgressPercentage(status)}%` }}
            ref={progressRef}
          ></div>
        </div>
        
        {/* Progress steps */}
        <div className="flex justify-between mt-2">
          {/* Pending */}
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 flex items-center justify-center rounded-full border-2 ${
              getStepStatus('pending', status) === 'completed' 
                ? 'border-primary-500 bg-primary-500 text-white' 
                : getStepStatus('pending', status) === 'active'
                  ? 'border-primary-500 bg-white text-primary-500' 
                  : getStepStatus('pending', status) === 'cancelled'
                    ? 'border-red-500 bg-white text-red-500'
                    : 'border-gray-300 bg-white text-gray-400'
            }`}>
              {getStepStatus('pending', status) === 'completed' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="text-xs">1</span>
              )}
            </div>
            <span className={`text-xs font-medium mt-1 ${
              getStepStatus('pending', status) === 'completed' 
                ? 'text-primary-600' 
                : getStepStatus('pending', status) === 'active'
                  ? 'text-primary-600' 
                  : getStepStatus('pending', status) === 'cancelled'
                    ? 'text-red-500'
                    : 'text-gray-500'
            }`}>
              Pending
            </span>
          </div>
          
          {/* Processing */}
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 flex items-center justify-center rounded-full border-2 ${
              getStepStatus('processing', status) === 'completed' 
                ? 'border-primary-500 bg-primary-500 text-white' 
                : getStepStatus('processing', status) === 'active'
                  ? 'border-primary-500 bg-white text-primary-500' 
                  : getStepStatus('processing', status) === 'cancelled'
                    ? 'border-red-500 bg-white text-red-500'
                    : 'border-gray-300 bg-white text-gray-400'
            }`}>
              {getStepStatus('processing', status) === 'completed' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="text-xs">2</span>
              )}
            </div>
            <span className={`text-xs font-medium mt-1 ${
              getStepStatus('processing', status) === 'completed' 
                ? 'text-primary-600' 
                : getStepStatus('processing', status) === 'active'
                  ? 'text-primary-600' 
                  : getStepStatus('processing', status) === 'cancelled'
                    ? 'text-red-500'
                    : 'text-gray-500'
            }`}>
              Processing
            </span>
          </div>
          
          {/* Shipped */}
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 flex items-center justify-center rounded-full border-2 ${
              getStepStatus('shipped', status) === 'completed' 
                ? 'border-primary-500 bg-primary-500 text-white' 
                : getStepStatus('shipped', status) === 'active'
                  ? 'border-primary-500 bg-white text-primary-500' 
                  : getStepStatus('shipped', status) === 'cancelled'
                    ? 'border-red-500 bg-white text-red-500'
                    : 'border-gray-300 bg-white text-gray-400'
            }`}>
              {getStepStatus('shipped', status) === 'completed' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="text-xs">3</span>
              )}
            </div>
            <span className={`text-xs font-medium mt-1 ${
              getStepStatus('shipped', status) === 'completed' 
                ? 'text-primary-600' 
                : getStepStatus('shipped', status) === 'active'
                  ? 'text-primary-600' 
                  : getStepStatus('shipped', status) === 'cancelled'
                    ? 'text-red-500'
                    : 'text-gray-500'
            }`}>
              Shipped
            </span>
          </div>
          
          {/* Delivered */}
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 flex items-center justify-center rounded-full border-2 ${
              getStepStatus('delivered', status) === 'completed' 
                ? 'border-primary-500 bg-primary-500 text-white' 
                : getStepStatus('delivered', status) === 'active'
                  ? 'border-primary-500 bg-white text-primary-500' 
                  : getStepStatus('delivered', status) === 'cancelled'
                    ? 'border-red-500 bg-white text-red-500'
                    : 'border-gray-300 bg-white text-gray-400'
            }`}>
              {getStepStatus('delivered', status) === 'completed' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="text-xs">4</span>
              )}
            </div>
            <span className={`text-xs font-medium mt-1 ${
              getStepStatus('delivered', status) === 'completed' 
                ? 'text-primary-600' 
                : getStepStatus('delivered', status) === 'active'
                  ? 'text-primary-600' 
                  : getStepStatus('delivered', status) === 'cancelled'
                    ? 'text-red-500'
                    : 'text-gray-500'
            }`}>
              Delivered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;