-- Add these indexes to your Supabase SQL editor to improve geofence query performance

-- Index for geofences by user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_geofences_user_id 
ON geofences(user_id);

-- Index for geofences by user_id and is_active (for filtering active geofences)
CREATE INDEX IF NOT EXISTS idx_geofences_user_id_active 
ON geofences(user_id, is_active);

-- Index for tracker_geofences by tracker_id (for linked geofences query)
CREATE INDEX IF NOT EXISTS idx_tracker_geofences_tracker_id 
ON tracker_geofences(tracker_id);

-- Index for tracker_geofences by geofence_id (for reverse lookups)
CREATE INDEX IF NOT EXISTS idx_tracker_geofences_geofence_id 
ON tracker_geofences(geofence_id);

-- Composite index for tracker_geofences (for update operations)
CREATE INDEX IF NOT EXISTS idx_tracker_geofences_composite 
ON tracker_geofences(tracker_id, geofence_id);

-- Index for geofences by creation date (for sorting)
CREATE INDEX IF NOT EXISTS idx_geofences_created_at 
ON geofences(created_at DESC);
