import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { 
  ScheduledAlert, 
  scheduledAlertService, 
  CreateScheduledAlertParams, 
  UpdateScheduledAlertParams 
} from '../services/scheduledAlerts/scheduledAlertService';

interface ScheduledAlertContextType {
  scheduledAlerts: ScheduledAlert[];
  loading: boolean;
  error: string | null;
  createScheduledAlert: (params: CreateScheduledAlertParams) => Promise<ScheduledAlert>;
  updateScheduledAlert: (id: string, params: UpdateScheduledAlertParams) => Promise<ScheduledAlert>;
  deleteScheduledAlert: (id: string) => Promise<void>;
  getScheduledAlertsForTracker: (trackerId: string) => Promise<ScheduledAlert[]>;
}

const ScheduledAlertContext = createContext<ScheduledAlertContextType | undefined>(undefined);

export const useScheduledAlert = () => {
  const context = useContext(ScheduledAlertContext);
  if (!context) {
    throw new Error('useScheduledAlert must be used within a ScheduledAlertProvider');
  }
  return context;
};

export const ScheduledAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scheduledAlerts, setScheduledAlerts] = useState<ScheduledAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);

  // Load all scheduled alerts when authenticated
  useEffect(() => {
    if (!authLoading && user) {
      loadScheduledAlerts();
    } else if (!authLoading && !user) {
      setScheduledAlerts([]);
    }
  }, [user, authLoading]);

  const loadScheduledAlerts = async () => {
    if (!user || !user.id) {
      console.log("Not loading scheduled alerts - no user is authenticated");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await scheduledAlertService.getScheduledAlerts();
      setScheduledAlerts(data);
    } catch (err) {
      setError(err.message);
      console.error("Error loading scheduled alerts:", err);
    } finally {
      setLoading(false);
    }
  };
  const createScheduledAlert = async (params: CreateScheduledAlertParams): Promise<ScheduledAlert> => {
    try {
      setLoading(true);
      setError(null);
      
      const newAlert = await scheduledAlertService.createScheduledAlert(params);
      setScheduledAlerts(prev => [newAlert, ...prev]);
      
      return newAlert;
    } catch (err) {
      setError(err.message);
      console.error("Error creating scheduled alert:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateScheduledAlert = async (id: string, params: UpdateScheduledAlertParams): Promise<ScheduledAlert> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedAlert = await scheduledAlertService.updateScheduledAlert(id, params);
      setScheduledAlerts(prev => 
        prev.map(alert => alert.id === id ? updatedAlert : alert)
      );
      
      return updatedAlert;
    } catch (err) {
      setError(err.message);
      console.error("Error updating scheduled alert:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteScheduledAlert = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await scheduledAlertService.deleteScheduledAlert(id);
      setScheduledAlerts(prev => prev.filter(alert => alert.id !== id));
    } catch (err) {
      setError(err.message);
      console.error("Error deleting scheduled alert:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getScheduledAlertsForTracker = async (trackerId: string): Promise<ScheduledAlert[]> => {
    try {
      setLoading(true);
      setError(null);
      
      return await scheduledAlertService.getScheduledAlerts(trackerId);
    } catch (err) {
      setError(err.message);
      console.error("Error getting scheduled alerts for tracker:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    scheduledAlerts,
    loading,
    error,
    createScheduledAlert,
    updateScheduledAlert,
    deleteScheduledAlert,
    getScheduledAlertsForTracker,
  };

  return <ScheduledAlertContext.Provider value={value}>{children}</ScheduledAlertContext.Provider>;
};