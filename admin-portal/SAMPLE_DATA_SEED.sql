-- Sample Data Seeding Script for FIND Admin Portal Charts
-- Run this in your Supabase SQL Editor to add test data for the analytics charts

-- First, let's insert some sample users (profiles)
INSERT INTO public.profiles (id, email, name, created_at) VALUES
  (gen_random_uuid(), 'john.doe@example.com', 'John Doe', NOW() - INTERVAL '6 days'),
  (gen_random_uuid(), 'jane.smith@example.com', 'Jane Smith', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), 'bob.wilson@example.com', 'Bob Wilson', NOW() - INTERVAL '4 days'),
  (gen_random_uuid(), 'alice.brown@example.com', 'Alice Brown', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), 'charlie.davis@example.com', 'Charlie Davis', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), 'diana.miller@example.com', 'Diana Miller', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'eve.garcia@example.com', 'Eve Garcia', NOW());

-- Insert sample trackers with a good mix of physical and virtual types
WITH sample_users AS (
  SELECT id as user_id FROM public.profiles LIMIT 7
),
sample_trackers AS (
  SELECT 
    user_id,
    ROW_NUMBER() OVER (ORDER BY user_id) as rn
  FROM sample_users
)
INSERT INTO public.trackers (user_id, name, type, battery_level, connection_status, is_active, created_at)
SELECT 
  user_id,
  CASE 
    WHEN rn = 1 THEN 'Keys'
    WHEN rn = 2 THEN 'Wallet' 
    WHEN rn = 3 THEN 'Backpack'
    WHEN rn = 4 THEN 'Phone'
    WHEN rn = 5 THEN 'Laptop'
    WHEN rn = 6 THEN 'Car'
    WHEN rn = 7 THEN 'Bike'
  END as name,
  CASE 
    WHEN rn <= 4 THEN 'physical'  -- First 4 are physical devices (Keys, Wallet, Backpack, Phone)
    ELSE 'virtual'                -- Last 3 are virtual trackers (Laptop, Car, Bike)
  END as type,
  CASE 
    WHEN rn <= 2 THEN 85 + (rn * 5)  -- High battery
    WHEN rn <= 4 THEN 45 + (rn * 10) -- Medium battery  
    WHEN rn <= 6 THEN 15 + (rn * 2)  -- Low battery
    ELSE 95 -- Very high battery
  END as battery_level,
  CASE 
    WHEN rn <= 3 THEN 'connected'
    WHEN rn <= 5 THEN 'disconnected'
    ELSE null -- Some trackers have no connection status
  END as connection_status,
  true as is_active,
  NOW() - INTERVAL '3 days' + (rn || ' hours')::INTERVAL as created_at
FROM sample_trackers;

-- Insert sample alerts for the past 7 days
WITH sample_data AS (
  SELECT 
    t.id as tracker_id,
    t.user_id,
    generate_series(
      date_trunc('day', NOW() - INTERVAL '6 days'),
      date_trunc('day', NOW()),
      INTERVAL '1 day'
    ) as alert_date
  FROM public.trackers t
  LIMIT 5 -- Only use first 5 trackers for alerts
),
alert_types AS (
  SELECT unnest(ARRAY['low_battery', 'out_of_range', 'left_behind', 'custom']) as alert_type
)
INSERT INTO public.alerts (user_id, tracker_id, type, title, message, timestamp)
SELECT 
  sd.user_id,
  sd.tracker_id,
  at.alert_type,
  CASE 
    WHEN at.alert_type = 'low_battery' THEN 'Low Battery Warning'
    WHEN at.alert_type = 'out_of_range' THEN 'Device Disconnected'
    WHEN at.alert_type = 'left_behind' THEN 'Item Left Behind'
    WHEN at.alert_type = 'custom' THEN 'Geofence Alert'
  END as title,
  CASE 
    WHEN at.alert_type = 'low_battery' THEN 'Your tracker battery is running low'
    WHEN at.alert_type = 'out_of_range' THEN 'Your tracker has disconnected'
    WHEN at.alert_type = 'left_behind' THEN 'You may have left your item behind'
    WHEN at.alert_type = 'custom' THEN 'Your tracker has entered/exited a defined area'
  END as message,
  sd.alert_date + (EXTRACT(epoch FROM random() * INTERVAL '23 hours'))::int * INTERVAL '1 second' as timestamp
FROM sample_data sd
CROSS JOIN alert_types at
WHERE 
  -- Add some randomness - not every tracker gets every type of alert every day
  random() > 0.6 -- 40% chance of alert
ORDER BY sd.alert_date, sd.tracker_id;

-- Verify the data was inserted
SELECT 'Profiles inserted:' as info, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'Trackers inserted:', COUNT(*) FROM public.trackers
UNION ALL  
SELECT 'Alerts inserted:', COUNT(*) FROM public.alerts;

-- Show tracker types distribution (for the new chart)
SELECT 
  'Tracker Types:' as info,
  type,
  COUNT(*) as count
FROM public.trackers 
WHERE is_active = true
GROUP BY type;

-- Show sample of what was created
SELECT 
  'Sample tracker data:' as info,
  name,
  type,
  battery_level,
  connection_status,
  created_at::date
FROM public.trackers 
ORDER BY type, name
LIMIT 10;

-- Optional: Clean up sample data (uncomment to remove test data)
-- DELETE FROM public.alerts WHERE message LIKE '%tracker%';
-- DELETE FROM public.trackers WHERE name IN ('Keys', 'Wallet', 'Backpack', 'Phone', 'Laptop', 'Car', 'Bike');
-- DELETE FROM public.profiles WHERE email LIKE '%@example.com';