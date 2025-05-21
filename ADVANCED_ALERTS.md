# Advanced Alerts Feature

This document describes the advanced alerts features added to the FIND tracking application.

## Features

The advanced alerts system provides two types of alerts:

1. **Geofence Alerts**: Get notifications when your trackers enter or exit specific geographical areas.
2. **Scheduled Alerts**: Set up time-based notifications for your trackers.

## Setup Instructions

### Database Migration

1. Apply the migration from `supabase/migrations/20250521_advanced_alerts/up.sql` to your Supabase database.

### Deploy the Edge Function

1. Deploy the alert checking function to your Supabase project:

```bash
cd supabase/functions
supabase functions deploy check-alerts --project-ref your-project-ref
```

2. Set up the secret:

```bash
supabase secrets set CHECK_ALERTS_SECRET=your-secure-random-token --project-ref your-project-ref
```

### GitHub Actions Setup

1. Add the following secrets to your GitHub repository:
   - `SUPABASE_FUNCTIONS_URL`: Your Supabase project's functions URL (e.g., `https://your-project-ref.functions.supabase.co`)
   - `CHECK_ALERTS_SECRET`: The same secure token you set for your function

## Using Geofence Alerts

Geofences are virtual boundaries on a map. You can create geofences and get alerts when your trackers enter or exit these areas.

To use geofence alerts:

1. Create geofences from the main settings menu or the tracker detail page.
2. Link trackers to geofences and configure whether you want to be alerted on entry, exit, or both.
3. The system will automatically check if your trackers have crossed any geofence boundaries.

## Using Scheduled Alerts

Scheduled alerts let you set up notifications at specific times. Types include:

- **One-time**: Alert at a specific date and time
- **Daily**: Alert at the same time every day
- **Weekly**: Alert on specific days of the week at a set time
- **Monthly**: Alert on specific days of the month at a set time

To use scheduled alerts:

1. Go to the tracker detail page and select "Scheduled Alerts"
2. Create a new scheduled alert and configure its settings
3. The alert will automatically trigger according to the schedule you set

## Troubleshooting

- Make sure the cron job in GitHub Actions is running correctly
- Check the function logs in Supabase for any errors
- Verify that your device's push notification settings allow notifications from the app
