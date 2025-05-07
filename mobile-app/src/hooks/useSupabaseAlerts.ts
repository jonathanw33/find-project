import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  setAlerts, 
  addAlert, 
  updateAlert, 
  removeAlert, 
  markAlertAsRead,
  markAllAlertsAsRead,
  setAlertLoading,
  setAlertError,
  Alert
} from '../redux/slices/alertSlice';
import { alertService } from '../services/supabase';

export const useSupabaseAlerts = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Fetches all alerts from Supabase
  const fetchAlerts = async () => {
    try {
      dispatch(setAlertLoading(true));
      const alertsData = await alertService.getAlerts();
      
      // Transform data to match our redux format
      const transformedAlerts: Alert[] = alertsData.map(alert => ({
        id: alert.id,
        trackerId: alert.tracker_id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        timestamp: new Date(alert.timestamp).getTime(),
        isRead: alert.is_read,
        isActive: alert.is_active,
        icon: alert.icon || undefined,
        data: alert.data as any || undefined,
      }));
      
      dispatch(setAlerts(transformedAlerts));
      return transformedAlerts;
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    } finally {
      dispatch(setAlertLoading(false));
    }
  };

  // Creates a new alert in Supabase
  const createAlert = async (alertData: Omit<Alert, 'id' | 'timestamp' | 'isRead' | 'isActive'>) => {
    try {
      setLoading(true);
      
      const alertId = await alertService.createAlert({
        tracker_id: alertData.trackerId,
        type: alertData.type,
        title: alertData.title,
        message: alertData.message,
        icon: alertData.icon,
        data: alertData.data,
      });
      
      // Fetch the newly created alert to get all data
      const alerts = await fetchAlerts();
      const newAlert = alerts.find(a => a.id === alertId);
      
      if (newAlert) {
        dispatch(addAlert(newAlert));
        return newAlert;
      }
      
      throw new Error('Failed to create alert');
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Marks an alert as read in Supabase
  const markAsRead = async (alertId: string) => {
    try {
      setLoading(true);
      await alertService.markAlertAsRead(alertId);
      dispatch(markAlertAsRead(alertId));
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Marks all alerts as read in Supabase
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await alertService.markAllAlertsAsRead();
      dispatch(markAllAlertsAsRead());
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Deletes an alert from Supabase
  const deleteAlert = async (alertId: string) => {
    try {
      setLoading(true);
      await alertService.deleteAlert(alertId);
      dispatch(removeAlert(alertId));
    } catch (error) {
      dispatch(setAlertError((error as Error).message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Simulate a "left behind" alert
  const simulateLeftBehindAlert = async (trackerId: string, trackerName: string) => {
    return createAlert({
      trackerId,
      type: 'left_behind',
      title: 'Item Left Behind',
      message: `You might be leaving your ${trackerName} behind!`,
      icon: 'warning',
    });
  };

  return {
    loading,
    fetchAlerts,
    createAlert,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    simulateLeftBehindAlert,
  };
};