const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://hxdurjngbkfnbryzczau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to mark a tracker as "lost" by setting its connection_status to "disconnected"
async function markTrackerAsLost(trackerId) {
  try {
    console.log(`Marking tracker ${trackerId} as lost...`);

    const { data, error } = await supabase
      .from('trackers')
      .update({ 
        connection_status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', trackerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tracker:', error.message);
      return;
    }

    console.log('Tracker updated successfully!');
    console.log('Tracker details:', data);
    console.log('\nThe tracker should now appear as "Lost" in the admin portal.');

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Function to list all trackers for the user to select
async function listTrackers() {
  try {
    console.log('Fetching trackers...');

    const { data, error } = await supabase
      .from('trackers')
      .select('*');

    if (error) {
      console.error('Error fetching trackers:', error.message);
      return [];
    }

    if (data.length === 0) {
      console.log('No trackers found. Please create a tracker first.');
      return [];
    }

    console.log('\nAvailable trackers:');
    data.forEach((tracker, index) => {
      console.log(`${index + 1}. ID: ${tracker.id}, Name: ${tracker.name}, Status: ${tracker.connection_status || 'unknown'}`);
    });

    return data;
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return [];
  }
}

// Main function
async function main() {
  // Get the tracker ID from command line arguments
  let trackerId = process.argv[2];
  
  if (!trackerId) {
    const trackers = await listTrackers();
    if (trackers.length === 0) {
      return;
    }
    
    // Use the first tracker if no specific ID is provided
    trackerId = trackers[0].id;
    console.log(`\nNo tracker ID provided, using first tracker: ${trackerId}`);
  }
  
  await markTrackerAsLost(trackerId);
}

// Run the script
main();
