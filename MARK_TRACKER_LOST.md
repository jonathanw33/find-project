# How to Mark a Tracker as "Lost"

This guide explains how to mark a tracker as "lost" so it appears in the admin portal with the "Lost" status and enables the recovery functionality.

## Understanding "Lost" Status

In the FIND system, a tracker is considered "lost" when either:

1. Its `connection_status` is set to "disconnected", OR
2. It hasn't been seen for over 24 hours (based on `last_seen_timestamp`)

## Method 1: Using the Mobile App Button

The simplest way to mark a tracker as lost is to use the new "Mark as Lost" button in the mobile app:

1. Open the mobile app
2. Navigate to the tracker details page
3. Scroll down to find the "Mark as Lost" button at the bottom of the page
4. Tap the button
5. A confirmation message will appear when the tracker has been marked as lost

## Method 2: Using the Command Line Script

You can also use the provided Node.js script to mark any tracker as lost:

1. Run the script with the tracker ID as a parameter:
   ```
   node mark-tracker-lost.js <tracker-id>
   ```

2. If you don't provide a tracker ID, the script will:
   - List all available trackers
   - Automatically select the first tracker

3. The script will update the tracker's status and confirm when it's done

## Method 3: Manual SQL Update

You can directly update the database through the Supabase dashboard:

1. Go to your Supabase project
2. Navigate to the SQL Editor
3. Run the following SQL command, replacing `<tracker-id>` with your tracker's ID:
   ```sql
   UPDATE trackers 
   SET connection_status = 'disconnected', 
       updated_at = NOW() 
   WHERE id = '<tracker-id>';
   ```

## Verifying "Lost" Status

After marking a tracker as lost, you can verify it worked by:

1. Going to the admin portal
2. The tracker should show with a "Lost" status
3. The "Create Recovery Request" button (truck icon) should now be available
4. You should be able to create a recovery request for this tracker

## What to Do After Recovery

Once the tracker is recovered, you can update its status:

1. In the mobile app: The tracker will automatically update its status when it connects again
2. Manually: You can reverse the process by running this SQL:
   ```sql
   UPDATE trackers 
   SET connection_status = 'connected', 
       updated_at = NOW() 
   WHERE id = '<tracker-id>';
   ```

## Troubleshooting

If the tracker doesn't appear as "lost" in the admin portal:

1. Refresh the admin portal page
2. Check if the tracker really was updated by viewing it in the Supabase Table Editor
3. Make sure the `connection_status` is set to "disconnected"
