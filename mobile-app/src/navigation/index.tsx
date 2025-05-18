import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main App Screens
import MapScreen from '../screens/map/MapScreen';
import TrackerListScreen from '../screens/trackers/TrackerListScreen';
import TrackerDetailScreen from '../screens/trackers/TrackerDetailScreen';
import AddTrackerScreen from '../screens/trackers/AddTrackerScreen';
import PairDeviceScreen from '../screens/trackers/physical/PairDeviceScreen';
import SimplePairDeviceScreen from '../screens/trackers/physical/SimplePairDeviceScreen';
import AlertsScreen from '../screens/alerts/AlertsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

// Define types for our navigation stacks
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  TrackerDetail: { trackerId: string };
  AddTracker: undefined;
  PairDevice: { trackerId: string };
  SimplePairDevice: { trackerId: string };
  Settings: undefined;
};

export type TabStackParamList = {
  Map: undefined;
  Trackers: undefined;
  Alerts: undefined;
  Profile: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabStackParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false // Disable gesture navigation
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Trackers') {
            iconName = focused ? 'locate' : 'locate-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Trackers" component={TrackerListScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        gestureEnabled: false // Disable gesture navigation
      }}
    >
      <MainStack.Screen 
        name="Tabs" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="TrackerDetail" 
        component={TrackerDetailScreen} 
        options={{ title: 'Tracker Details' }}
      />
      <MainStack.Screen 
        name="AddTracker" 
        component={AddTrackerScreen} 
        options={{ title: 'Add Tracker' }}
      />
      <MainStack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      <MainStack.Screen 
        name="PairDevice" 
        component={PairDeviceScreen} 
        options={{ title: 'Pair Physical Device', headerShown: false }}
      />
      <MainStack.Screen 
        name="SimplePairDevice" 
        component={SimplePairDeviceScreen} 
        options={{ title: 'Manual Device Pairing', headerShown: false }}
      />
    </MainStack.Navigator>
  );
};

const Navigation = () => {
  const { user, loading } = useSelector((state: RootState) => state.auth);
  
  // Show loading screen if auth is being checked
  if (loading) {
    return null; // In a real app, show a splash/loading screen
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default Navigation;