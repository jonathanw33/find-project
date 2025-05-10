const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://hxdurjngbkfnbryzczau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  const email = 'test@example.com'; // Change this to your preferred test email
  const password = 'password123'; // Change this to your preferred test password

  console.log(`Creating test user with email: ${email}`);

  // Sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error creating user:', error.message);
    return;
  }

  console.log('User created successfully!');
  console.log('User ID:', data.user.id);
  console.log('Email:', data.user.email);
  
  // Note: In a real environment, the user would need to confirm their email
  // For testing purposes, you may want to disable email confirmation in your Supabase project settings
  
  console.log('\nLogin credentials:');
  console.log('Email:', email);
  console.log('Password:', password);
}

createTestUser();
