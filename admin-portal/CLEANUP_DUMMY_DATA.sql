-- =============================================================================
-- FIND System - Dummy Data Cleanup Script
-- =============================================================================
-- This script removes ALL dummy/sample data created by the seed scripts
-- ⚠️  WARNING: This will permanently delete test data - use with caution!
-- =============================================================================

BEGIN;

-- =============================================================================
-- SAFETY CHECK - Uncomment the next line to enable the cleanup
-- =============================================================================
-- Remove the comment from the line below to confirm you want to delete dummy data
-- DO $$ BEGIN RAISE NOTICE 'Cleanup script is ready to run'; END $$;

-- If you uncommented the line above, you can run this script

-- =============================================================================
-- 1. DELETE LOGISTICS REQUESTS (Recovery data)
-- =============================================================================
DELETE FROM public.logistics_requests 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@example.com' 
    OR email = 'admin@findtracker.com'
    OR id LIKE '00000000-0000-0000-0000-0000000000%'
);

-- =============================================================================
-- 2. DELETE ALERTS (Notification data)
-- =============================================================================
DELETE FROM public.alerts 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@example.com' 
    OR email = 'admin@findtracker.com'
    OR id LIKE '00000000-0000-0000-0000-0000000000%'
);

-- =============================================================================
-- 3. DELETE LOCATION HISTORY (Tracking data)
-- =============================================================================
DELETE FROM public.location_history 
WHERE tracker_id IN (
    SELECT t.id FROM public.trackers t
    JOIN public.profiles p ON t.user_id = p.id
    WHERE p.email LIKE '%@example.com' 
    OR p.email = 'admin@findtracker.com'
    OR p.id LIKE '00000000-0000-0000-0000-0000000000%'
);

-- =============================================================================
-- 4. DELETE TRACKERS (Device data)
-- =============================================================================
DELETE FROM public.trackers 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@example.com' 
    OR email = 'admin@findtracker.com'
    OR id LIKE '00000000-0000-0000-0000-0000000000%'
)
OR id LIKE '10000000-0000-0000-0000-0000000000%';

-- =============================================================================
-- 5. DELETE ADMIN USERS (Admin access data)
-- =============================================================================
DELETE FROM public.admin_users 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@example.com' 
    OR email = 'admin@findtracker.com'
    OR id LIKE '00000000-0000-0000-0000-0000000000%'
);

-- =============================================================================
-- 6. DELETE USER SETTINGS (Preferences data)
-- =============================================================================
DELETE FROM public.user_settings 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@example.com' 
    OR email = 'admin@findtracker.com'
    OR id LIKE '00000000-0000-0000-0000-0000000000%'
);

-- =============================================================================
-- 7. DELETE PROFILES (User accounts) - This should be last due to foreign keys
-- =============================================================================
DELETE FROM public.profiles 
WHERE email LIKE '%@example.com' 
OR email = 'admin@findtracker.com'
OR id LIKE '00000000-0000-0000-0000-0000000000%';

COMMIT;

-- =============================================================================
-- VERIFICATION - Check what was deleted
-- =============================================================================
SELECT 'Cleanup Summary' as section, 'Remaining Records' as metric, 'Table' as table_name
UNION ALL
SELECT '===============', '=================', '==============='
UNION ALL
SELECT 'Total Profiles:', COUNT(*)::text, 'profiles' FROM public.profiles
UNION ALL
SELECT 'Total Trackers:', COUNT(*)::text, 'trackers' FROM public.trackers  
UNION ALL
SELECT 'Total Location History:', COUNT(*)::text, 'location_history' FROM public.location_history
UNION ALL
SELECT 'Total Alerts:', COUNT(*)::text, 'alerts' FROM public.alerts
UNION ALL
SELECT 'Total Recovery Requests:', COUNT(*)::text, 'logistics_requests' FROM public.logistics_requests
UNION ALL
SELECT 'Total Admin Users:', COUNT(*)::text, 'admin_users' FROM public.admin_users
UNION ALL
SELECT 'Total User Settings:', COUNT(*)::text, 'user_settings' FROM public.user_settings;

-- =============================================================================
-- ALTERNATIVE: Selective Cleanup Options
-- =============================================================================
-- If you want to clean up only specific types of data, use these commands instead:

-- Clean up only old alerts (older than 30 days)
-- DELETE FROM public.alerts WHERE created_at < NOW() - INTERVAL '30 days';

-- Clean up only location history (older than 7 days) 
-- DELETE FROM public.location_history WHERE timestamp < NOW() - INTERVAL '7 days';

-- Clean up only completed/cancelled recovery requests
-- DELETE FROM public.logistics_requests WHERE status IN ('delivered', 'cancelled');

-- Clean up only inactive trackers
-- DELETE FROM public.trackers WHERE is_active = false;

-- =============================================================================
-- RESET AUTO-INCREMENT SEQUENCES (if needed)
-- =============================================================================
-- If you want to reset any sequences, uncomment these lines:
-- ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS trackers_id_seq RESTART WITH 1;

-- =============================================================================
-- VACUUM AND ANALYZE (Optimize database after cleanup)
-- =============================================================================
-- Run these commands after cleanup to optimize the database:
-- VACUUM ANALYZE public.profiles;
-- VACUUM ANALYZE public.trackers;
-- VACUUM ANALYZE public.location_history;
-- VACUUM ANALYZE public.alerts;
-- VACUUM ANALYZE public.logistics_requests;
-- VACUUM ANALYZE public.admin_users;
-- VACUUM ANALYZE public.user_settings;