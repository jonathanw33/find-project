-- =============================================================================
-- FIND System - Clean Sample Data (Keep Users)
-- =============================================================================
-- This script removes ONLY the sample data created by SIMPLE_SAMPLE_DATA.sql
-- ✅ KEEPS: User profiles and accounts
-- ❌ REMOVES: Sample trackers, alerts, and recovery requests
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. DELETE LOGISTICS REQUESTS (Recovery data)
-- =============================================================================
-- Remove recovery requests created in the last session
DELETE FROM public.logistics_requests 
WHERE created_at > NOW() - INTERVAL '1 hour'
   OR shipping_address LIKE '%Main Street%'
   OR shipping_address LIKE '%Oak Avenue%'
   OR shipping_address LIKE '%Pine Street%'
   OR shipping_address LIKE '%Elm Drive%'
   OR shipping_address LIKE '%Maple Court%'
   OR shipping_address LIKE '%Cedar Lane%'
   OR notes LIKE '%Sample recovery request%'
   OR notes LIKE '%Fragile item%'
   OR notes LIKE '%Leave with neighbor%'
   OR notes LIKE '%Ring doorbell%'
   OR notes LIKE '%Standard delivery%';

-- =============================================================================
-- 2. DELETE SAMPLE ALERTS
-- =============================================================================
-- Remove alerts created by the sample script
DELETE FROM public.alerts 
WHERE created_at > NOW() - INTERVAL '1 hour'
   OR message LIKE '%needs attention%'
   OR message LIKE '%battery is running low%'
   OR message LIKE '%has disconnected from your phone%'
   OR title LIKE '%Alert';

-- =============================================================================
-- 3. DELETE SAMPLE LOCATION HISTORY
-- =============================================================================
-- Remove location history for trackers we're about to delete
DELETE FROM public.location_history 
WHERE tracker_id IN (
    SELECT id FROM public.trackers 
    WHERE created_at > NOW() - INTERVAL '1 hour'
       OR name IN ('House Keys', 'Car Keys', 'Wallet', 'Backpack', 'Gym Bag', 
                   'iPhone', 'Laptop', 'AirPods', 'Smart Watch', 'Camera')
);

-- =============================================================================
-- 4. DELETE SAMPLE TRACKERS
-- =============================================================================
-- Remove trackers created by the sample script
DELETE FROM public.trackers 
WHERE created_at > NOW() - INTERVAL '1 hour'
   OR name IN ('House Keys', 'Car Keys', 'Wallet', 'Backpack', 'Gym Bag', 
               'iPhone', 'Laptop', 'AirPods', 'Smart Watch', 'Camera');

COMMIT;

-- =============================================================================
-- VERIFICATION - Show what remains
-- =============================================================================
SELECT 'Cleanup Complete!' as status;

SELECT 
    'Remaining Data' as section, 
    'Count' as metric, 
    'Table' as table_name
UNION ALL
SELECT '==============', '=====', '==============='
UNION ALL
SELECT 'Users:', COUNT(*)::text, 'profiles' FROM public.profiles
UNION ALL
SELECT 'Trackers:', COUNT(*)::text, 'trackers' FROM public.trackers
UNION ALL
SELECT 'Location History:', COUNT(*)::text, 'location_history' FROM public.location_history
UNION ALL
SELECT 'Alerts:', COUNT(*)::text, 'alerts' FROM public.alerts
UNION ALL
SELECT 'Recovery Requests:', COUNT(*)::text, 'logistics_requests' FROM public.logistics_requests;

-- Check if any sample trackers remain
SELECT 
    'Sample Trackers Check' as info,
    CASE 
        WHEN COUNT(*) = 0 THEN 'All sample trackers removed ✅'
        ELSE COUNT(*)::text || ' sample trackers still exist'
    END as status
FROM public.trackers 
WHERE name IN ('House Keys', 'Car Keys', 'Wallet', 'Backpack', 'Gym Bag', 
               'iPhone', 'Laptop', 'AirPods', 'Smart Watch', 'Camera');

-- Show remaining tracker names (if any)
SELECT 
    'Remaining Trackers:' as info,
    name,
    type,
    created_at::date as created_date
FROM public.trackers 
ORDER BY created_at DESC
LIMIT 10;