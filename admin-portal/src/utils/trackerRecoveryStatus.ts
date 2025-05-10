import { getTrackerStatusOverride } from './storage/trackerStatus';
import { getStatusOverride } from './storage/recoveryStatus';

/**
 * Check if a tracker is currently in recovery
 */
export const isTrackerInRecovery = (trackerId: string): boolean => {
  const trackerStatus = getTrackerStatusOverride(trackerId);
  return trackerStatus?.status === 'recovered';
};

/**
 * Get the recovery status for a tracker
 */
export const getTrackerRecoveryInfo = (trackerId: string) => {
  const trackerStatus = getTrackerStatusOverride(trackerId);
  
  if (!trackerStatus || !trackerStatus.recovery_id) {
    return null;
  }
  
  const recoveryStatus = getStatusOverride(trackerStatus.recovery_id);
  
  return {
    trackerId,
    recoveryId: trackerStatus.recovery_id,
    trackerStatus: trackerStatus.status,
    recoveryStatus: recoveryStatus?.status || 'pending',
    isLost: trackerStatus.is_lost,
    lastUpdated: trackerStatus.updated_at
  };
};

/**
 * Get display status for a tracker considering recovery state
 */
export const getTrackerDisplayStatus = (trackerId: string): {
  status: 'normal' | 'lost' | 'recovering';
  label: string;
  badge: 'success' | 'danger' | 'warning';
} => {
  const recoveryInfo = getTrackerRecoveryInfo(trackerId);
  
  if (!recoveryInfo) {
    // No override, check if it's being tracked in recovery
    return {
      status: 'normal',
      label: 'Active',
      badge: 'success'
    };
  }
  
  switch (recoveryInfo.trackerStatus) {
    case 'lost':
      return {
        status: 'lost',
        label: 'Lost',
        badge: 'danger'
      };
    case 'recovered':
      return {
        status: 'recovering',
        label: 'Recovering',
        badge: 'warning'
      };
    case 'normal':
      return {
        status: 'normal',
        label: 'Active',
        badge: 'success'
      };
    default:
      return {
        status: 'normal',
        label: 'Active',
        badge: 'success'
      };
  }
};