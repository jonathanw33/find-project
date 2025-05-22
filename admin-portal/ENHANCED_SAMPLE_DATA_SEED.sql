-- =============================================================================
-- FIND System - Enhanced Sample Data Seed Script
-- =============================================================================
-- This script creates realistic dummy data for both the mobile app and admin portal
-- Run this in your Supabase SQL Editor to populate your database with test data
-- =============================================================================

BEGIN;

-- Create the logistics_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.logistics_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  tracking_number TEXT,
  shipping_address TEXT,
  notes TEXT,
  carrier TEXT,
  delivery_latitude DECIMAL,
  delivery_longitude DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'super_admin', 'logistics_manager')) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================================================
-- 1. SAMPLE USERS (Profiles)
-- =============================================================================
INSERT INTO public.profiles (id, email, name, avatar_url, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'john.doe@example.com', 'John Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0000-000000000002', 'jane.smith@example.com', 'Jane Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', NOW() - INTERVAL '25 days'),
  ('00000000-0000-0000-0000-000000000003', 'bob.wilson@example.com', 'Bob Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', NOW() - INTERVAL '20 days'),
  ('00000000-0000-0000-0000-000000000004', 'alice.brown@example.com', 'Alice Brown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', NOW() - INTERVAL '15 days'),
  ('00000000-0000-0000-0000-000000000005', 'charlie.davis@example.com', 'Charlie Davis', 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie', NOW() - INTERVAL '12 days'),
  ('00000000-0000-0000-0000-000000000006', 'diana.miller@example.com', 'Diana Miller', 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0000-000000000007', 'eve.garcia@example.com', 'Eve Garcia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000008', 'frank.martinez@example.com', 'Frank Martinez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000009', 'grace.taylor@example.com', 'Grace Taylor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000010', 'henry.anderson@example.com', 'Henry Anderson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry', NOW() - INTERVAL '1 day'),
  -- Admin user
  ('00000000-0000-0000-0000-000000000099', 'admin@findtracker.com', 'System Administrator', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. SAMPLE TRACKERS (Mix of Physical and Virtual)
-- =============================================================================
INSERT INTO public.trackers (id, user_id, name, type, icon, battery_level, connection_status, is_active, last_seen_latitude, last_seen_longitude, last_seen_timestamp, created_at) VALUES
  -- John Doe's trackers
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'House Keys', 'physical', 'key', 85, 'connected', true, 40.7128, -74.0060, NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '25 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Leather Wallet', 'physical', 'wallet', 12, 'disconnected', true, 40.7589, -73.9851, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '20 days'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Work Laptop', 'virtual', 'laptop', 78, 'connected', true, 40.7505, -73.9934, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '15 days'),
  
  -- Jane Smith's trackers
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Car Keys', 'physical', 'car', 67, 'connected', true, 34.0522, -118.2437, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '18 days'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Gym Bag', 'physical', 'bag', 45, 'disconnected', true, 34.0736, -118.2400, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '12 days'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'iPhone 15', 'virtual', 'phone', 89, 'connected', true, 34.0522, -118.2437, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 days'),
  
  -- Bob Wilson's trackers
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'Bicycle', 'physical', 'bike', 23, 'disconnected', true, 41.8781, -87.6298, NOW() - INTERVAL '24 hours', NOW() - INTERVAL '16 days'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'Backpack', 'physical', 'backpack', 91, 'connected', true, 41.8781, -87.6298, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '14 days'),
  
  -- Alice Brown's trackers  
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 'Purse', 'physical', 'purse', 8, 'disconnected', true, 29.7604, -95.3698, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '13 days'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'AirPods Pro', 'physical', 'headphones', 62, 'connected', true, 29.7604, -95.3698, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '11 days'),
  
  -- Charlie Davis's trackers
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000005', 'Camera Bag', 'physical', 'camera', 73, 'connected', true, 39.9526, -75.1652, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '9 days'),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000005', 'Drone Case', 'physical', 'drone', 31, 'disconnected', true, 39.9526, -75.1652, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '8 days'),
  
  -- More trackers for other users...
  ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000006', 'Office Badge', 'physical', 'badge', 55, 'connected', true, 37.7749, -122.4194, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '6 days'),
  ('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000007', 'Travel Suitcase', 'physical', 'suitcase', 88, 'connected', true, 25.7617, -80.1918, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '4 days'),
  ('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000008', 'Smart Watch', 'virtual', 'watch', 42, 'disconnected', true, 32.7767, -96.7970, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 days'),
  ('10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000009', 'Pet Collar', 'physical', 'pet', 19, 'disconnected', true, 47.6062, -122.3321, NOW() - INTERVAL '18 hours', NOW() - INTERVAL '2 days'),
  ('10000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000010', 'Tool Box', 'physical', 'tools', 76, 'connected', true, 33.4484, -112.0740, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. SAMPLE LOCATION HISTORY
-- =============================================================================
-- Generate location history for active trackers over the past week
WITH tracker_locations AS (
  SELECT 
    id as tracker_id,
    last_seen_latitude + (random() - 0.5) * 0.01 as lat_variation,
    last_seen_longitude + (random() - 0.5) * 0.01 as lng_variation,
    generate_series(
      NOW() - INTERVAL '7 days',
      NOW(),
      INTERVAL '2 hours'
    ) as location_timestamp
  FROM public.trackers 
  WHERE last_seen_latitude IS NOT NULL AND is_active = true
  LIMIT 8 -- Only for first 8 trackers to avoid too much data
)
INSERT INTO public.location_history (tracker_id, latitude, longitude, accuracy, timestamp)
SELECT 
  tracker_id,
  lat_variation,
  lng_variation,
  5 + random() * 10 as accuracy, -- 5-15 meters accuracy
  location_timestamp
FROM tracker_locations
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. SAMPLE ALERTS (Past 14 days)
-- =============================================================================
WITH alert_data AS (
  SELECT 
    t.id as tracker_id,
    t.user_id,
    t.name as tracker_name,
    generate_series(
      NOW() - INTERVAL '14 days',
      NOW(),
      INTERVAL '6 hours'
    ) as alert_time
  FROM public.trackers t
  WHERE t.is_active = true
  LIMIT 10
),
alert_types AS (
  SELECT * FROM (VALUES 
    ('low_battery', 'Low Battery Warning', 'battery is running low'),
    ('out_of_range', 'Device Disconnected', 'has disconnected from your phone'),
    ('left_behind', 'Item Left Behind', 'may have been left behind'),
    ('moved', 'Unexpected Movement', 'detected unexpected movement'),
    ('custom', 'Geofence Alert', 'has entered a monitored area')
  ) AS t(type, title_template, message_template)
)
INSERT INTO public.alerts (user_id, tracker_id, type, title, message, is_read, timestamp)
SELECT 
  ad.user_id,
  ad.tracker_id,
  at.type,
  ad.tracker_name || ' - ' || at.title_template,
  'Your ' || ad.tracker_name || ' ' || at.message_template,
  CASE WHEN random() > 0.3 THEN true ELSE false END as is_read,
  ad.alert_time + (random() * INTERVAL '5 hours') as timestamp
FROM alert_data ad
CROSS JOIN alert_types at
WHERE random() > 0.7 -- 30% chance of alert
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 5. LOGISTICS REQUESTS (Recovery Management)
-- =============================================================================
INSERT INTO public.logistics_requests (id, tracker_id, user_id, status, tracking_number, shipping_address, notes, carrier, created_at, updated_at) VALUES
  -- Recent recovery requests in various states
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'shipped', 'UPS12345678901', '123 Main St, Apt 4B, New York, NY 10001, USA', 'Left at front desk, signed by doorman', 'UPS', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'delivered', 'FEDX98765432109', '456 Oak Avenue, Los Angeles, CA 90210, USA', 'Standard delivery, no special instructions', 'FedEx', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'processing', NULL, '789 Pine Street, Unit 12, Chicago, IL 60601, USA', 'Fragile item - handle with care', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 'pending', NULL, '321 Elm Drive, Houston, TX 77001, USA', 'Rush delivery requested', NULL, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000005', 'shipped', 'DHL11223344556', '654 Maple Court, Philadelphia, PA 19101, USA', 'Leave with neighbor if not home', 'DHL', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000009', 'cancelled', NULL, '987 Cedar Lane, Seattle, WA 98101, USA', 'User found the item before shipping', NULL, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. ADMIN USERS
-- =============================================================================
INSERT INTO public.admin_users (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000099', 'super_admin')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 7. USER SETTINGS (Auto-created by trigger, but let's ensure they exist)
-- =============================================================================
INSERT INTO public.user_settings (user_id, push_notifications, alert_sounds, save_location_history)
SELECT id, true, true, true FROM public.profiles 
WHERE id NOT IN (SELECT user_id FROM public.user_settings)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================
SELECT 'Data Summary' as section, 'Count' as metric, 'Table' as table_name
UNION ALL
SELECT '============', '=====', '==============='
UNION ALL
SELECT 'Users Created:', COUNT(*)::text, 'profiles' FROM public.profiles WHERE email LIKE '%@example.com' OR email = 'admin@findtracker.com'
UNION ALL
SELECT 'Trackers Created:', COUNT(*)::text, 'trackers' FROM public.trackers WHERE user_id IN (SELECT id FROM public.profiles WHERE email LIKE '%@example.com' OR email = 'admin@findtracker.com')
UNION ALL
SELECT 'Location Records:', COUNT(*)::text, 'location_history' FROM public.location_history WHERE tracker_id IN (SELECT id FROM public.trackers WHERE user_id IN (SELECT id FROM public.profiles WHERE email LIKE '%@example.com' OR email = 'admin@findtracker.com'))
UNION ALL
SELECT 'Alerts Created:', COUNT(*)::text, 'alerts' FROM public.alerts WHERE user_id IN (SELECT id FROM public.profiles WHERE email LIKE '%@example.com' OR email = 'admin@findtracker.com')
UNION ALL
SELECT 'Recovery Requests:', COUNT(*)::text, 'logistics_requests' FROM public.logistics_requests WHERE user_id IN (SELECT id FROM public.profiles WHERE email LIKE '%@example.com' OR email = 'admin@findtracker.com')
UNION ALL
SELECT 'Admin Users:', COUNT(*)::text, 'admin_users' FROM public.admin_users;

-- Show tracker distribution by type
SELECT '============', '=====', '==============='
UNION ALL
SELECT 'Tracker Types:', type, COUNT(*)::text FROM public.trackers WHERE is_active = true AND user_id IN (SELECT id FROM public.profiles WHERE email LIKE '%@example.com' OR email = 'admin@findtracker.com') GROUP BY type;

-- Show recovery request status distribution  
SELECT '============', '=====', '==============='
UNION ALL
SELECT 'Recovery Status:', status, COUNT(*)::text FROM public.logistics_requests WHERE user_id IN (SELECT id FROM public.profiles WHERE email LIKE '%@example.com' OR email = 'admin@findtracker.com') GROUP BY status;