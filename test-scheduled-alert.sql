-- Test the Fixed Scheduled Alert System
-- Run this in your Supabase SQL editor

-- First, reactivate your test alert
UPDATE scheduled_alerts 
SET is_active = true, 
    last_triggered = NULL,
    scheduled_time = '13:25:00'  -- Change this to current time + 2 minutes
WHERE id = '04845d59-e796-47d8-962a-64448ac7ca73';

-- Check if it was updated
SELECT * FROM scheduled_alerts WHERE id = '04845d59-e796-47d8-962a-64448ac7ca73';

-- After the alert triggers, check if it appears in the alerts table
-- Wait 2-3 minutes, then run this:
SELECT * FROM alerts WHERE tracker_id = '05c60711-02b8-4476-b4e3-13f6c7ba04d6' ORDER BY timestamp DESC LIMIT 5;
