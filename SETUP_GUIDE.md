# FIND System Setup Guide

This guide will help you set up the FIND tracking system with Supabase as your backend.

## Prerequisites

1. You have a Supabase account and a project created.
2. You have cloned the FIND repository.
3. Node.js and npm are installed on your system.

## Setup Steps

### 1. Database Setup

First, you need to set up your database schema in Supabase:

1. Go to your Supabase project dashboard.
2. Navigate to the SQL Editor.
3. Copy the contents of the `schema-fixed.sql` file from `supabase/schema-fixed.sql`.
4. Paste the SQL into the SQL Editor and run it to create all the necessary tables and functions.

### 2. Authentication Setup

1. In your Supabase project, go to Authentication → Settings.
2. Make sure Email Auth is enabled.
3. If you want to allow users to sign up, ensure "Enable email confirmations" is turned off for development.

### 3. Create a Test User

Before using the app, you need to create a user:

1. Using the provided script:
   ```
   node create-test-user.js
   ```
   This will create a test user with email: test@example.com and password: password123

2. Or manually through the Supabase dashboard:
   - Go to Authentication → Users
   - Click "Add User"
   - Enter an email and password

### 4. Mobile App Setup

1. Navigate to the mobile app directory:
   ```
   cd mobile-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. If you encounter authentication issues, you can test with the debug version:
   ```
   # Make a temporary copy of App.tsx
   cp App.tsx App.original.tsx
   
   # Use the debug version
   cp App.debug.tsx App.tsx
   
   # Start the app
   npm start
   ```
   
   When done testing, restore the original:
   ```
   cp App.original.tsx App.tsx
   ```

### 5. Admin Portal Setup

1. Navigate to the admin portal directory:
   ```
   cd admin-portal
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Using the System

### Mobile App

The mobile app now correctly uses Supabase for authentication and data storage:

1. Sign up or log in with your email and password.
2. Add trackers through the "Add Tracker" button.
3. Track items and receive alerts.

### Admin Portal

The admin portal connects to the same Supabase backend:

1. Log in with your admin credentials.
2. View all trackers and user data in the dashboard.
3. Manage alerts and recovery requests.

## Common Issues

### 1. "Null value in column user_id violates not-null constraint"

This error occurs when creating a tracker without being properly authenticated. To fix:

1. Make sure you're logged in before creating a tracker
2. Use the debug version of the app to test authentication
3. Check the Supabase dashboard to verify the user exists

### 2. Authentication Issues

If you're having trouble with authentication:

1. Check if the user exists in Supabase Auth -> Users
2. Make sure email confirmations are disabled for testing
3. Try logging out and logging back in
4. Check for error messages in the console

## API Integration

Both the mobile app and admin portal use the following Supabase credentials:

- URL: https://hxdurjngbkfnbryzczau.supabase.co
- Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw

## Troubleshooting

### Common Issues

1. **Database connection error**: Ensure your Supabase credentials are correctly set in both applications.

2. **Authentication issues**: Make sure you've set up authentication in Supabase correctly.

3. **Data not showing up**: Check the Supabase dashboard to see if data is being properly created and stored.

4. **RLS Policies**: If you're having permission issues, check the Row Level Security policies in your Supabase dashboard under Auth → Policies.

### User Authentication Flow

For testing purposes, you can create a test user in Supabase:

1. Go to Authentication → Users in your Supabase dashboard.
2. Click "Add User" and fill in the details.
3. Use this user to log in to both the mobile app and admin portal.

## Maintenance and Updates

To keep your system up to date:

1. Regularly check the dependencies with `npm audit` in both projects.
2. Update the Supabase client if new versions are released.
3. Back up your database regularly from the Supabase dashboard.
