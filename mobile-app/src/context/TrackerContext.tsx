import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Tracker,
  LocationPoint,
  setTrackers,
  addTracker,
  updateTracker,
  removeTracker,
  updateTrackerLocation,
  setSelectedTracker,
  setTrackerLoading,
  setTrackerError 
} from '../redux/slices/trackerSlice';
import { RootState } from '../redux/store';
import * as Location from 'expo-location';
import { supabase, trackerService } from '../services/supabase';

// No longer needed as Supabase will generate UUIDs
// const generateUUID = () => {
//   const timestamp = Date.now().toString(36);
//   const randomStr = Math.random().toString(36).substring(2, 15);
//   return `${timestamp}-${randomStr}`;
// };

// Using the Supabase client from services/supabase.ts

interface TrackerContextType {
  createVirtualTracker: (name: string, initialLocation?: LocationPoint) => Promise<Tracker>;
  updateTrackerDetails: (id: string, updates: Partial<Tracker>) => Promise<void>;
  deleteTracker: (id: string) => Promise<void>;
  selectTracker: (id: string | null) => void;
  moveVirtualTracker: (id: string, location: LocationPoint) => Promise<void>;
  startTrackerSimulation: (id: string, pattern: 'random' | 'circle' | 'line', options?: any) => void;
  stopTrackerSimulation: (id: string) => void;
  getCurrentUserLocation: () => Promise<LocationPoint>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};

