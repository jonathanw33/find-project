-- =============================================================================
-- FIND System - SIMPLE Sample Data (Works with existing users)
-- =============================================================================
-- This script adds sample data to your existing user accounts
-- Safe to run - only adds trackers, alerts, and recovery requests
-- =============================================================================

BEGIN;

-- Create missing tables if they don't exist
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

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'super_admin', 'logistics_manager')) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================================================
-- Add sample trackers to existing users
-- =============================================================================
DO $$
DECLARE
    existing_users UUID[];
    user_id UUID;
    tracker_names TEXT[] := ARRAY['House Keys', 'Car Keys', 'Wallet', 'Backpack', 'Gym Bag', 'iPhone', 'Laptop', 'AirPods', 'Smart Watch', 'Camera'];
    tracker_types TEXT[] := ARRAY['physical', 'physical', 'physical', 'physical', 'physical', 'virtual', 'virtual', 'physical', 'virtual', 'physical'];
    tracker_icons TEXT[] := ARRAY['key', 'car', 'wallet', 'backpack', 'bag', 'phone', 'laptop', 'headphones', 'watch', 'camera'];
    i INTEGER;
BEGIN
    -- Get existing user IDs
    SELECT ARRAY(SELECT id FROM public.profiles LIMIT 10) INTO existing_users;
    
    IF array_length(existing_users, 1) > 0 THEN
        RAISE NOTICE 'Adding sample trackers to % existing users', array_length(existing_users, 1);
        
        -- Add 2-3 trackers per user
        FOR i IN 1..array_length(existing_users, 1) LOOP
            user_id := existing_users[i];
            
            -- Add first tracker
            INSERT INTO public.trackers (user_id, name, type, icon, battery_level, connection_status, is_active, last_seen_latitude, last_seen_longitude, last_seen_timestamp, created_at) VALUES
            (user_id, 
             tracker_names[((i-1) % 10) + 1],
             tracker_types[((i-1) % 10) + 1],
             tracker_icons[((i-1) % 10) + 1],
             50 + (i * 5) % 50, -- Battery between 50-100%
             CASE WHEN i % 3 = 0 THEN 'disconnected' ELSE 'connected' END,
             true,
             40.7128 + (random() - 0.5) * 0.1, -- Near NYC
             -74.0060 + (random() - 0.5) * 0.1,
             NOW() - (floor(random() * 24) || ' hours')::INTERVAL,
             NOW() - (i || ' days')::INTERVAL
            );
            
            -- Add second tracker
            INSERT INTO public.trackers (user_id, name, type, icon, battery_level, connection_status, is_active, last_seen_latitude, last_seen_longitude, last_seen_timestamp, created_at) VALUES
            (user_id, 
             tracker_names[(i % 10) + 1],
             tracker_types[(i % 10) + 1], 
             tracker_icons[(i % 10) + 1],
             20 + (i * 7) % 60, -- Battery between 20-80%
             CASE WHEN i % 2 = 0 THEN 'connected' ELSE 'disconnected' END,
             true,
             40.7128 + (random() - 0.5) * 0.2,
             -74.0060 + (random() - 0.5) * 0.2,
             NOW() - (floor(random() * 48) || ' hours')::INTERVAL,
             NOW() - (i * 2 || ' days')::INTERVAL
            );
            
            -- Add third tracker for first 5 users
            IF i <= 5 THEN
                INSERT INTO public.trackers (user_id, name, type, icon, battery_level, connection_status, is_active, last_seen_latitude, last_seen_longitude, last_seen_timestamp, created_at) VALUES
                (user_id, 
                 tracker_names[((i + 4) % 10) + 1],
                 tracker_types[((i + 4) % 10) + 1],
                 tracker_icons[((i + 4) % 10) + 1],
                 10 + (i * 3) % 30, -- Lower battery 10-40%
                 'disconnected',
                 true,
                 40.7128 + (random() - 0.5) * 0.3,
                 -74.0060 + (random() - 0.5) * 0.3,
                 NOW() - (floor(random() * 72) || ' hours')::INTERVAL,
                 NOW() - (i * 3 || ' days')::INTERVAL
                );
            END IF;
        END LOOP;
    ELSE
        RAISE NOTICE 'No existing users found. Please create a user account first.';
    END IF;
END $$;

