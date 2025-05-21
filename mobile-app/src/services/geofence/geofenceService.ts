import { supabase } from '../../services/supabase';
import { TrackerGeofence } from '../../types/geofence';

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGeofenceParams {
  name: string;
  description?: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  isActive?: boolean;
}

export interface UpdateGeofenceParams {
  name?: string;
  description?: string;
  centerLatitude?: number;
  centerLongitude?: number;
  radius?: number;
  isActive?: boolean;
}

export const geofenceService = {
  async getGeofences(): Promise<Geofence[]> {
    const { data, error } = await supabase
      .from('geofences')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Properly transform database fields to client model
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      centerLatitude: item.center_latitude,
      centerLongitude: item.center_longitude,
      radius: item.radius,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  },
  
  async getGeofence(id: string): Promise<Geofence> {
    const { data, error } = await supabase
      .from('geofences')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    // Properly transform database fields to client model
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      centerLatitude: data.center_latitude,
      centerLongitude: data.center_longitude,
      radius: data.radius,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
  
  async createGeofence(params: CreateGeofenceParams): Promise<Geofence> {
    // Get the current user ID
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('geofences')
      .insert({
        user_id: userId,
        name: params.name,
        description: params.description,
        center_latitude: params.centerLatitude,
        center_longitude: params.centerLongitude,
        radius: params.radius,
        is_active: params.isActive !== undefined ? params.isActive : true,
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async updateGeofence(id: string, params: UpdateGeofenceParams): Promise<Geofence> {
    const updates: any = {};
    
    if (params.name !== undefined) updates.name = params.name;
    if (params.description !== undefined) updates.description = params.description;
    if (params.centerLatitude !== undefined) updates.center_latitude = params.centerLatitude;
    if (params.centerLongitude !== undefined) updates.center_longitude = params.centerLongitude;
    if (params.radius !== undefined) updates.radius = params.radius;
    if (params.isActive !== undefined) updates.is_active = params.isActive;
    
    const { data, error } = await supabase
      .from('geofences')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async deleteGeofence(id: string): Promise<void> {
    const { error } = await supabase
      .from('geofences')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },
  
  async linkTrackerToGeofence(
    trackerId: string, 
    geofenceId: string, 
    alertOnEnter: boolean = false, 
    alertOnExit: boolean = false
  ): Promise<TrackerGeofence> {
    const { data, error } = await supabase
      .from('tracker_geofences')
      .insert({
        tracker_id: trackerId,
        geofence_id: geofenceId,
        alert_on_enter: alertOnEnter,
        alert_on_exit: alertOnExit,
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async updateTrackerGeofence(
    trackerId: string, 
    geofenceId: string, 
    alertOnEnter: boolean,
    alertOnExit: boolean
  ): Promise<TrackerGeofence> {
    const { data, error } = await supabase
      .from('tracker_geofences')
      .update({
        alert_on_enter: alertOnEnter,
        alert_on_exit: alertOnExit,
      })
      .match({ tracker_id: trackerId, geofence_id: geofenceId })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async unlinkTrackerFromGeofence(trackerId: string, geofenceId: string): Promise<void> {
    const { error } = await supabase
      .from('tracker_geofences')
      .delete()
      .match({ tracker_id: trackerId, geofence_id: geofenceId });
      
    if (error) throw error;
  },
  
  async getLinkedGeofences(trackerId: string): Promise<(Geofence & { alertOnEnter: boolean, alertOnExit: boolean })[]> {
    const { data, error } = await supabase
      .from('tracker_geofences')
      .select(`
        geofence_id,
        alert_on_enter,
        alert_on_exit,
        geofences:geofence_id (*)
      `)
      .eq('tracker_id', trackerId);
      
    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item.geofences,
      alertOnEnter: item.alert_on_enter,
      alertOnExit: item.alert_on_exit,
    }));
  },
};
