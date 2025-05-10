/**
 * Utility to manage tracker status persistence in localStorage
 * This is a temporary solution for demo purposes
 */

interface TrackerStatusUpdate {
  status: 'lost' | 'normal' | 'recovered';
  is_lost: boolean;
  updated_at: string;
  // Keep track of which recovery is associated with this tracker
  recovery_id?: string;
}

const STORAGE_KEY = 'tracker_status_overrides';

/**
 * Get all tracker status overrides from localStorage
 */
const getTrackerStatusOverrides = (): Record<string, TrackerStatusUpdate> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading tracker status overrides:', error);
    return {};
  }
};

/**
 * Save tracker status override to localStorage
 */
export const saveTrackerStatusOverride = (
  trackerId: string, 
  status: 'lost' | 'normal' | 'recovered',
  recoveryId?: string
): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const overrides = getTrackerStatusOverrides();
    overrides[trackerId] = {
      status,
      is_lost: status === 'lost',
      updated_at: new Date().toISOString(),
      recovery_id: recoveryId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('Error saving tracker status override:', error);
  }
};

/**
 * Get tracker status override for a specific tracker
 */
export const getTrackerStatusOverride = (trackerId: string): TrackerStatusUpdate | null => {
  const overrides = getTrackerStatusOverrides();
  return overrides[trackerId] || null;
};

/**
 * Clear tracker status override for a specific tracker
 */
export const clearTrackerStatusOverride = (trackerId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const overrides = getTrackerStatusOverrides();
    delete overrides[trackerId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('Error clearing tracker status override:', error);
  }
};

/**
 * Get tracker status by recovery ID
 */
export const getTrackerByRecoveryId = (recoveryId: string): { trackerId: string; status: TrackerStatusUpdate } | null => {
  const overrides = getTrackerStatusOverrides();
  for (const [trackerId, status] of Object.entries(overrides)) {
    if (status.recovery_id === recoveryId) {
      return { trackerId, status };
    }
  }
  return null;
};

/**
 * Update tracker status when recovery status changes
 */
export const updateTrackerStatusOnRecoveryChange = (
  trackerId: string, 
  recoveryId: string, 
  recoveryStatus: string
): void => {
  if (recoveryStatus === 'delivered') {
    // When recovery is delivered, tracker is no longer lost
    saveTrackerStatusOverride(trackerId, 'normal', recoveryId);
  } else if (recoveryStatus === 'cancelled') {
    // When recovery is cancelled, tracker is still lost
    saveTrackerStatusOverride(trackerId, 'lost', recoveryId);
  } else if (recoveryStatus === 'pending' || recoveryStatus === 'processing' || recoveryStatus === 'shipped') {
    // During recovery process, mark as being recovered
    saveTrackerStatusOverride(trackerId, 'recovered', recoveryId);
  }
};