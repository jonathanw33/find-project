// This is an updated version of your TrackerContext.tsx
// Replace your existing file with this one to enable Supabase integration

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
import { createClient } from '@supabase/supabase-js';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Supabase client
const supabaseUrl = 'https://hxdurjngbkfnbryzczau.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    fetch: global.fetch,
    headers: {
      'X-Client-Info': 'react-native-v2.39.7',
    }
  },
  // Disable realtime subscriptions to avoid WebSocket issues
  realtime: {
    params: {
      eventsPerSecond: 0, // Disable realtime completely
    },
  },
});

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
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Load trackers when component mounts or user changes
    if (user?.id) {
      loadTrackers();
    }

    // Clean up any simulations on unmount
    return () => {
      Object.keys(simulationIntervals).forEach(id => {
        clearInterval(simulationIntervals[id]);
        delete simulationIntervals[id];
      });
    };
  }, [user]);

  const loadTrackers = async () => {
    if (!user?.id) return;
    
    try {
      dispatch(setTrackerLoading(true));
      console.log("Loading trackers for user:", user.id);
      
      // Fetch trackers from Supabase
      const { data: trackersData, error } = await supabase
        .from('trackers')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Transform Supabase data to our app's format
      const formattedTrackers: Record<string, Tracker> = {};
      
      trackersData.forEach(t => {
        formattedTrackers[t.id] = {
          id: t.id,
          name: t.name,
          type: t.type as 'physical' | 'virtual',
          isActive: t.is_active,
          lastSeen: t.last_seen_latitude && t.last_seen_longitude ? {
            latitude: t.last_seen_latitude,
            longitude: t.last_seen_longitude,
            timestamp: t.last_seen_timestamp ? new Date(t.last_seen_timestamp).getTime() : Date.now(),
          } : null,
          locationHistory: [], // We'll get this separately if needed
          batteryLevel: t.battery_level,
          connectionStatus: t.connection_status as any,
          bleId: t.ble_id,
        };
      });
      
      console.log("Loaded trackers from Supabase:", formattedTrackers);
      dispatch(setTrackers(formattedTrackers));
    } catch (error) {
      console.error("Error loading trackers:", error);
      dispatch(setTrackerError((error as Error).message));
    } finally {
      dispatch(setTrackerLoading(false));
    }
  };

  const createVirtualTracker = async (name: string, initialLocation?: LocationPoint): Promise<Tracker> => {
    if (!user?.id) throw new Error("User not authenticated");
    
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
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('trackers')
        .insert({
          user_id: user.id,
          name: name,
          type: 'virtual',
          is_active: true,
          last_seen_latitude: location.latitude,
          last_seen_longitude: location.longitude,
          last_seen_timestamp: new Date().toISOString(),
          connection_status: 'connected',
        })
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Failed to create tracker");
      
      const trackerId = data[0].id;
      
      // Also update location history
      await supabase
        .from('location_history')
        .insert({
          tracker_id: trackerId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        });
      
      const newTracker: Tracker = {
        id: trackerId,
        name,
        type: 'virtual',
        isActive: true,
        lastSeen: location,
        locationHistory: [location],
      };
      
      console.log("Tracker created in Supabase:", newTracker);
      
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
      
      // Prepare updates for Supabase
      const supabaseUpdates: any = {};
      
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
      if (updates.batteryLevel !== undefined) supabaseUpdates.battery_level = updates.batteryLevel;
      if (updates.connectionStatus) supabaseUpdates.connection_status = updates.connectionStatus;
      
      // Update in Supabase
      const { error } = await supabase
        .from('trackers')
        .update(supabaseUpdates)
        .eq('id', id);
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('trackers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
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
      const { error: trackerError } = await supabase
        .from('trackers')
        .update({
          last_seen_latitude: location.latitude,
          last_seen_longitude: location.longitude,
          last_seen_timestamp: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (trackerError) throw trackerError;
      
      // Add to location history
      const { error: historyError } = await supabase
        .from('location_history')
        .insert({
          tracker_id: id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        });
      
      if (historyError) console.error("Error updating location history:", historyError);
      
      dispatch(updateTrackerLocation({ id, location }));
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
    let radius = options.radius || 0.001; // About 100m
    let angle = 0;
    let direction = options.direction || 0; // Radians
    let speed = options.speed || 0.00005; // About 5m per update
    
    console.log(`Starting ${pattern} simulation for tracker ${id}, starting at:`, startLocation);
    
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
      
      console.log(`Simulation update for tracker ${id}:`, newLocation);
      moveVirtualTracker(id, newLocation);
    }, 2000); // Update every 2 seconds (faster for better visual effect)
  };

  const stopTrackerSimulation = (id: string) => {
    if (simulationIntervals[id]) {
      clearInterval(simulationIntervals[id]);
      delete simulationIntervals[id];
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