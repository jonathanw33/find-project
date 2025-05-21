import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Client-side geofence and scheduled alerts checking
export const clientAlertChecker = {
  // Check for geofence crossings
  async checkGeofences(trackerId: string, latitude: number, longitude: number) {
    try {
      // First check if movement alerts are enabled
      const movementAlertsSetting = await AsyncStorage.getItem('setting_movement_alerts');
      if (movementAlertsSetting !== 'true') {
        // Only log this in development and when verbose logging is enabled
        if (process.env.NODE_ENV === 'development' && false) { // Set to true for verbose geofence logs
          console.log('Movement alerts are disabled. Skipping geofence check.');
        }
        return;
      }

      // Get all linked geofences for this tracker
      const { data: linkedGeofences, error } = await supabase
        .from('tracker_geofences')
        .select(`
          geofence_id,
          alert_on_enter,
          alert_on_exit,
          geofences:geofence_id (
            id,
            name,
            center_latitude,
            center_longitude,
            radius
          )
        `)
        .eq('tracker_id', trackerId);
      
      if (error) throw error;
      
      // Only log geofence checks if there are linked geofences (and keep it concise)
      const geofenceCount = linkedGeofences?.length || 0;
      if (geofenceCount > 0 && process.env.NODE_ENV === 'development') {
        // Only log minimal information to reduce console clutter
        console.log(`⚙️ Checking ${geofenceCount} geofences for tracker ${trackerId}`);
      }
      
      for (const item of linkedGeofences || []) {
        const geofence = item.geofences;
        
        // Calculate distance between tracker and geofence center
        const distance = this.calculateDistance(
          latitude, 
          longitude, 
          geofence.center_latitude, 
          geofence.center_longitude
        );
        
        // Determine if tracker is inside geofence
        const isInside = distance <= geofence.radius;
        
        // Get the previous state from local storage
        const storageKey = `geofence_state_${trackerId}_${geofence.id}`;
        const prevStateStr = await AsyncStorage.getItem(storageKey);
        const wasInside = prevStateStr ? JSON.parse(prevStateStr) : false;
        
        // Only log if there's a state change to reduce console clutter
        const stateChanged = isInside !== wasInside;
        if (stateChanged || process.env.NODE_ENV === 'development' && false) { // Set to true for verbose logging
          console.log(`Geofence ${geofence.name}: distance=${Math.round(distance)}m, radius=${geofence.radius}m, inside=${isInside}, was_inside=${wasInside}`);
        }
        
        // Check for enter/exit events
        if (item.alert_on_enter && isInside && !wasInside) {
          console.log(`🟢 ALERT: Tracker entered geofence "${geofence.name}"`);
          // Create enter alert
          await this.createGeofenceAlert(trackerId, geofence.id, 'enter');
        } else if (item.alert_on_exit && !isInside && wasInside) {
          console.log(`🔴 ALERT: Tracker exited geofence "${geofence.name}"`);
          // Create exit alert
          await this.createGeofenceAlert(trackerId, geofence.id, 'exit');
        }
        
        // Store current state for next check
        await AsyncStorage.setItem(storageKey, JSON.stringify(isInside));
      }
    } catch (error) {
      console.error('Error checking geofences:', error);
    }
  },
  
  // Create a geofence alert
  async createGeofenceAlert(trackerId: string, geofenceId: string, eventType: 'enter' | 'exit') {
    try {
      const { data: tracker } = await supabase
        .from('trackers')
        .select('name, user_id')
        .eq('id', trackerId)
        .single();
        
      const { data: geofence } = await supabase
        .from('geofences')
        .select('name')
        .eq('id', geofenceId)
        .single();
        
      await supabase.from('alerts').insert({
        user_id: tracker.user_id,
        tracker_id: trackerId,
        type: eventType === 'enter' ? 'geofence_enter' : 'geofence_exit',
        title: eventType === 'enter' ? 'Geofence Entered' : 'Geofence Exited',
        message: `${tracker.name} has ${eventType === 'enter' ? 'entered' : 'left'} ${geofence.name}`,
        geofence_data: {
          geofence_id: geofenceId,
          geofence_name: geofence.name
        }
      });
    } catch (error) {
      console.error('Error creating geofence alert:', error);
    }
  },  // Check for scheduled alerts
  async checkScheduledAlerts() {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay(); // 0-6 for Sunday-Saturday
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentDayOfMonth = now.getDate(); // 1-31
      
      // Get all active scheduled alerts that match the current time
      const { data: alerts, error } = await supabase
        .from('scheduled_alerts')
        .select('*')
        .eq('is_active', true)
        .eq('scheduled_time', currentTime)
        .or(`schedule_type.eq.one_time,schedule_type.eq.daily,and(schedule_type.eq.weekly,day_of_week.eq.${currentDay}),and(schedule_type.eq.monthly,day_of_month.eq.${currentDayOfMonth})`);
        
      if (error) throw error;
      
      // Filter one-time alerts to match the current date
      const triggeredAlerts = alerts?.filter(alert => 
        alert.schedule_type !== 'one_time' || alert.scheduled_date === currentDate
      ) || [];
      
      // Create alerts for each triggered scheduled alert
      for (const alert of triggeredAlerts) {
        // Skip if this alert was already triggered recently
        if (alert.last_triggered) {
          const lastTriggered = new Date(alert.last_triggered);
          const differenceMs = now.getTime() - lastTriggered.getTime();
          
          // Skip if triggered in the last hour (to prevent duplicates)
          if (differenceMs < 3600000) {
            continue;
          }
        }
        
        // Create the alert
        await supabase.from('alerts').insert({
          user_id: alert.user_id,
          tracker_id: alert.tracker_id,
          type: 'scheduled',
          title: alert.title,
          message: alert.message,
          schedule_data: {
            schedule_id: alert.id,
            schedule_type: alert.schedule_type,
          }
        });
        
        // Update the last triggered timestamp
        await supabase
          .from('scheduled_alerts')
          .update({ last_triggered: now.toISOString() })
          .eq('id', alert.id);
        
        // For one-time alerts, deactivate after triggering
        if (alert.schedule_type === 'one_time') {
          await supabase
            .from('scheduled_alerts')
            .update({ is_active: false })
            .eq('id', alert.id);
        }
      }
    } catch (error) {
      console.error('Error checking scheduled alerts:', error);
    }
  },  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }
};

export default clientAlertChecker;