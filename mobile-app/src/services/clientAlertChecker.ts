import { supabase, alertService } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Conditional notifications import
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.log('Expo notifications not available');
}

// Client-side geofence and scheduled alerts checking
export const clientAlertChecker = {
  // Track recent geofence checks to prevent duplicates
  recentChecks: new Map<string, { latitude: number, longitude: number, timestamp: number }>(),

  // Initialize notifications
  async setupNotifications() {
    if (!Notifications) {
      console.log('Notifications not available, skipping setup');
      return false;
    }

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('geofence-alerts', {
          name: 'Geofence Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9500',
        });
      }

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return false;
    }
  },

  // Show local notification
  async showNotification(title: string, message: string, data?: any) {
    if (!Notifications) {
      console.log('Notifications not available, skipping notification');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: data || {},
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  },

  // Check for geofence crossings
  async checkGeofences(trackerId: string, latitude: number, longitude: number) {
    try {
      // Prevent duplicate checks for the same location within 5 seconds
      const checkKey = `${trackerId}`;
      const lastCheck = this.recentChecks.get(checkKey);
      const now = Date.now();
      
      if (lastCheck) {
        const timeDiff = now - lastCheck.timestamp;
        const locationDiff = this.calculateDistance(
          latitude, longitude, 
          lastCheck.latitude, lastCheck.longitude
        );
        
        // Skip if same location checked within last 5 seconds or location hasn't moved significantly (< 1 meter)
        if (timeDiff < 5000 && locationDiff < 1) {
          return;
        }
      }
      
      // Update the last check record
      this.recentChecks.set(checkKey, { latitude, longitude, timestamp: now });
      
      // Clean up old entries (older than 1 minute)
      for (const [key, value] of this.recentChecks.entries()) {
        if (now - value.timestamp > 60000) {
          this.recentChecks.delete(key);
        }
      }

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
      
      // Get the tracker name for alerts
      const { data: tracker } = await supabase
        .from('trackers')
        .select('name')
        .eq('id', trackerId)
        .single();
      
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
        if (stateChanged) {
          console.log(`Geofence ${geofence.name}: distance=${Math.round(distance)}m, radius=${geofence.radius}m, inside=${isInside}, was_inside=${wasInside}`);
        }
        
        // Check for enter/exit events
        if (item.alert_on_enter && isInside && !wasInside) {
          console.log(`🟢 ALERT: Tracker entered geofence "${geofence.name}"`);
          
          // Show local notification
          this.showNotification(
            'Geofence Entered',
            `${tracker.name} has entered ${geofence.name}`,
            { 
              type: 'geofence_enter',
              trackerId,
              geofenceId: geofence.id
            }
          );
          
          // Create enter alert
          await this.createGeofenceAlert(trackerId, geofence.id, 'enter');
        } else if (item.alert_on_exit && !isInside && wasInside) {
          console.log(`🔴 ALERT: Tracker exited geofence "${geofence.name}"`);
          
          // Show local notification
          this.showNotification(
            'Geofence Exited',
            `${tracker.name} has left ${geofence.name}`,
            { 
              type: 'geofence_exit',
              trackerId,
              geofenceId: geofence.id
            }
          );
          
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
        
      // Create the alert using the proper alert service
      await alertService.createAlert({
        tracker_id: trackerId,
        type: 'custom', // Use 'custom' since geofence types aren't in the RPC function
        title: eventType === 'enter' ? 'Geofence Entered' : 'Geofence Exited',
        message: `${tracker.name} has ${eventType === 'enter' ? 'entered' : 'left'} ${geofence.name}`,
        icon: eventType === 'enter' ? 'enter-outline' : 'exit-outline',
        data: {
          geofence_data: {
            geofence_id: geofenceId,
            geofence_name: geofence.name
          },
          alert_type: eventType === 'enter' ? 'geofence_enter' : 'geofence_exit' // Store the real type in data
        }
      });
      console.log(`Created geofence ${eventType} alert for ${tracker.name}`);
    } catch (error) {
      console.error('Error creating geofence alert:', error);
    }
  },  // Check for scheduled alerts
  async checkScheduledAlerts() {
    try {
      const now = new Date();
      
      // Use local time for comparison since scheduled_time is stored in local format
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
      const currentDay = now.getDay(); // 0-6 for Sunday-Saturday
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentDayOfMonth = now.getDate(); // 1-31
      
      console.log(`Checking scheduled alerts at ${currentTime} on ${currentDate}`);
      
      // Get all active scheduled alerts that match the current time (with some tolerance)
      const { data: alerts, error } = await supabase
        .from('scheduled_alerts')
        .select('*, trackers:tracker_id(name)')
        .eq('is_active', true)
        .or(`schedule_type.eq.one_time,schedule_type.eq.daily,and(schedule_type.eq.weekly,day_of_week.eq.${currentDay}),and(schedule_type.eq.monthly,day_of_month.eq.${currentDayOfMonth})`);
        
      if (error) throw error;
      
      console.log(`Found ${alerts?.length || 0} potentially matching scheduled alerts`);
      
      // Filter alerts that match the current time and conditions
      const triggeredAlerts = (alerts || []).filter(alert => {
        // Check if the scheduled time matches (within 1 minute tolerance)
        const scheduledTime = alert.scheduled_time;
        if (!scheduledTime) return false;
        
        // For time comparison, we need to check if current time matches scheduled time
        const scheduledHour = parseInt(scheduledTime.split(':')[0]);
        const scheduledMinute = parseInt(scheduledTime.split(':')[1]);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Check if we're within 1 minute of the scheduled time
        const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (scheduledHour * 60 + scheduledMinute));
        const timeMatches = timeDiff <= 1;
        
        if (!timeMatches) return false;
        
        // For one-time alerts, also check the date
        if (alert.schedule_type === 'one_time') {
          return alert.scheduled_date === currentDate;
        }
        
        return true;
      });
      
      console.log(`Found ${triggeredAlerts.length} alerts to trigger`);
      
      // Create alerts for each triggered scheduled alert
      for (const alert of triggeredAlerts) {
        // Skip if this alert was already triggered recently
        if (alert.last_triggered) {
          const lastTriggered = new Date(alert.last_triggered);
          const differenceMs = now.getTime() - lastTriggered.getTime();
          
          // Skip if triggered in the last hour (to prevent duplicates)
          if (differenceMs < 3600000) {
            console.log(`Skipping alert ${alert.id} - triggered recently`);
            continue;
          }
        }
        
        console.log(`Triggering alert: ${alert.title}`);
        
        // Show local notification
        this.showNotification(
          alert.title,
          alert.message,
          { 
            type: 'scheduled_alert',
            trackerId: alert.tracker_id,
            alertId: alert.id
          }
        );
        
        // Create the alert using the proper alert service
        try {
          await alertService.createAlert({
            tracker_id: alert.tracker_id,
            type: 'custom', // Use 'custom' since 'scheduled' isn't in the RPC function types
            title: alert.title,
            message: alert.message,
            icon: 'time-outline',
            data: {
              schedule_data: {
                schedule_id: alert.id,
                schedule_type: alert.schedule_type,
              },
              alert_type: 'scheduled' // Store the real type in data
            }
          });
          console.log(`Created alert in database for: ${alert.title}`);
        } catch (alertError) {
          console.error('Error creating alert in database:', alertError);
        }
        
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