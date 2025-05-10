/**
 * Utility to manage recovery status persistence in localStorage
 * This is a temporary solution for demo purposes
 */

interface StatusUpdate {
  status: string;
  updated_at: string;
}

const STORAGE_KEY = 'recovery_status_overrides';

/**
 * Get all status overrides from localStorage
 */
const getStatusOverrides = (): Record<string, StatusUpdate> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading status overrides:', error);
    return {};
  }
};

/**
 * Save status override to localStorage
 */
export const saveStatusOverride = (requestId: string, status: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const overrides = getStatusOverrides();
    overrides[requestId] = {
      status,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('Error saving status override:', error);
  }
};

/**
 * Get status override for a specific request
 */
export const getStatusOverride = (requestId: string): StatusUpdate | null => {
  const overrides = getStatusOverrides();
  return overrides[requestId] || null;
};

/**
 * Clear status override for a specific request
 */
export const clearStatusOverride = (requestId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const overrides = getStatusOverrides();
    delete overrides[requestId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('Error clearing status override:', error);
  }
};

/**
 * Clear all status overrides
 */
export const clearAllStatusOverrides = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing all status overrides:', error);
  }
};