-- FIND System Database Schema
-- Updated for Supabase permissions

-- Remove the database parameter setting lines that caused the error
-- ALTER DATABASE postgres SET "anon.role" TO 'anon';
-- ALTER DATABASE postgres SET "service_role.role" TO 'service_role';

-- Create users-related tables and functions
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create trackers table
CREATE TABLE IF NOT EXISTS public.trackers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('physical', 'virtual')),
  icon TEXT,
  battery_level INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_seen_latitude DECIMAL,
  last_seen_longitude DECIMAL,
  last_seen_timestamp TIMESTAMP WITH TIME ZONE,
  connection_status TEXT CHECK (connection_status IN ('connected', 'disconnected', 'connecting', 'unknown')),
  ble_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for trackers
ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own trackers" ON public.trackers
  USING (auth.uid() = user_id);

-- Create location history table
CREATE TABLE IF NOT EXISTS public.location_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  accuracy DECIMAL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for location history
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view location history of their own trackers" ON public.location_history
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.trackers WHERE id = location_history.tracker_id
    )
  );

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('left_behind', 'moved', 'low_battery', 'out_of_range', 'custom')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,
  is_read BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own alerts" ON public.alerts
  USING (auth.uid() = user_id);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  push_notifications BOOLEAN DEFAULT true,
  alert_sounds BOOLEAN DEFAULT true,
  vibration BOOLEAN DEFAULT true,
  left_behind_alerts BOOLEAN DEFAULT true,
  low_battery_alerts BOOLEAN DEFAULT true,
  movement_alerts BOOLEAN DEFAULT false,
  save_location_history BOOLEAN DEFAULT true,
  share_analytics BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  distance_unit TEXT DEFAULT 'metric' CHECK (distance_unit IN ('metric', 'imperial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for user settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own settings" ON public.user_settings
  USING (auth.uid() = user_id);

-- Create trigger to create settings on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_profile();

-- Create function to update tracker location
CREATE OR REPLACE FUNCTION public.update_tracker_location(
  tracker_id UUID,
  lat DECIMAL,
  lng DECIMAL,
  accuracy DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  tracker_user_id UUID;
BEGIN
  -- Get user_id of tracker owner
  SELECT user_id INTO tracker_user_id FROM public.trackers WHERE id = tracker_id;
  
  -- Check if user owns this tracker
  IF tracker_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Update tracker last seen location
  UPDATE public.trackers
  SET 
    last_seen_latitude = lat,
    last_seen_longitude = lng,
    last_seen_timestamp = now(),
    updated_at = now()
  WHERE id = tracker_id;
  
  -- Insert into location history if enabled for this user
  IF (SELECT save_location_history FROM public.user_settings WHERE user_id = tracker_user_id) THEN
    INSERT INTO public.location_history (tracker_id, latitude, longitude, accuracy)
    VALUES (tracker_id, lat, lng, accuracy);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create an alert
CREATE OR REPLACE FUNCTION public.create_alert(
  tracker_id UUID,
  alert_type TEXT,
  alert_title TEXT,
  alert_message TEXT,
  alert_icon TEXT DEFAULT NULL,
  alert_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  tracker_user_id UUID;
  new_alert_id UUID;
BEGIN
  -- Get user_id of tracker owner
  SELECT user_id INTO tracker_user_id FROM public.trackers WHERE id = tracker_id;
  
  -- Check if user owns this tracker
  IF tracker_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Create new alert
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
    alert_type,
    alert_title,
    alert_message,
    alert_icon,
    alert_data
  )
  RETURNING id INTO new_alert_id;
  
  RETURN new_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;