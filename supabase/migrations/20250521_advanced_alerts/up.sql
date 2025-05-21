-- Migration for Advanced Alerts

-- 1. Update alerts table to include geofence and schedule information
ALTER TABLE public.alerts 
ADD COLUMN schedule_data JSONB,
ADD COLUMN geofence_data JSONB,
ALTER COLUMN type TYPE TEXT CHECK (type IN (
  'left_behind', 'moved', 'low_battery', 'out_of_range', 'custom',
  'geofence_enter', 'geofence_exit', 'scheduled'
));

-- 2. Create geofences table for storing defined areas
CREATE TABLE public.geofences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  center_latitude DECIMAL NOT NULL,
  center_longitude DECIMAL NOT NULL,
  radius DECIMAL NOT NULL, -- For circular geofences (in meters)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for geofences
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own geofences" ON public.geofences
  USING (auth.uid() = user_id);

-- 3. Create tracker_geofences junction table for assigning trackers to geofences
CREATE TABLE public.tracker_geofences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE NOT NULL,
  geofence_id UUID REFERENCES public.geofences(id) ON DELETE CASCADE NOT NULL,
  alert_on_enter BOOLEAN DEFAULT false,
  alert_on_exit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  -- Ensure unique tracker-geofence pairs
  UNIQUE (tracker_id, geofence_id)
);

-- Set up Row Level Security for tracker_geofences
ALTER TABLE public.tracker_geofences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own tracker_geofences" ON public.tracker_geofences
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.trackers WHERE id = tracker_geofences.tracker_id
    )
  );

-- 4. Create scheduled_alerts table for time-based alerts
CREATE TABLE public.scheduled_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('one_time', 'daily', 'weekly', 'monthly')),
  scheduled_time TIME,
  scheduled_date DATE,
  day_of_week INTEGER, -- 0-6 for Sunday-Saturday
  day_of_month INTEGER, -- 1-31
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for scheduled_alerts
ALTER TABLE public.scheduled_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own scheduled_alerts" ON public.scheduled_alerts
  USING (auth.uid() = user_id);

-- 5. Create function to check if a tracker is inside a geofence
CREATE OR REPLACE FUNCTION public.is_tracker_in_geofence(
  tracker_id UUID,
  geofence_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  tracker_lat DECIMAL;
  tracker_lng DECIMAL;
  geo_center_lat DECIMAL;
  geo_center_lng DECIMAL;
  geo_radius DECIMAL;
  distance DECIMAL;
BEGIN
  -- Get tracker's last location
  SELECT last_seen_latitude, last_seen_longitude 
  INTO tracker_lat, tracker_lng 
  FROM public.trackers 
  WHERE id = tracker_id;
  
  -- Get geofence data
  SELECT center_latitude, center_longitude, radius
  INTO geo_center_lat, geo_center_lng, geo_radius
  FROM public.geofences 
  WHERE id = geofence_id;
  
  -- If there's no tracker location, return false
  IF tracker_lat IS NULL OR tracker_lng IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calculate distance using the Haversine formula
  distance := 6371000 * 2 * asin(sqrt(
    power(sin((radians(tracker_lat) - radians(geo_center_lat))/2), 2) +
    cos(radians(geo_center_lat)) * cos(radians(tracker_lat)) *
    power(sin((radians(tracker_lng) - radians(geo_center_lng))/2), 2)
  ));
  
  -- Check if tracker is inside the radius
  RETURN distance <= geo_radius;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a function to check geofence alerts
CREATE OR REPLACE FUNCTION public.check_geofence_alerts()
RETURNS TABLE (alert_id UUID) AS $$
DECLARE
  tracker_rec RECORD;
  geofence_rec RECORD;
  was_inside BOOLEAN;
  is_inside BOOLEAN;
  geofence_state RECORD;
  new_alert_id UUID;
BEGIN
  -- For each active tracker-geofence pair
  FOR tracker_rec IN (
    SELECT t.id, t.user_id, t.name, tg.geofence_id, tg.alert_on_enter, tg.alert_on_exit
    FROM public.trackers t
    JOIN public.tracker_geofences tg ON t.id = tg.tracker_id
    JOIN public.geofences g ON tg.geofence_id = g.id
    WHERE t.is_active = true AND g.is_active = true
  ) LOOP
    -- Try to get the previous state from a temporary table or cache
    -- For simplicity, we'll just check the current state and store it for next time
    -- In a production system, you would want to keep track of previous states
    
    -- Check current state
    is_inside := public.is_tracker_in_geofence(tracker_rec.id, tracker_rec.geofence_id);
    
    -- Get the previous state from a "geofence_states" table that would store the last known state
    -- This is a simplified example; in a real implementation you'd need to create and manage this table
    BEGIN
      SELECT inside INTO was_inside
      FROM (VALUES (false)) AS gs(inside); -- Dummy value, replace with actual state tracking
      
      -- If no record, assume it was not inside before
      IF was_inside IS NULL THEN
        was_inside := false;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        was_inside := false; -- Default if no previous record
    END;
    
    -- Get geofence details
    SELECT name, description INTO geofence_rec
    FROM public.geofences
    WHERE id = tracker_rec.geofence_id;
    
    -- Check for enter events
    IF tracker_rec.alert_on_enter AND is_inside AND NOT was_inside THEN
      -- Create enter alert
      INSERT INTO public.alerts (
        user_id,
        tracker_id,
        type,
        title,
        message,
        geofence_data
      )
      VALUES (
        tracker_rec.user_id,
        tracker_rec.id,
        'geofence_enter',
        'Geofence Entered',
        tracker_rec.name || ' has entered ' || geofence_rec.name,
        jsonb_build_object('geofence_id', tracker_rec.geofence_id, 'geofence_name', geofence_rec.name)
      )
      RETURNING id INTO new_alert_id;
      
      RETURN QUERY SELECT new_alert_id;
    END IF;
    
    -- Check for exit events
    IF tracker_rec.alert_on_exit AND NOT is_inside AND was_inside THEN
      -- Create exit alert
      INSERT INTO public.alerts (
        user_id,
        tracker_id,
        type,
        title,
        message,
        geofence_data
      )
      VALUES (
        tracker_rec.user_id,
        tracker_rec.id,
        'geofence_exit',
        'Geofence Exited',
        tracker_rec.name || ' has left ' || geofence_rec.name,
        jsonb_build_object('geofence_id', tracker_rec.geofence_id, 'geofence_name', geofence_rec.name)
      )
      RETURNING id INTO new_alert_id;
      
      RETURN QUERY SELECT new_alert_id;
    END IF;
    
    -- Update the state for next check
    -- In a real implementation, you would store this in a persistent table
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
