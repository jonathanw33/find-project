-- =============================================================================
-- FIND System - Quick Data Management Utilities
-- =============================================================================
-- Handy SQL commands for managing your FIND system database
-- Copy individual sections to run specific operations
-- =============================================================================

-- =============================================================================
-- 🔍 INSPECTION QUERIES (Check current data status)
-- =============================================================================

-- Check if sample data exists
SELECT 
  'Sample Data Status' as category,
  CASE 
    WHEN COUNT(*) > 0 THEN 'Sample data EXISTS (' || COUNT(*) || ' users)'
    ELSE 'No sample data found'
  END as status
FROM public.profiles 
WHERE email LIKE '%@example.com' OR email = 'admin@findtracker.com';

-- Database overview
SELECT 'Database Overview' as section, 'Count' as metric, 'Table' as table_name
UNION ALL
SELECT '================', '=====', '==============='
UNION ALL
SELECT 'Total Users:', COUNT(*)::text, 'profiles' FROM public.profiles
UNION ALL
SELECT 'Total Trackers:', COUNT(*)::text, 'trackers' FROM public.trackers
UNION ALL
SELECT 'Location Records:', COUNT(*)::text, 'location_history' FROM public.location_history
UNION ALL
SELECT 'Alert Records:', COUNT(*)::text, 'alerts' FROM public.alerts
UNION ALL
SELECT 'Recovery Requests:', COUNT(*)::text, 'logistics_requests' FROM public.logistics_requests
UNION ALL
SELECT 'Admin Users:', COUNT(*)::text, 'admin_users' FROM public.admin_users;

-- Tracker status breakdown
SELECT 
  'Tracker Status' as category,
  connection_status,
  COUNT(*) as count
FROM public.trackers 
WHERE is_active = true
GROUP BY connection_status
ORDER BY count DESC;

-- Recovery request status
SELECT 
  'Recovery Status' as category,
  status,
  COUNT(*) as count
FROM public.logistics_requests
GROUP BY status
ORDER BY count DESC;

-- =============================================================================
-- 🧹 MAINTENANCE QUERIES (Clean up old data)
-- =============================================================================

-- Clean location history older than 30 days
-- DELETE FROM public.location_history WHERE timestamp < NOW() - INTERVAL '30 days';

-- Clean read alerts older than 7 days  
-- DELETE FROM public.alerts WHERE is_read = true AND timestamp < NOW() - INTERVAL '7 days';

-- Clean delivered recovery requests older than 90 days
-- DELETE FROM public.logistics_requests WHERE status = 'delivered' AND updated_at < NOW() - INTERVAL '90 days';

-- =============================================================================
-- 📊 ANALYTICS QUERIES (For dashboard insights)
-- =============================================================================

-- Daily new users (last 7 days)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users
FROM public.profiles 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Alert trends (last 14 days)
SELECT 
  DATE(timestamp) as date,
  type,
  COUNT(*) as alert_count
FROM public.alerts 
WHERE timestamp >= NOW() - INTERVAL '14 days'
GROUP BY DATE(timestamp), type
ORDER BY date, type;

-- Tracker type distribution
SELECT 
  type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM public.trackers 
WHERE is_active = true
GROUP BY type;

-- Battery status analysis
SELECT 
  CASE 
    WHEN battery_level >= 80 THEN 'High (80-100%)'
    WHEN battery_level >= 50 THEN 'Medium (50-79%)'
    WHEN battery_level >= 20 THEN 'Low (20-49%)'
    WHEN battery_level < 20 THEN 'Critical (<20%)'
    ELSE 'Unknown'
  END as battery_status,
  COUNT(*) as tracker_count
FROM public.trackers 
WHERE battery_level IS NOT NULL AND is_active = true
GROUP BY 1
ORDER BY 
  CASE 
    WHEN battery_level >= 80 THEN 1
    WHEN battery_level >= 50 THEN 2
    WHEN battery_level >= 20 THEN 3
    WHEN battery_level < 20 THEN 4
    ELSE 5
  END;

-- =============================================================================
-- 🔧 ADMIN UTILITIES (User and permission management)
-- =============================================================================

