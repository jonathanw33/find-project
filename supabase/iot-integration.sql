-- Add physical_devices table and device-related functions for IoT integration
-- Execute this SQL in your Supabase project

-- Create the physical_devices table
CREATE TABLE IF NOT EXISTS public.physical_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE NOT NULL,
  device_uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  model TEXT,
  firmware_version TEXT,
  battery_level INTEGER,
  last_seen_timestamp TIMESTAMP WITH TIME ZONE,
  pairing_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for physical devices
ALTER TABLE public.physical_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own devices" ON public.physical_devices
  USING (auth.uid() = user_id);

-- Create a function to update device location and status
CREATE OR REPLACE FUNCTION public.update_device_status(
  device_uuid TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  accuracy DECIMAL DEFAULT NULL,
  battery_level INTEGER DEFAULT NULL,
  motion_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  device_record RECORD;
  tracker_user_id UUID;
  tracker_id UUID;
BEGIN
  -- Get device info
  SELECT pd.user_id, pd.tracker_id INTO device_record
  FROM public.physical_devices pd
  WHERE pd.device_uuid = device_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Device not found';
  END IF;
  
  tracker_user_id := device_record.user_id;
  tracker_id := device_record.tracker_id;
  
  -- Update device last seen
  UPDATE public.physical_devices
  SET 
    last_seen_timestamp = now(),
    battery_level = COALESCE(battery_level, physical_devices.battery_level),
    updated_at = now()
  WHERE device_uuid = device_uuid;
  
  -- Update tracker last seen location
  UPDATE public.trackers
  SET 
    last_seen_latitude = latitude,
    last_seen_longitude = longitude,
    last_seen_timestamp = now(),
    battery_level = COALESCE(battery_level, trackers.battery_level),
    connection_status = 'connected',
    updated_at = now()
  WHERE id = tracker_id;
  
  -- Insert into location history if enabled for this user
  IF (SELECT save_location_history FROM public.user_settings WHERE user_id = tracker_user_id) THEN
    INSERT INTO public.location_history (tracker_id, latitude, longitude, accuracy)
    VALUES (tracker_id, latitude, longitude, accuracy);
  END IF;
  
  -- Check motion data for potential alerts
  IF motion_data IS NOT NULL AND
     (SELECT movement_alerts FROM public.user_settings WHERE user_id = tracker_user_id) THEN
    -- Logic to check for suspicious motion and create alerts
    IF (motion_data->>'motion_detected')::boolean = true THEN
      -- Create a movement alert
      INSERT INTO public.alerts (
        user_id,
        tracker_id,
        type,
        title,
        message,
        icon,
        data
      )
      VALUES (
        tracker_user_id,
        tracker_id,
        'moved',
        'Movement Detected',
        'Suspicious movement detected for your tracker.',
        'alert-circle',
        motion_data
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to pair a physical device with a tracker
CREATE OR REPLACE FUNCTION public.pair_physical_device(
  tracker_id UUID,
  device_uuid TEXT,
  device_name TEXT,
  device_model TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  tracker_user_id UUID;
  device_id UUID;
BEGIN
  -- Get user_id of tracker owner
  SELECT user_id INTO tracker_user_id FROM public.trackers WHERE id = tracker_id;
  
  -- Check if user owns this tracker
  IF tracker_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check if device already exists
  SELECT id INTO device_id FROM public.physical_devices WHERE device_uuid = device_uuid;
  
  IF FOUND THEN
    -- Update existing device
    UPDATE public.physical_devices
    SET 
      tracker_id = pair_physical_device.tracker_id,
      user_id = tracker_user_id,
      name = device_name,
      model = COALESCE(device_model, physical_devices.model),
      pairing_date = now(),
      updated_at = now()
    WHERE id = device_id;
  ELSE
    -- Create new device record
    INSERT INTO public.physical_devices (
      user_id,
      tracker_id,
      device_uuid,
      name,
      model
    )
    VALUES (
      tracker_user_id,
      tracker_id,
      device_uuid,
      device_name,
      device_model
    )
    RETURNING id INTO device_id;
  END IF;
  
  -- Update tracker type to 'physical'
  UPDATE public.trackers
  SET 
    type = 'physical',
    ble_id = device_uuid,
    updated_at = now()
  WHERE id = tracker_id;
  
  RETURN device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;