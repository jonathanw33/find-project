import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation';
import { store } from './src/redux/store';
import { GeofenceProvider } from './src/context/GeofenceContext';
import { ScheduledAlertProvider } from './src/context/ScheduledAlertContext';
import { AuthProvider } from './src/context/AuthContext';
import { TrackerProvider } from './src/context/TrackerContext';
import { AlertProvider } from './src/context/AlertContext';
import clientAlertChecker from './src/services/clientAlertChecker';
import { useSelector } from 'react-redux';
import { RootState } from './src/redux/store';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Separate component for alert checking to have access to Redux
const AlertChecker: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { trackers } = useSelector((state: RootState) => state.trackers);
  
  // Initialize notifications and check alerts when user is authenticated
  useEffect(() => {
    if (!user) return;
    
    const initializeAlerts = async () => {
      // Set up notifications
      await clientAlertChecker.setupNotifications();
      
      // Check alerts on app start
      checkAlerts();
    };
    
    initializeAlerts();
    
    // Set up app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Set up interval for regular checks while app is open
    const interval = setInterval(() => {
      clientAlertChecker.checkScheduledAlerts();
    }, 60000); // Every minute
    
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [user]);
  
  // Check alerts when trackers are updated
  useEffect(() => {
    if (!user || !trackers || Object.keys(trackers).length === 0) return;
    
    // Check geofences for each tracker with a location
    Object.values(trackers).forEach(tracker => {
      if (tracker?.lastSeen?.latitude && tracker?.lastSeen?.longitude) {
        clientAlertChecker.checkGeofences(
          tracker.id,
          tracker.lastSeen.latitude,
          tracker.lastSeen.longitude
        );
      }
    });
  }, [trackers, user]);
  
  const handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      checkAlerts();
    }
  };
  
  const checkAlerts = () => {
    // Check scheduled alerts
    clientAlertChecker.checkScheduledAlerts();
    
    // Check geofences for each tracker
    if (trackers && Object.keys(trackers).length > 0) {
      Object.values(trackers).forEach(tracker => {
        if (tracker?.lastSeen?.latitude && tracker?.lastSeen?.longitude) {
          clientAlertChecker.checkGeofences(
            tracker.id,
            tracker.lastSeen.latitude,
            tracker.lastSeen.longitude
          );
        }
      });
    }
  };
  
  return null; // This component doesn't render anything
};

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthProvider>
          <TrackerProvider>
            <AlertProvider>
              <GeofenceProvider>
                <ScheduledAlertProvider>
                  <AlertChecker />
                  <AppNavigator />
                </ScheduledAlertProvider>
              </GeofenceProvider>
            </AlertProvider>
          </TrackerProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </Provider>
  );
}