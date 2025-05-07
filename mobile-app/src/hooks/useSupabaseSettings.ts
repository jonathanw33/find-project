import { useState } from 'react';
import { settingsService } from '../services/supabase';

export interface UserSettings {
  pushNotifications: boolean;
  alertSounds: boolean;
  vibration: boolean;
  leftBehindAlerts: boolean;
  lowBatteryAlerts: boolean;
  movementAlerts: boolean;
  saveLocationHistory: boolean;
  shareAnalytics: boolean;
  darkMode: boolean;
  distanceUnit: 'metric' | 'imperial';
}

export const useSupabaseSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    pushNotifications: true,
    alertSounds: true,
    vibration: true,
    leftBehindAlerts: true,
    lowBatteryAlerts: true,
    movementAlerts: false,
    saveLocationHistory: true,
    shareAnalytics: true,
    darkMode: false,
    distanceUnit: 'metric',
  });

  // Fetches user settings from Supabase
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getUserSettings();
      
      // Transform data to match our format
      const transformedSettings: UserSettings = {
        pushNotifications: data.push_notifications,
        alertSounds: data.alert_sounds,
        vibration: data.vibration,
        leftBehindAlerts: data.left_behind_alerts,
        lowBatteryAlerts: data.low_battery_alerts,
        movementAlerts: data.movement_alerts,
        saveLocationHistory: data.save_location_history,
        shareAnalytics: data.share_analytics,
        darkMode: data.dark_mode,
        distanceUnit: data.distance_unit,
      };
      
      setSettings(transformedSettings);
      return transformedSettings;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Updates user settings in Supabase
  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Transform to match Supabase format
      const supabaseUpdates: any = {};
      if (updates.pushNotifications !== undefined) supabaseUpdates.push_notifications = updates.pushNotifications;
      if (updates.alertSounds !== undefined) supabaseUpdates.alert_sounds = updates.alertSounds;
      if (updates.vibration !== undefined) supabaseUpdates.vibration = updates.vibration;
      if (updates.leftBehindAlerts !== undefined) supabaseUpdates.left_behind_alerts = updates.leftBehindAlerts;
      if (updates.lowBatteryAlerts !== undefined) supabaseUpdates.low_battery_alerts = updates.lowBatteryAlerts;
      if (updates.movementAlerts !== undefined) supabaseUpdates.movement_alerts = updates.movementAlerts;
      if (updates.saveLocationHistory !== undefined) supabaseUpdates.save_location_history = updates.saveLocationHistory;
      if (updates.shareAnalytics !== undefined) supabaseUpdates.share_analytics = updates.shareAnalytics;
      if (updates.darkMode !== undefined) supabaseUpdates.dark_mode = updates.darkMode;
      if (updates.distanceUnit !== undefined) supabaseUpdates.distance_unit = updates.distanceUnit;
      
      const data = await settingsService.updateUserSettings(supabaseUpdates);
      
      // Transform response to match our format
      const transformedSettings: UserSettings = {
        pushNotifications: data.push_notifications,
        alertSounds: data.alert_sounds,
        vibration: data.vibration,
        leftBehindAlerts: data.left_behind_alerts,
        lowBatteryAlerts: data.low_battery_alerts,
        movementAlerts: data.movement_alerts,
        saveLocationHistory: data.save_location_history,
        shareAnalytics: data.share_analytics,
        darkMode: data.dark_mode,
        distanceUnit: data.distance_unit,
      };
      
      setSettings(transformedSettings);
      return transformedSettings;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
  };
};