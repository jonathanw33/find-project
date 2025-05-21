import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface AlertTriggerResult {
  triggered: number;
  errors: string[];
}

serve(async (req: Request) => {
  // Check for secret token to ensure this is an authorized call
  const { authorization } = req.headers;
  const token = Deno.env.get('CHECK_ALERTS_SECRET');
  
  if (authorization !== `Bearer ${token}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    // Process the different types of alerts
    const [geofenceResult, scheduleResult] = await Promise.all([
      processGeofenceAlerts(),
      processScheduledAlerts(),
    ]);
    
    const response = {
      timestamp: new Date().toISOString(),
      results: {
        geofence: geofenceResult,
        schedule: scheduleResult,
      },
    };
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Process geofence alerts
async function processGeofenceAlerts(): Promise<AlertTriggerResult> {
  const result: AlertTriggerResult = { triggered: 0, errors: [] };
  
  try {
    // Call the PostgreSQL function to check geofence alerts
    const { data, error } = await supabaseAdmin.rpc('check_geofence_alerts');
    
    if (error) {
      throw error;
    }
    
    // The function returns the number of alerts triggered
    result.triggered = data?.length || 0;
  } catch (error) {
    console.error('Error processing geofence alerts:', error);
    result.errors.push(error.message);
  }
  
  return result;
}// Process scheduled alerts
async function processScheduledAlerts(): Promise<AlertTriggerResult> {
  const result: AlertTriggerResult = { triggered: 0, errors: [] };
  
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const currentDay = now.getDay(); // 0-6 for Sunday-Saturday
    const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD format
    const currentDayOfMonth = now.getDate(); // 1-31
    
    // Get all active scheduled alerts that match the current time
    const { data: alerts, error } = await supabaseAdmin
      .from('scheduled_alerts')
      .select('*')
      .eq('is_active', true)
      .eq('scheduled_time', currentTime)
      .or(`schedule_type.eq.one_time,schedule_type.eq.daily,and(schedule_type.eq.weekly,day_of_week.eq.${currentDay}),and(schedule_type.eq.monthly,day_of_month.eq.${currentDayOfMonth})`);
    
    if (error) {
      throw error;
    }
    
    // Filter one-time alerts to match the current date
    const triggeredAlerts = alerts.filter(alert => 
      alert.schedule_type !== 'one_time' || alert.scheduled_date === currentDate
    );
    
    // Create alerts for each triggered scheduled alert
    for (const alert of triggeredAlerts) {
      // Skip if this alert was already triggered recently
      if (alert.last_triggered) {
        const lastTriggered = new Date(alert.last_triggered);
        const differenceMs = now.getTime() - lastTriggered.getTime();
        
        // Skip if triggered in the last hour (to prevent duplicates)
        if (differenceMs < 3600000) {
          continue;
        }
      }
      
      // Create the alert
      const { error: insertError } = await supabaseAdmin
        .from('alerts')
        .insert({
          user_id: alert.user_id,
          tracker_id: alert.tracker_id,
          type: 'scheduled',
          title: alert.title,
          message: alert.message,
          schedule_data: {
            schedule_id: alert.id,
            schedule_type: alert.schedule_type,
          },
        });
      
      if (insertError) {
        result.errors.push(`Error creating alert for schedule ${alert.id}: ${insertError.message}`);
        continue;
      }
      
      // Update the last triggered timestamp
      const { error: updateError } = await supabaseAdmin
        .from('scheduled_alerts')
        .update({ last_triggered: now.toISOString() })
        .eq('id', alert.id);      
      if (updateError) {
        result.errors.push(`Error updating last_triggered for schedule ${alert.id}: ${updateError.message}`);
      }
      
      result.triggered++;
      
      // For one-time alerts, deactivate after triggering
      if (alert.schedule_type === 'one_time') {
        await supabaseAdmin
          .from('scheduled_alerts')
          .update({ is_active: false })
          .eq('id', alert.id);
      }
    }
  } catch (error) {
    console.error('Error processing scheduled alerts:', error);
    result.errors.push(error.message);
  }
  
  return result;
}

// Calculate distance between two points in meters using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}