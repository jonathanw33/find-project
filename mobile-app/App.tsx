import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values'; // Required for UUID generation

// Fix for fetch timeout issues with Supabase
import { Platform, LogBox, AppRegistry, StyleSheet, View } from 'react-native';
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

import React from 'react';
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