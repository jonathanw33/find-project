import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { Geofence, geofenceService, CreateGeofenceParams, UpdateGeofenceParams } from '../services/geofence/geofenceService';
import { TrackerGeofence } from '../types/geofence';

interface GeofenceContextType {
  geofences: Geofence[];
  loading: boolean;
  error: string | null;
  createGeofence: (params: CreateGeofenceParams) => Promise<Geofence>;
  updateGeofence: (id: string, params: UpdateGeofenceParams) => Promise<Geofence>;
  deleteGeofence: (id: string) => Promise<void>;
  linkTrackerToGeofence: (trackerId: string, geofenceId: string, alertOnEnter?: boolean, alertOnExit?: boolean) => Promise<void>;
  unlinkTrackerFromGeofence: (trackerId: string, geofenceId: string) => Promise<void>;
  getLinkedGeofences: (trackerId: string) => Promise<(Geofence & { alertOnEnter: boolean, alertOnExit: boolean })[]>;
  updateTrackerGeofence: (trackerId: string, geofenceId: string, alertOnEnter: boolean, alertOnExit: boolean) => Promise<void>;
}

const GeofenceContext = createContext<GeofenceContextType | undefined>(undefined);

export const useGeofence = () => {
  const context = useContext(GeofenceContext);
  if (!context) {
    throw new Error('useGeofence must be used within a GeofenceProvider');
  }
  return context;
};

export const GeofenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
  // Load all geofences when authenticated
  useEffect(() => {
    if (!authLoading && user) {
      loadGeofences();
    } else if (!authLoading && !user) {
      setGeofences([]);
    }
  }, [user, authLoading]);

  const loadGeofences = async () => {
    if (!user || !user.id) {
      console.log("Not loading geofences - no user is authenticated");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await geofenceService.getGeofences();
      setGeofences(data);
    } catch (err) {
      setError(err.message);
      console.error("Error loading geofences:", err);
    } finally {
      setLoading(false);
    }
  };

  const createGeofence = async (params: CreateGeofenceParams): Promise<Geofence> => {
    try {
      setLoading(true);
      setError(null);
      
      const newGeofence = await geofenceService.createGeofence(params);
      setGeofences(prev => [newGeofence, ...prev]);
      
      return newGeofence;
    } catch (err) {
      setError(err.message);
      console.error("Error creating geofence:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateGeofence = async (id: string, params: UpdateGeofenceParams): Promise<Geofence> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedGeofence = await geofenceService.updateGeofence(id, params);
      setGeofences(prev => 
        prev.map(g => g.id === id ? updatedGeofence : g)
      );
      
      return updatedGeofence;
    } catch (err) {
      setError(err.message);
      console.error("Error updating geofence:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteGeofence = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await geofenceService.deleteGeofence(id);
      setGeofences(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      setError(err.message);
      console.error("Error deleting geofence:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };  const linkTrackerToGeofence = async (
    trackerId: string, 
    geofenceId: string, 
    alertOnEnter: boolean = false, 
    alertOnExit: boolean = false
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await geofenceService.linkTrackerToGeofence(trackerId, geofenceId, alertOnEnter, alertOnExit);
    } catch (err) {
      setError(err.message);
      console.error("Error linking tracker to geofence:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTrackerGeofence = async (
    trackerId: string, 
    geofenceId: string, 
    alertOnEnter: boolean,
    alertOnExit: boolean
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await geofenceService.updateTrackerGeofence(trackerId, geofenceId, alertOnEnter, alertOnExit);
    } catch (err) {
      setError(err.message);
      console.error("Error updating tracker geofence link:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unlinkTrackerFromGeofence = async (trackerId: string, geofenceId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await geofenceService.unlinkTrackerFromGeofence(trackerId, geofenceId);
    } catch (err) {
      setError(err.message);
      console.error("Error unlinking tracker from geofence:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getLinkedGeofences = async (trackerId: string): Promise<(Geofence & { alertOnEnter: boolean, alertOnExit: boolean })[]> => {
    try {
      // Don't set global loading state for this operation
      return await geofenceService.getLinkedGeofences(trackerId);
    } catch (err) {
      console.error("Error getting linked geofences:", err);
      throw err;
    }
  };

  const value = {
    geofences,
    loading,
    error,
    createGeofence,
    updateGeofence,
    deleteGeofence,
    linkTrackerToGeofence,
    unlinkTrackerFromGeofence,
    getLinkedGeofences,
    updateTrackerGeofence,
  };

  return <GeofenceContext.Provider value={value}>{children}</GeofenceContext.Provider>;
};