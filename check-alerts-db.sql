-- Check if the scheduled alert created an entry in the alerts table
-- Run this in Supabase SQL editor

SELECT * FROM alerts 
WHERE tracker_id = '05c60711-02b8-4476-b4e3-13f6c7ba04d6' 
ORDER BY timestamp DESC 
LIMIT 10;

-- Also check the scheduled_alerts table to see the current state
SELECT * FROM scheduled_alerts 
WHERE id = '04845d59-e796-47d8-962a-64448ac7ca73';

-- Check if there are any alerts at all for your user
SELECT COUNT(*) as total_alerts FROM alerts 
WHERE user_id = '249e5b2c-3e04-488c-bb97-621b17834c34';