// Helper for simulation
const simulationIntervals: Record<string, NodeJS.Timeout> = {};

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const { trackers, selectedTrackerId } = useSelector((state: RootState) => state.trackers);
  const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Only load trackers when auth is not loading and we have a user
    console.log("TrackerProvider mounted or user changed:", user?.id, "Auth loading:", authLoading);
    
    if (!authLoading && user) {
      loadTrackers();
    } else if (!authLoading && !user) {
      // Clear trackers when user logs out
      dispatch(setTrackers([])); // Pass an empty array, not an empty object
    }

    // Clean up any simulations on unmount
    return () => {
      Object.keys(simulationIntervals).forEach(id => {
        clearInterval(simulationIntervals[id]);
        delete simulationIntervals[id];
      });
    };
  }, [user, authLoading]);

  const loadTrackers = async () => {
    // Add a safety check to ensure we have a user before making the Supabase call
    if (!user || !user.id) {
      console.log("Not loading trackers - no user is authenticated");
      return;
    }
    
    try {
      dispatch(setTrackerLoading(true));
      console.log("Loading trackers for user:", user.id);
      
      // Fetch trackers from Supabase
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
      
      console.log("Setting trackers from Supabase:", transformedTrackers);
      
      // Make sure we're passing an array, even if empty
      dispatch(setTrackers(transformedTrackers || []));
    } catch (error) {
      console.error("Error loading trackers:", error);
      
      // Don't show auth errors if we have a valid user (could be a temporary auth token issue)
      if (user && user.id && (error as Error).message.includes('User not authenticated')) {
        console.log("Ignoring auth error since we have a valid user:", user.id);
        // Try again after a short delay - could be a token refresh issue
        setTimeout(() => {
          if (user && user.id) {
            loadTrackers();
          }
        }, 1000);
      } else {
        dispatch(setTrackerError((error as Error).message));
      }
    } finally {
      dispatch(setTrackerLoading(false));
    }
  };

  const createVirtualTracker = async (name: string, initialLocation?: LocationPoint): Promise<Tracker> => {
    try {
      dispatch(setTrackerLoading(true));
      console.log("Creating virtual tracker with name:", name);
      
      let location: LocationPoint;
      if (!initialLocation) {
        location = await getCurrentUserLocation();
      } else {
        location = initialLocation;
      }
      
      console.log("Tracker location:", location);
      
      // Save to Supabase
      const newTrackerData = await trackerService.createTracker({
        name,
        type: 'virtual',
        last_seen_latitude: location.latitude,
        last_seen_longitude: location.longitude,
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
      
      console.log("New tracker created in Supabase:", newTracker);
      
      dispatch(addTracker(newTracker));
      return newTracker;
    } catch (error) {
      console.error("Error creating tracker:", error);
      dispatch(setTrackerError((error as Error).message));
      throw error;
    } finally {
      dispatch(setTrackerLoading(false));
    }
  };

  const updateTrackerDetails = async (id: string, updates: Partial<Tracker>) => {
    try {
      dispatch(setTrackerLoading(true));
      
      // Transform to match Supabase format
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.icon) supabaseUpdates.icon = updates.icon;
      if (updates.batteryLevel !== undefined) supabaseUpdates.battery_level = updates.batteryLevel;
      if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
      if (updates.connectionStatus) supabaseUpdates.connection_status = updates.connectionStatus;
      
      // Update in Supabase
      await trackerService.updateTracker(id, supabaseUpdates);
      
      dispatch(updateTracker({ id, updates }));
    } catch (error) {
      dispatch(setTrackerError((error as Error).message));
      throw error;
    } finally {
      dispatch(setTrackerLoading(false));
    }
  };

  const deleteTracker = async (id: string) => {
    try {
      dispatch(setTrackerLoading(true));
      
      // Delete from Supabase
      await trackerService.deleteTracker(id);
      
      // Stop any ongoing simulation
      stopTrackerSimulation(id);
      
      dispatch(removeTracker(id));
    } catch (error) {
      dispatch(setTrackerError((error as Error).message));
      throw error;
    } finally {
      dispatch(setTrackerLoading(false));
    }
  };

  const selectTracker = (id: string | null) => {
    dispatch(setSelectedTracker(id));
  };

  const moveVirtualTracker = async (id: string, location: LocationPoint) => {
    try {
      // Update in Supabase
      await trackerService.updateTrackerLocation(id, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });
      
      dispatch(updateTrackerLocation({ id, location }));
      
      // Check for geofence crossings after updating the location
      const { clientAlertChecker } = await import('../services/clientAlertChecker');
      clientAlertChecker.checkGeofences(id, location.latitude, location.longitude);
    } catch (error) {
      dispatch(setTrackerError((error as Error).message));
      throw error;
    }
  };

  const startTrackerSimulation = (
    id: string, 
    pattern: 'random' | 'circle' | 'line' = 'random',
    options: any = {}
  ) => {
    // Stop any existing simulation for this tracker
    stopTrackerSimulation(id);
    
    const tracker = trackers[id];
    if (!tracker || tracker.type !== 'virtual') return;
    
    const startLocation = tracker.lastSeen || {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: Date.now(),
    };
    
    let centerLat = startLocation.latitude;
    let centerLng = startLocation.longitude;
    let radius = options.radius || 0.0005; // About A smaller value (50m) for better geofence testing
    let angle = 0;
    let direction = options.direction || 0; // Radians
    let speed = options.speed || 0.00005; // About 5m per update
    
    // Only log for user feedback, but keep it minimal
    console.log(`Started ${pattern} simulation for "${trackers[id]?.name || id}"`);
    
    // Immediately update the tracker location to ensure it's set
    moveVirtualTracker(id, {
      latitude: startLocation.latitude,
      longitude: startLocation.longitude,
      timestamp: Date.now(),
    });
    
    simulationIntervals[id] = setInterval(() => {
      let newLat, newLng;
      
      switch (pattern) {
        case 'circle':
          // Move in a circle around the starting point
          newLat = centerLat + Math.cos(angle) * radius;
          newLng = centerLng + Math.sin(angle) * radius;
          angle += 0.1; // Increment angle for next update
          break;
          
        case 'line':
          // Move in a straight line in the given direction
          newLat = startLocation.latitude + Math.cos(direction) * speed * simulationIntervals[id] as any;
          newLng = startLocation.longitude + Math.sin(direction) * speed * simulationIntervals[id] as any;
          break;
          
        case 'random':
        default:
          // Random movement within a range
          newLat = startLocation.latitude + (Math.random() - 0.5) * 0.001;
          newLng = startLocation.longitude + (Math.random() - 0.5) * 0.001;
          break;
      }
      
      const newLocation = {
        latitude: newLat,
        longitude: newLng,
        timestamp: Date.now(),
      };
      
      // Verbose logging would just clutter the console, only enable for debugging
      if (process.env.NODE_ENV === 'development' && false) { // Set to true for detailed simulation logs
        console.log(`Simulation update: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
      }
      
      moveVirtualTracker(id, newLocation);
    }, 2000); // Update every 2 seconds (faster for better visual effect)
  };

  const stopTrackerSimulation = (id: string) => {
    if (simulationIntervals[id]) {
      console.log(`Stopping TrackerContext simulation for ${id}`);
      clearInterval(simulationIntervals[id]);
      delete simulationIntervals[id];
    } else {
      console.log(`No TrackerContext simulation found for ${id}`);
    }
  };

  const getCurrentUserLocation = async (): Promise<LocationPoint> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }
      
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  };

  const value = {
    createVirtualTracker,
    updateTrackerDetails,
    deleteTracker,
    selectTracker,
    moveVirtualTracker,
    startTrackerSimulation,
    stopTrackerSimulation,
    getCurrentUserLocation,
  };

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
};