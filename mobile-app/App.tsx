import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values'; // Required for UUID generation

// Fix for fetch timeout issues with Supabase
import { Platform, LogBox, AppRegistry, StyleSheet, View, Alert } from 'react-native';
if (Platform.OS !== 'web') {
  // Timeout fix for React Native
  const originalFetch = global.fetch;
  global.fetch = (url, options = {}) => {
    return originalFetch(url, {
      ...options,
      // Add a longer timeout
      timeout: 60000, // 60 seconds
    });
  };
  
  // Disable HMR to fix "Cannot read property 'prototype' of null" error
  if (__DEV__ && typeof global.HermesInternal === 'object') {
    (global as any).HMRClient = null;
  }
}

// Initialize Supabase early
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pre-initialize supabase for use elsewhere
try {
  console.log('Initializing Supabase in App.tsx...');
  const supabaseUrl = 'https://hxdurjngbkfnbryzczau.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw';

  // Make the supabase client globally available
  (global as any).supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      enabled: false,
    },
  });
  
  console.log('Supabase initialized successfully in App.tsx');
} catch (error) {
  console.error('Error initializing Supabase in App.tsx:', error);
}

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { AuthProvider } from './src/context/AuthContext';
import { TrackerProvider } from './src/context/TrackerContext';
import { AlertProvider } from './src/context/AlertContext';
import Navigation from './src/navigation';
import { store } from './src/redux/store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Ignore warnings that we can't fix
LogBox.ignoreLogs([
  "Cannot read property 'install' of null",
  "Unsupported top level event type \"topInsetsChange\" dispatched",
  "RCTBridge required dispatch_sync to load RNGestureHandlerModule",
  "Cannot read property 'bubblingEventTypes' of null",
  "MapMarker",
  "AIRGoogleMapMarker"
]);

export default function App() {
  // Test Supabase connection on app start
  useEffect(() => {
    const testSupabase = async () => {
      try {
        console.log('Testing Supabase connection...');
        
        // Try to import the Supabase client
        const { supabase } = require('./src/services/supabase');
        
        // Try a simple auth operation
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase connection test error:', error);
        } else {
          console.log('Supabase connection test successful', data?.session ? 'Session active' : 'No active session');
        }
      } catch (error) {
        console.error('Error testing Supabase:', error);
      }
    };
    
    testSupabase();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <ReduxProvider store={store}>
        <SafeAreaProvider>
          <AuthProvider>
            <TrackerProvider>
              <AlertProvider>
                <Navigation />
                <StatusBar style="auto" />
              </AlertProvider>
            </TrackerProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});