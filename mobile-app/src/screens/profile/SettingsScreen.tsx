import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = StackNavigationProp<MainStackParamList>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [alertSounds, setAlertSounds] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [leftBehindAlerts, setLeftBehindAlerts] = useState(true);
  const [lowBatteryAlerts, setLowBatteryAlerts] = useState(true);
  const [movementAlerts, setMovementAlerts] = useState(false);
  
  // Load saved settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load notification settings
        const movementAlertsSetting = await AsyncStorage.getItem('setting_movement_alerts');
        if (movementAlertsSetting !== null) {
          setMovementAlerts(movementAlertsSetting === 'true');
        }
        
        // Load other settings as needed
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings when they change
  const saveSettings = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(`setting_${key}`, value.toString());
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };
  
  // Privacy settings
  const [locationHistory, setLocationHistory] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  
  // App settings
  const [darkMode, setDarkMode] = useState(false);
  const [distanceUnit, setDistanceUnit] = useState<'metric' | 'imperial'>('metric');
  
  const toggleDistanceUnit = () => {
    setDistanceUnit(distanceUnit === 'metric' ? 'imperial' : 'metric');
  };
  
  const handleClearData = () => {
    Alert.alert(
      'Clear App Data',
      'This will clear all locally stored data and cache. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, this would clear specific data
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };
  
  // Helper function to create setting item with switch
  const renderSwitchSetting = (
    label: string, 
    value: boolean, 
    onValueChange: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#ccc', true: '#bbd6fe' }}
        thumbColor={value ? '#007AFF' : '#f4f3f4'}
      />
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView>
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {renderSwitchSetting(
            'Push Notifications',
            pushNotifications,
            setPushNotifications,
            'Enable push notifications for alerts'
          )}
          
          {renderSwitchSetting(
            'Alert Sounds',
            alertSounds,
            setAlertSounds,
            'Play sounds for critical alerts'
          )}
          
          {renderSwitchSetting(
            'Vibration',
            vibration,
            setVibration,
            'Vibrate on alerts'
          )}
          
          <Text style={styles.subsectionTitle}>Alert Types</Text>
          
          {renderSwitchSetting(
            'Left Behind Alerts',
            leftBehindAlerts,
            setLeftBehindAlerts
          )}
          
          {renderSwitchSetting(
            'Low Battery Alerts',
            lowBatteryAlerts,
            setLowBatteryAlerts
          )}
          
          {renderSwitchSetting(
            'Movement Alerts',
            movementAlerts,
            (value) => {
              setMovementAlerts(value);
              saveSettings('movement_alerts', value);
            },
            'Receive alerts when trackers move across geofences'
          )}
        </View>
        
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          {renderSwitchSetting(
            'Save Location History',
            locationHistory,
            setLocationHistory,
            'Store location history for your trackers'
          )}
          
          {renderSwitchSetting(
            'Share Analytics',
            analytics,
            setAnalytics,
            'Help improve the app by sharing anonymous usage data'
          )}
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>View Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        </View>
        
        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          {renderSwitchSetting(
            'Dark Mode',
            darkMode,
            setDarkMode,
            'Use dark theme (requires app restart)'
          )}
          
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={toggleDistanceUnit}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Distance Unit</Text>
              <Text style={styles.settingDescription}>
                {distanceUnit === 'metric' ? 'Metric (meters/km)' : 'Imperial (feet/miles)'}
              </Text>
            </View>
            <Ionicons name="swap-horizontal" size={18} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={handleClearData}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: '#F44336' }]}>
                Clear App Data
              </Text>
              <Text style={styles.settingDescription}>
                Delete all locally stored app data
              </Text>
            </View>
            <Ionicons name="trash-outline" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
        
        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0 (Build 1)</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>License</Text>
            <Text style={styles.infoValue}>© 2025 FIND Systems</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
});

export default SettingsScreen;