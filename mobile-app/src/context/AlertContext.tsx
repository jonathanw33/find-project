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
import { supabase, alertService } from '../services/supabase';

// Using the Supabase client from services/supabase.ts

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
      
      // Set up periodic refresh to catch alerts created by background processes
      const alertRefreshInterval = setInterval(() => {
        loadAlerts();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(alertRefreshInterval);
    } else {
      // Clear alerts when user logs out
      dispatch(setAlerts([]));
    }
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;
    
    try {
      dispatch(setAlertLoading(true));
      
      // Fetch alerts from Supabase
      const alertsData = await alertService.getAlerts();
      
      // Transform to match our Redux structure
      const transformedAlerts: Alert[] = alertsData.map(alert => ({
        id: alert.id,
        trackerId: alert.tracker_id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        icon: alert.icon || undefined,
        isRead: alert.is_read,
        isActive: alert.is_active,
        data: alert.data || undefined,
        timestamp: new Date(alert.timestamp).getTime(),
      }));
      
      dispatch(setAlerts(transformedAlerts));
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
      
      // Create alert in Supabase
      const alertId = await alertService.createAlert({
        tracker_id: alertData.trackerId,
        type: alertData.type as any,
        title: alertData.title,
        message: alertData.message,
        icon: alertData.icon,
        data: alertData.data,
      });
      
      // Create the alert object for our Redux store
      const newAlert: Alert = {
        ...alertData,
        id: alertId as string,
        timestamp: Date.now(),
        isRead: false,
        isActive: true,
      };
      
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
      
      // Delete from Supabase
      await alertService.deleteAlert(id);
      
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
      // Update in Supabase
      await alertService.markAlertAsRead(id);
      
      dispatch(markAlertAsRead(id));
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update in Supabase
      await alertService.markAllAlertsAsRead();
      
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