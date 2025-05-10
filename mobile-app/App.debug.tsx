import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values'; // Required for UUID generation

// Fix for fetch timeout issues with Supabase
import { Platform, LogBox, AppRegistry, StyleSheet, View, Button, Text } from 'react-native';
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

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { AuthProvider } from './src/context/AuthContext';
import { TrackerProvider } from './src/context/TrackerContext';
import { AlertProvider } from './src/context/AlertContext';
import Navigation from './src/navigation';
import { store } from './src/redux/store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from './src/services/supabase';

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
  const [userInfo, setUserInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const handleLogin = async () => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });
      
      if (error) throw error;
      
      console.log('Login successful:', data);
      setUserInfo(data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
    }
  };
  
  const handleGetUser = async () => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      console.log('Current user:', data.user);
      setUserInfo(data.user);
    } catch (err: any) {
      console.error('Get user error:', err);
      setError(err.message);
    }
  };
  
  const handleSignup = async () => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email: 'test2@example.com',
        password: 'password123',
      });
      
      if (error) throw error;
      
      console.log('Signup successful:', data);
      setUserInfo(data.user);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message);
    }
  };
  
  const handleSignout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      console.log('Signout successful');
      setUserInfo(null);
    } catch (err: any) {
      console.error('Signout error:', err);
      setError(err.message);
    }
  };
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <ReduxProvider store={store}>
        <SafeAreaProvider>
          {showDebug ? (
            <View style={{ flex: 1, padding: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Supabase Auth Debug</Text>
              
              <Button title="Login with test@example.com" onPress={handleLogin} />
              <View style={{ height: 10 }} />
              
              <Button title="Sign Up test2@example.com" onPress={handleSignup} />
              <View style={{ height: 10 }} />
              
              <Button title="Get Current User" onPress={handleGetUser} />
              <View style={{ height: 10 }} />
              
              <Button title="Sign Out" onPress={handleSignout} />
              <View style={{ height: 20 }} />
              
              {error && (
                <View style={{ padding: 10, backgroundColor: '#ffeeee', borderRadius: 5, marginBottom: 20 }}>
                  <Text style={{ color: 'red' }}>{error}</Text>
                </View>
              )}
              
              <Text style={{ fontWeight: 'bold' }}>User Info:</Text>
              <View style={{ padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}>
                <Text>{userInfo ? JSON.stringify(userInfo, null, 2) : 'No user logged in'}</Text>
              </View>
              
              <View style={{ height: 20 }} />
              <Button title="Continue to App" onPress={() => setShowDebug(false)} />
            </View>
          ) : (
            <AuthProvider>
              <TrackerProvider>
                <AlertProvider>
                  <Navigation />
                  <View style={{ position: 'absolute', bottom: 20, right: 20 }}>
                    <Button title="Debug" onPress={() => setShowDebug(true)} />
                  </View>
                  <StatusBar style="auto" />
                </AlertProvider>
              </TrackerProvider>
            </AuthProvider>
          )}
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