-- Make a user an admin (replace email with actual user)
-- INSERT INTO public.admin_users (user_id, role)
-- SELECT id, 'admin' FROM public.profiles WHERE email = 'user@example.com'
-- ON CONFLICT DO NOTHING;

-- Check admin users
SELECT 
  p.email,
  p.name,
  au.role,
  au.created_at
FROM public.admin_users au
JOIN public.profiles p ON au.user_id = p.id
ORDER BY au.created_at;

-- Find users with most trackers
SELECT 
  p.name,
  p.email,
  COUNT(t.id) as tracker_count
FROM public.profiles p
LEFT JOIN public.trackers t ON p.id = t.user_id AND t.is_active = true
GROUP BY p.id, p.name, p.email
HAVING COUNT(t.id) > 0
ORDER BY tracker_count DESC
LIMIT 10;

-- =============================================================================
-- 🚨 EMERGENCY QUERIES (For troubleshooting)
-- =============================================================================

-- Find disconnected trackers with low battery
SELECT 
  p.name as user_name,
  p.email,
  t.name as tracker_name,
  t.battery_level,
  t.connection_status,
  t.last_seen_timestamp
FROM public.trackers t
JOIN public.profiles p ON t.user_id = p.id
WHERE t.is_active = true 
  AND t.connection_status = 'disconnected'
  AND t.battery_level < 20
ORDER BY t.battery_level, t.last_seen_timestamp;

-- Find stuck recovery requests (pending for more than 7 days)
SELECT 
  lr.id,
  p.name as user_name,
  t.name as tracker_name,
  lr.status,
  lr.created_at,
  EXTRACT(DAY FROM NOW() - lr.created_at) as days_pending
FROM public.logistics_requests lr
JOIN public.profiles p ON lr.user_id = p.id
JOIN public.trackers t ON lr.tracker_id = t.id
WHERE lr.status = 'pending' 
  AND lr.created_at < NOW() - INTERVAL '7 days'
ORDER BY lr.created_at;

-- Find users with excessive alerts (more than 10 unread)
SELECT 
  p.name,
  p.email,
  COUNT(*) as unread_alerts
FROM public.alerts a
JOIN public.profiles p ON a.user_id = p.id
WHERE a.is_read = false
GROUP BY p.id, p.name, p.email
HAVING COUNT(*) > 10
ORDER BY unread_alerts DESC;

-- =============================================================================
-- 📈 PERFORMANCE QUERIES (Database optimization)
-- =============================================================================

-- Table sizes (approximate)
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Most active tables (for indexing decisions)
SELECT 
  'Most recent activity' as info,
  'Table' as table_name,
  'Last Activity' as last_activity
UNION ALL
SELECT '==================', '=====', '============='
UNION ALL
SELECT 'Profiles:', 'profiles', MAX(updated_at)::text FROM public.profiles
UNION ALL
SELECT 'Trackers:', 'trackers', MAX(updated_at)::text FROM public.trackers
UNION ALL
SELECT 'Location History:', 'location_history', MAX(timestamp)::text FROM public.location_history
UNION ALL
SELECT 'Alerts:', 'alerts', MAX(timestamp)::text FROM public.alerts
UNION ALL
SELECT 'Recovery Requests:', 'logistics_requests', MAX(updated_at)::text FROM public.logistics_requests;

-- =============================================================================
-- 💡 USAGE EXAMPLES
-- =============================================================================
/*
To use these queries:

1. Copy the specific section you need
2. Paste into Supabase SQL Editor  
3. Remove the comment markers (--) from the queries you want to run
4. Execute the query

Example - To check if sample data exists:
```sql
SELECT 
  'Sample Data Status' as category,
  CASE 
    WHEN COUNT(*) > 0 THEN 'Sample data EXISTS (' || COUNT(*) || ' users)'
    ELSE 'No sample data found'
  END as status
FROM public.profiles 
WHERE email LIKE '%@example.com' OR email = 'admin@findtracker.com';
```

Example - To clean old location data:
```sql
DELETE FROM public.location_history WHERE timestamp < NOW() - INTERVAL '30 days';
```
*/