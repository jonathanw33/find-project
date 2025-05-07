import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  setTrackers, 
  addTracker, 
  updateTracker, 
  removeTracker, 
  updateTrackerLocation, 
  setTrackerLoading, 
  setTrackerError,
  Tracker,
  LocationPoint
} from '../redux/slices/trackerSlice';
import { trackerService } from '../services/supabase';

export const useSupabaseTrackers = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Fetches all trackers from Supabase
  const fetchTrackers = async () => {
    try {
      dispatch(setTrackerLoading(true));
      const trackersData = await trackerService.getTrackers();
      
      // Transform data to match our redux format
      const transformedTrackers: Tracker[] = trackersData.map(tracker => ({
        id: tracker.id,
        name: tracker.name,
        type: tracker.type,
        icon: tracker.icon || undefined,
        batteryLevel: tracker.battery_level || undefined,
        isActive: tracker.is_active,
        lastSeen: tracker.last_seen_latitude && tracker.last_seen_longitude ? {
          latitude: tracker.last_seen_latitude,
          longitude: tracker.last_seen_longitude,
          timestamp: tracker.last_seen_timestamp ? new Date(tracker.last_seen_timestamp).getTime() : Date.now(),
        } : null,
        locationHistory: [], // We'll fetch this separately when needed
        connectionStatus: tracker.connection_status as any || undefined,
        bleId: tracker.ble_id || undefined,
      }));
      
      dispatch(setTrackers(transformedTrackers));
      return transformedTrackers;
    } catch (error) {
      dispatch(setTrackerError((error as Error).message));
      throw error;
    } finally {
      dispatch(setTrackerLoading(false));
    }
  };

  // Creates a new tracker in Supabase
  const createTracker = async (name: string, type: 'physical' | 'virtual', initialLocation?: LocationPoint) => {
    try {
      setLoading(true);
      
      const newTrackerData = await trackerService.createTracker({
        name,
        type,
        last_seen_latitude: initialLocation?.latitude,
        last_seen_longitude: initialLocation?.longitude,
      });
      
      // Transform to our redux format
      const newTracker: Tracker = {
        id: newTrackerData.id,
        name: newTrackerData.name,
        type: newTrackerData.type,
        isActive: newTrackerData.is_active,
        lastSeen: newTrackerData.last_seen_latitude && newTrackerData.last_seen_longitude ? {
          latitude: newTrackerData.last_seen_latitude,
          longitude: newTrackerData.last_seen_longitude,
          timestamp: newTrackerData.last_seen_timestamp ? new Date(newTrackerData.last_seen_timestamp).getTime() : Date.now(),
        } : null,
        locationHistory: [],
      };
      
      dispatch(addTracker(newTracker));
      return newTracker;
    } catch (error) {
      dispatch(setTrackerError((error as Error).message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Updates a tracker in Supabase
  const updateTrackerDetails = async (trackerId: string, updates: Partial<Tracker>) => {
    try {
      setLoading(true);
      
      // Transform to match Supabase format
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.icon) supabaseUpdates.icon = updates.icon;
      if (updates.batteryLevel !== undefined) supabaseUpdates.battery_level = updates.batteryLevel;
      if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
      if (updates.connectionStatus) supabaseUpdates.connection_status = updates.connectionStatus;
      
      await trackerService.updateTracker(trackerId, supabaseUpdates);
      
      dispatch(updateTracker({ id: trackerId, updates }));
    } catch (error) {
      dispatch(setTrackerError((error as Error).message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Deletes a tracker from Supabase
  const deleteTracker = async (trackerId: string) => {
    try {
      setLoading(true);
      await trackerService.deleteTracker(trackerId);
      dispatch(removeTracker(trackerId));
    } catch (error) {
      dispatch(setTrackerError((error as Error).message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Updates a tracker's location in Supabase
  const updateLocation = async (trackerId: string, location: LocationPoint) => {
    try {
      await trackerService.updateTrackerLocation(trackerId, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });
      
      dispatch(updateTrackerLocation({ id: trackerId, location }));
    } catch (error) {
      dispatch(setTrackerError((error as Error).message));
      throw error;
    }
  };

  // Fetches location history for a tracker
  const fetchTrackerHistory = async (trackerId: string) => {
    try {
      setLoading(true);
      const historyData = await trackerService.getTrackerHistory(trackerId);
      
      // Transform to our redux format
      const locationHistory: LocationPoint[] = historyData.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: new Date(point.timestamp).getTime(),
        accuracy: point.accuracy || undefined,
      }));
      
      dispatch(updateTracker({ 
        id: trackerId, 
        updates: { locationHistory } 
      }));
      
      return locationHistory;
    } catch (error) {
      dispatch(setTrackerError((error as Error).message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchTrackers,
    createTracker,
    updateTrackerDetails,
    deleteTracker,
    updateLocation,
    fetchTrackerHistory,
  };
};