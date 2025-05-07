import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Alert,
  setAlerts,
  addAlert,
  updateAlert,
  removeAlert,
  markAlertAsRead,
  markAllAlertsAsRead,
  setAlertLoading,
  setAlertError
} from '../redux/slices/alertSlice';
import { RootState } from '../redux/store';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple UUID generator that doesn't rely on crypto
const generateUUID = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
};

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

interface AlertContextType {
  createAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'isRead' | 'isActive'>) => Promise<Alert>;
  updateAlertDetails: (id: string, updates: Partial<Alert>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  simulateLeftBehindAlert: (trackerId: string, trackerName: string) => Promise<Alert>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const { alerts } = useSelector((state: RootState) => state.alerts);
  const { user } = useSelector((state: RootState) => state.auth);
  const { trackers } = useSelector((state: RootState) => state.trackers);

  useEffect(() => {
    // Load alerts when user changes
    if (user) {
      loadAlerts();
    } else {
      // Clear alerts when user logs out
      dispatch(setAlerts([]));
    }
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;
    
    try {
      dispatch(setAlertLoading(true));
      
      // In a real implementation, fetch from Supabase
      // For now, we'll use empty alerts
      dispatch(setAlerts([]));
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
    } finally {
      dispatch(setAlertLoading(false));
    }
  };

  const createAlert = async (
    alertData: Omit<Alert, 'id' | 'timestamp' | 'isRead' | 'isActive'>
  ): Promise<Alert> => {
    try {
      dispatch(setAlertLoading(true));
      
      const newAlert: Alert = {
        ...alertData,
        id: generateUUID(),
        timestamp: Date.now(),
        isRead: false,
        isActive: true,
      };
      
      // In a real implementation, save to Supabase
      
      dispatch(addAlert(newAlert));
      return newAlert;
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    } finally {
      dispatch(setAlertLoading(false));
    }
  };

  const updateAlertDetails = async (id: string, updates: Partial<Alert>) => {
    try {
      dispatch(setAlertLoading(true));
      
      // In a real implementation, update in Supabase
      
      dispatch(updateAlert({ id, updates }));
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    } finally {
      dispatch(setAlertLoading(false));
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      dispatch(setAlertLoading(true));
      
      // In a real implementation, delete from Supabase
      
      dispatch(removeAlert(id));
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    } finally {
      dispatch(setAlertLoading(false));
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // In a real implementation, update in Supabase
      
      dispatch(markAlertAsRead(id));
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      // In a real implementation, update in Supabase
      
      dispatch(markAllAlertsAsRead());
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    }
  };

  const simulateLeftBehindAlert = async (trackerId: string, trackerName: string): Promise<Alert> => {
    return createAlert({
      trackerId,
      type: 'left_behind',
      title: 'Item Left Behind',
      message: `You might be leaving your ${trackerName} behind!`,
      icon: 'warning',
    });
  };

  const value = {
    createAlert,
    updateAlertDetails,
    deleteAlert,
    markAsRead,
    markAllAsRead,
    simulateLeftBehindAlert,
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};