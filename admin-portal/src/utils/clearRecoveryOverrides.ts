import { clearAllStatusOverrides } from './storage/recoveryStatus';

/**
 * Clears all recovery status overrides from localStorage
 * This can be used to reset the app to its default state
 */
export const clearRecoveryOverrides = () => {
  clearAllStatusOverrides();
  // Reload the page to reflect the changes
  window.location.reload();
};

// Add this to window object in development for easy access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).clearRecoveryOverrides = clearRecoveryOverrides;
}