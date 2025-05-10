import { Alert } from 'react-native';
import { trackerService } from '../services/supabase';

/**
 * Utility function to mark a tracker as "lost" by setting its connection_status to "disconnected"
 * This can be used from any screen where you need to manually trigger the "lost" status
 */
export const markTrackerAsLost = async (trackerId: string): Promise<boolean> => {
  try {
    // Update the tracker's connection status to "disconnected" which will mark it as "lost" in the admin portal
    await trackerService.updateTracker(trackerId, {
      connection_status: 'disconnected',
    });
    
    Alert.alert(
      'Tracker Marked as Lost',
      'This tracker has been marked as lost and is now visible in the recovery section of the admin portal.',
      [{ text: 'OK' }]
    );
    
    return true;
  } catch (error) {
    console.error('Error marking tracker as lost:', error);
    
    Alert.alert(
      'Error',
      'Failed to mark tracker as lost. Please try again.',
      [{ text: 'OK' }]
    );
    
    return false;
  }
};
