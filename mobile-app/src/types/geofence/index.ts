export interface TrackerGeofence {
  id: string;
  tracker_id: string;
  geofence_id: string;
  alert_on_enter: boolean;
  alert_on_exit: boolean;
  created_at: string;
  updated_at: string;
}
