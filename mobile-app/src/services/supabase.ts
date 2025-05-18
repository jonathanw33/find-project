import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Supabase configuration
const supabaseUrl = 'https://hxdurjngbkfnbryzczau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw';

// Create Supabase client with error handling
let supabase;
try {
  console.log('Creating Supabase client with URL:', supabaseUrl);
  
  // Completely disable realtime features to avoid WebSocket dependencies
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      enabled: false,
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  });
  
  console.log('Supabase client created successfully');
  
  // Add supabaseAnonKey to the exported supabase object for use in bluetoothService
  supabase.supabaseUrl = supabaseUrl;
  supabase.supabaseAnonKey = supabaseAnonKey;
  
  // Set up session refresh timer
  setInterval(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        // This will trigger a token refresh if needed
        await supabase.auth.refreshSession();
      }
    } catch (e) {
      console.error('Error refreshing token:', e);
    }
  }, 60000); // Check every minute
  
} catch (error) {
  console.error('Error creating Supabase client:', error);
  
  // Create a minimal mock implementation
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase not available') }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({ data: [], error: null }),
          })
        })
      }),
    }),
    rpc: async () => ({ data: null, error: new Error('Supabase not available') }),
  };
  console.log('Using minimal mock Supabase client as fallback');
}

export { supabase };

// Tracker services
export const trackerService = {
  // Get all trackers for current user
  async getTrackers() {
    try {
      // Get the current user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Auth error in getTrackers:", authError);
        throw new Error("Authentication error: " + authError.message);
      }
      
      if (!user) {
        console.error("User not authenticated in getTrackers");
        throw new Error('User not authenticated. Please log in.');
      }
      
      const { data, error } = await supabase
        .from('trackers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Database error in getTrackers:", error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getTrackers:', error);
      throw error;
    }
  },
  
  // Get a single tracker by id
  async getTracker(trackerId: string) {
    const { data, error } = await supabase
      .from('trackers')
      .select('*')
      .eq('id', trackerId)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Create a new tracker
  async createTracker(tracker: {
    name: string;
    type: 'physical' | 'virtual';
    icon?: string;
    last_seen_latitude?: number;
    last_seen_longitude?: number;
    ble_id?: string;
  }) {
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated. Please log in.');
    }
    
    // Add user_id to the tracker object
    const { data, error } = await supabase
      .from('trackers')
      .insert({
        ...tracker,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Update a tracker
  async updateTracker(trackerId: string, updates: {
    name?: string;
    icon?: string;
    battery_level?: number;
    is_active?: boolean;
    connection_status?: 'connected' | 'disconnected' | 'connecting' | 'unknown';
  }) {
    const { data, error } = await supabase
      .from('trackers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trackerId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Update tracker location
  async updateTrackerLocation(trackerId: string, location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) {
    const { error } = await supabase.rpc('update_tracker_location', {
      tracker_id: trackerId,
      lat: location.latitude,
      lng: location.longitude,
      accuracy: location.accuracy,
    });
    
    if (error) throw error;
    return true;
  },
  
  // Delete a tracker
  async deleteTracker(trackerId: string) {
    const { error } = await supabase
      .from('trackers')
      .delete()
      .eq('id', trackerId);
    
    if (error) throw error;
    return true;
  },

  // Get location history for a tracker
  async getTrackerHistory(trackerId: string, limit = 100) {
    const { data, error } = await supabase
      .from('location_history')
      .select('*')
      .eq('tracker_id', trackerId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },
};

// Alert services
export const alertService = {
  // Get all alerts for current user
  async getAlerts() {
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated. Please log in.');
    }
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Create a new alert
  async createAlert(alert: {
    tracker_id: string;
    type: 'left_behind' | 'moved' | 'low_battery' | 'out_of_range' | 'custom';
    title: string;
    message: string;
    icon?: string;
    data?: any;
  }) {
    const { data, error } = await supabase.rpc('create_alert', {
      tracker_id: alert.tracker_id,
      alert_type: alert.type,
      alert_title: alert.title,
      alert_message: alert.message,
      alert_icon: alert.icon,
      alert_data: alert.data,
    });
    
    if (error) throw error;
    return data;
  },
  
  // Mark alert as read
  async markAlertAsRead(alertId: string) {
    const { data, error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Mark all alerts as read
  async markAllAlertsAsRead() {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .is('is_read', false);
    
    if (error) throw error;
    return true;
  },
  
  // Delete an alert
  async deleteAlert(alertId: string) {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId);
    
    if (error) throw error;
    return true;
  },
};

// User settings services
export const settingsService = {
  // Get user settings
  async getUserSettings() {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Update user settings
  async updateUserSettings(settings: {
    push_notifications?: boolean;
    alert_sounds?: boolean;
    vibration?: boolean;
    left_behind_alerts?: boolean;
    low_battery_alerts?: boolean;
    movement_alerts?: boolean;
    save_location_history?: boolean;
    share_analytics?: boolean;
    dark_mode?: boolean;
    distance_unit?: 'metric' | 'imperial';
  }) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};