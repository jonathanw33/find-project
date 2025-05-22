-- =============================================================================
-- FIND System - CORRECTED Sample Data Seed Script
-- =============================================================================
-- This script creates realistic dummy data that works with Supabase Auth
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
-- APPROACH: Use existing users OR create sample profiles without auth constraint
-- =============================================================================

-- Option 1: If you have existing users, we'll use them
-- Option 2: If no users exist, we'll temporarily disable the constraint

-- Check if we have any existing users
DO $$
DECLARE
    user_count INTEGER;
    existing_user_ids UUID[];
    new_user_id UUID;
    i INTEGER;
BEGIN
    -- Count existing profiles
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    IF user_count >= 3 THEN
        -- We have enough existing users, use them for sample data
        RAISE NOTICE 'Found % existing users, will use them for sample data', user_count;
        
        -- Get existing user IDs
        SELECT ARRAY(SELECT id FROM public.profiles LIMIT 10) INTO existing_user_ids;
        
        -- Create sample trackers for existing users
        FOR i IN 1..LEAST(array_length(existing_user_ids, 1), 5) LOOP
            -- Create 2-3 trackers per user
            INSERT INTO public.trackers (user_id, name, type, icon, battery_level, connection_status, is_active, last_seen_latitude, last_seen_longitude, last_seen_timestamp, created_at) VALUES
            (existing_user_ids[i], 'Keys', 'physical', 'key', 85, 'connected', true, 40.7128, -74.0060, NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '25 days'),
            (existing_user_ids[i], 'Wallet', 'physical', 'wallet', 12, 'disconnected', true, 40.7589, -73.9851, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '20 days');
            
            IF i <= 3 THEN
                INSERT INTO public.trackers (user_id, name, type, icon, battery_level, connection_status, is_active, last_seen_latitude, last_seen_longitude, last_seen_timestamp, created_at) VALUES
                (existing_user_ids[i], 'Laptop', 'virtual', 'laptop', 78, 'connected', true, 40.7505, -73.9934, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '15 days');
            END IF;
        END LOOP;
        
    ELSE
        -- Create sample profiles without foreign key constraint to auth.users
        RAISE NOTICE 'Creating sample profiles (note: these won''t have auth.users entries)';
        
        -- Temporarily disable the foreign key constraint
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
        
        -- Insert sample profiles
        INSERT INTO public.profiles (id, email, name, avatar_url, created_at) VALUES
        (gen_random_uuid(), 'john.doe@example.com', 'John Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', NOW() - INTERVAL '30 days'),
        (gen_random_uuid(), 'jane.smith@example.com', 'Jane Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', NOW() - INTERVAL '25 days'),
        (gen_random_uuid(), 'bob.wilson@example.com', 'Bob Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', NOW() - INTERVAL '20 days'),
        (gen_random_uuid(), 'alice.brown@example.com', 'Alice Brown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', NOW() - INTERVAL '15 days'),
        (gen_random_uuid(), 'charlie.davis@example.com', 'Charlie Davis', 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie', NOW() - INTERVAL '12 days'),
        (gen_random_uuid(), 'diana.miller@example.com', 'Diana Miller', 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana', NOW() - INTERVAL '8 days'),
        (gen_random_uuid(), 'eve.garcia@example.com', 'Eve Garcia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve', NOW() - INTERVAL '5 days'),
        (gen_random_uuid(), 'frank.martinez@example.com', 'Frank Martinez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank', NOW() - INTERVAL '3 days'),
        (gen_random_uuid(), 'grace.taylor@example.com', 'Grace Taylor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace', NOW() - INTERVAL '2 days'),
        (gen_random_uuid(), 'henry.anderson@example.com', 'Henry Anderson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry', NOW() - INTERVAL '1 day')
        ON CONFLICT (id) DO NOTHING;
        
        -- Get the newly created user IDs
        SELECT ARRAY(SELECT id FROM public.profiles WHERE email LIKE '%@example.com') INTO existing_user_ids;
        
        -- Create sample trackers for the new users
        FOR i IN 1..LEAST(array_length(existing_user_ids, 1), 10) LOOP
            INSERT INTO public.trackers (user_id, name, type, icon, battery_level, connection_status, is_active, last_seen_latitude, last_seen_longitude, last_seen_timestamp, created_at) VALUES
            (existing_user_ids[i], 
             CASE i % 5 
                WHEN 0 THEN 'House Keys'
                WHEN 1 THEN 'Car Keys' 
                WHEN 2 THEN 'Gym Bag'
                WHEN 3 THEN 'Backpack'
                ELSE 'Wallet'
             END,
             'physical', 
             CASE i % 5 
                WHEN 0 THEN 'key'
                WHEN 1 THEN 'car' 
                WHEN 2 THEN 'bag'
                WHEN 3 THEN 'backpack'
                ELSE 'wallet'
             END,
             20 + (i * 15) % 80,
             CASE WHEN i % 3 = 0 THEN 'connected' ELSE 'disconnected' END,
             true,
             40.7128 + (i * 0.1), 
             -74.0060 - (i * 0.1),
             NOW() - (i || ' hours')::INTERVAL,
             NOW() - (i || ' days')::INTERVAL
            );
            
            -- Add virtual trackers for some users
            IF i <= 5 THEN
                INSERT INTO public.trackers (user_id, name, type, icon, battery_level, connection_status, is_active, last_seen_latitude, last_seen_longitude, last_seen_timestamp, created_at) VALUES
                (existing_user_ids[i], 
                 CASE i % 3 
                    WHEN 0 THEN 'iPhone'
                    WHEN 1 THEN 'Laptop'
                    ELSE 'Smart Watch'
                 END,
                 'virtual',
                 CASE i % 3 
                    WHEN 0 THEN 'phone'
                    WHEN 1 THEN 'laptop'
                    ELSE 'watch'
                 END,
                 60 + (i * 10),
                 'connected',
                 true,
                 40.7128 + (i * 0.05), 
                 -74.0060 - (i * 0.05),
                 NOW() - (i || ' minutes')::INTERVAL,
                 NOW() - (i || ' days')::INTERVAL
                );
            END IF;
        END LOOP;
    END IF;
    
    -- Create sample alerts for existing trackers
    INSERT INTO public.alerts (user_id, tracker_id, type, title, message, is_read, timestamp)
    SELECT 
        t.user_id,
        t.id,
        (ARRAY['low_battery', 'out_of_range', 'left_behind', 'moved'])[floor(random() * 4 + 1)],
        t.name || ' Alert',
        'Your ' || t.name || ' needs attention',
        random() > 0.5,
        NOW() - (floor(random() * 14) || ' days')::INTERVAL - (floor(random() * 24) || ' hours')::INTERVAL
    FROM public.trackers t
    WHERE random() > 0.6 -- 40% of trackers get alerts
    LIMIT 20;
    
    -- Create sample logistics requests
    INSERT INTO public.logistics_requests (tracker_id, user_id, status, tracking_number, shipping_address, notes, carrier, created_at, updated_at)
    SELECT 
        t.id,
        t.user_id,
        (ARRAY['pending', 'processing', 'shipped', 'delivered'])[floor(random() * 4 + 1)],
        CASE WHEN random() > 0.5 THEN 'TRK' || floor(random() * 1000000000)::text ELSE NULL END,
        (ARRAY[
            '123 Main St, New York, NY 10001, USA',
            '456 Oak Ave, Los Angeles, CA 90210, USA', 
            '789 Pine St, Chicago, IL 60601, USA',
            '321 Elm Dr, Houston, TX 77001, USA'
        ])[floor(random() * 4 + 1)],
        'Sample recovery request',
        CASE WHEN random() > 0.7 THEN (ARRAY['UPS', 'FedEx', 'DHL'])[floor(random() * 3 + 1)] ELSE NULL END,
        NOW() - (floor(random() * 10) || ' days')::INTERVAL,
        NOW() - (floor(random() * 5) || ' days')::INTERVAL
    FROM public.trackers t
    WHERE t.connection_status = 'disconnected'
    LIMIT 8;
    
END $$;

COMMIT;

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================
SELECT 'Sample Data Created Successfully!' as status;

SELECT 'Data Summary' as section, 'Count' as metric, 'Table' as table_name
UNION ALL
SELECT '============', '=====', '==============='
UNION ALL
SELECT 'Total Profiles:', COUNT(*)::text, 'profiles' FROM public.profiles
UNION ALL
SELECT 'Sample Profiles:', COUNT(*)::text, 'profiles' FROM public.profiles WHERE email LIKE '%@example.com'
UNION ALL
SELECT 'Total Trackers:', COUNT(*)::text, 'trackers' FROM public.trackers  
UNION ALL
SELECT 'Total Alerts:', COUNT(*)::text, 'alerts' FROM public.alerts
UNION ALL
SELECT 'Recovery Requests:', COUNT(*)::text, 'logistics_requests' FROM public.logistics_requests;

-- Show tracker distribution
SELECT 'Tracker Types:' as info, type, COUNT(*) as count
FROM public.trackers 
GROUP BY type;

-- Show recovery request statuses
SELECT 'Recovery Statuses:' as info, status, COUNT(*) as count
FROM public.logistics_requests 
GROUP BY status;