-- =============================================================================
-- Add sample alerts
-- =============================================================================
INSERT INTO public.alerts (user_id, tracker_id, type, title, message, is_read, timestamp)
SELECT 
    t.user_id,
    t.id,
    (ARRAY['low_battery', 'out_of_range', 'left_behind', 'moved', 'custom'])[floor(random() * 5 + 1)],
    CASE 
        WHEN t.battery_level < 20 THEN t.name || ' - Low Battery'
        WHEN t.connection_status = 'disconnected' THEN t.name || ' - Disconnected'
        ELSE t.name || ' - Alert'
    END,
    CASE 
        WHEN t.battery_level < 20 THEN 'Your ' || t.name || ' battery is running low (' || t.battery_level || '%)'
        WHEN t.connection_status = 'disconnected' THEN 'Your ' || t.name || ' has disconnected from your phone'
        ELSE 'Your ' || t.name || ' needs attention'
    END,
    random() > 0.4, -- 60% are read
    NOW() - (floor(random() * 14) || ' days')::INTERVAL - (floor(random() * 24) || ' hours')::INTERVAL
FROM public.trackers t
WHERE t.name LIKE '%Keys' OR t.name LIKE '%Wallet' OR t.connection_status = 'disconnected' OR t.battery_level < 30
ORDER BY random()
LIMIT 15;

-- =============================================================================
-- Add sample logistics requests
-- =============================================================================
INSERT INTO public.logistics_requests (tracker_id, user_id, status, tracking_number, shipping_address, notes, carrier, created_at, updated_at)
SELECT 
    t.id,
    t.user_id,
    (ARRAY['pending', 'processing', 'shipped', 'delivered', 'cancelled'])[floor(random() * 5 + 1)],
    CASE 
        WHEN random() > 0.5 THEN 'TRK' || lpad(floor(random() * 1000000000)::text, 10, '0')
        ELSE NULL 
    END,
    (ARRAY[
        '123 Main Street, Apt 4B, New York, NY 10001, United States',
        '456 Oak Avenue, Suite 200, Los Angeles, CA 90210, United States', 
        '789 Pine Street, Unit 12, Chicago, IL 60601, United States',
        '321 Elm Drive, Houston, TX 77001, United States',
        '654 Maple Court, Philadelphia, PA 19101, United States',
        '987 Cedar Lane, Seattle, WA 98101, United States'
    ])[floor(random() * 6 + 1)],
    CASE 
        WHEN random() > 0.7 THEN 'Fragile item - handle with care'
        WHEN random() > 0.5 THEN 'Leave with neighbor if not home'
        WHEN random() > 0.3 THEN 'Ring doorbell twice'
        ELSE 'Standard delivery'
    END,
    CASE 
        WHEN random() > 0.6 THEN (ARRAY['UPS', 'FedEx', 'DHL', 'USPS'])[floor(random() * 4 + 1)] 
        ELSE NULL 
    END,
    NOW() - (floor(random() * 14) || ' days')::INTERVAL,
    NOW() - (floor(random() * 7) || ' days')::INTERVAL
FROM public.trackers t
WHERE t.connection_status = 'disconnected' OR t.battery_level < 25
ORDER BY random()
LIMIT 6;

COMMIT;

-- =============================================================================
-- Summary Report
-- =============================================================================
SELECT 'Sample Data Added Successfully!' as status;

SELECT 
    'Data Summary' as section, 
    'Count' as metric, 
    'Description' as details
UNION ALL
SELECT '=============', '=====', '==========='
UNION ALL
SELECT 'Users:', COUNT(*)::text, 'existing profiles' FROM public.profiles
UNION ALL
SELECT 'Trackers:', COUNT(*)::text, 'total trackers' FROM public.trackers
UNION ALL
SELECT 'New Trackers:', COUNT(*)::text, 'added in this session' FROM public.trackers WHERE created_at > NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Alerts:', COUNT(*)::text, 'total alerts' FROM public.alerts  
UNION ALL
SELECT 'Recovery Requests:', COUNT(*)::text, 'logistics requests' FROM public.logistics_requests;

-- Show tracker status breakdown
SELECT 
    'Connection Status' as category,
    connection_status as status,
    COUNT(*) as count
FROM public.trackers 
WHERE is_active = true
GROUP BY connection_status
ORDER BY count DESC;

-- Show battery level distribution
SELECT 
    'Battery Levels' as category,
    battery_range,
    COUNT(*) as count
FROM (
    SELECT 
        CASE 
            WHEN battery_level >= 80 THEN 'High (80-100%)'
            WHEN battery_level >= 50 THEN 'Medium (50-79%)'
            WHEN battery_level >= 20 THEN 'Low (20-49%)'
            ELSE 'Critical (<20%)'
        END as battery_range,
        CASE 
            WHEN battery_level >= 80 THEN 1
            WHEN battery_level >= 50 THEN 2 
            WHEN battery_level >= 20 THEN 3
            ELSE 4
        END as sort_order
    FROM public.trackers 
    WHERE battery_level IS NOT NULL
) battery_summary
GROUP BY battery_range, sort_order
ORDER BY sort_order;

-- Show recovery request statuses
SELECT 
    'Recovery Requests' as category,
    status,
    COUNT(*) as count
FROM public.logistics_requests
GROUP BY status
ORDER BY count DESC;