import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useTracker } from '../../context/TrackerContext';
import { useSupabaseTrackers } from '../../hooks/useSupabaseTrackers';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { theme } from '../../theme';

type NavigationProp = StackNavigationProp<MainStackParamList>;

const AddTrackerScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [isPhysical, setIsPhysical] = useState(false);
  const [bleId, setBleId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [customLocation, setCustomLocation] = useState<boolean>(false);
  const [virtualLocationMarker, setVirtualLocationMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const { getCurrentUserLocation } = useTracker();
  const { createTracker } = useSupabaseTrackers();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const getInitialLocation = async () => {
      try {
        const userLocation = await getCurrentUserLocation();
        setVirtualLocationMarker({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });
        setMapRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (error) {
        console.error('Error getting initial location:', error);
        Alert.alert('Error', 'Could not get your current location');
      }
    };

    getInitialLocation();
  }, []);

  const handleScanForDevices = async () => {
    setIsScanning(true);
    
    try {
      // Try to use the real BLE scanner if available
      if (Platform.OS !== 'web') {
        // Import the bluetoothService to scan for devices
        const { bluetoothService } = require('../../services/bluetooth/bluetoothService');
        
        // Request necessary permissions
        const hasPermissions = await bluetoothService.requestPermissions();
        if (!hasPermissions) {
          throw new Error('Bluetooth permissions not granted');
        }
        
        // Start scanning for devices
        let deviceFound = false;
        await bluetoothService.startScan((device) => {
          // When a device is found, stop scanning and update the UI
          deviceFound = true;
          setBleId(device.id);
          bluetoothService.stopScan();
          setIsScanning(false);
          Alert.alert('Device Found', `FIND Tracker detected: ${device.name || 'Unknown'}`);
        });
        
        // Stop scanning after 10 seconds if no devices found
        setTimeout(() => {
          if (isScanning && !deviceFound) {
            bluetoothService.stopScan();
            setIsScanning(false);
            Alert.alert('No Devices Found', 'Could not find any FIND Trackers nearby.');
          }
        }, 10000);
      } else {
        // If on web or Bluetooth not supported, simulate device discovery
        setTimeout(() => {
          setIsScanning(false);
          // Generate a mock BLE ID
          const mockId = 'MOCK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
          setBleId(mockId);
          Alert.alert('Device Found', 'FIND Tracker detected (simulated)');
        }, 2000);
      }
    } catch (error) {
      console.error('Error scanning for devices:', error);
      setIsScanning(false);
      Alert.alert(
        'Scan Error',
        'Failed to scan for devices. Would you like to use mock data instead?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Use Mock Data',
            onPress: () => {
              // Generate a mock BLE ID
              const mockId = 'MOCK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
              setBleId(mockId);
            }
          }
        ]
      );
    }
  };

  const handleMapPress = (e: any) => {
    if (customLocation) {
      setVirtualLocationMarker(e.nativeEvent.coordinate);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for your tracker');
      return;
    }

    if (isPhysical && !bleId) {
      Alert.alert('Error', 'Please scan and connect to a physical tracker');
      return;
    }

    try {
      setLoading(true);
      
      if (isPhysical) {
        // Create the tracker first
        const newTracker = await createTracker(name, 'physical');
        
        // Import the bluetoothService to check if BLE is available
        let bleAvailable = false;
        try {
          if (Platform.OS !== 'web') {
            const { bluetoothService } = require('../../services/bluetooth/bluetoothService');
            bleAvailable = bluetoothService && bluetoothService.bleAvailable;
          }
        } catch (error) {
          console.error('Error checking BLE availability:', error);
          bleAvailable = false;
        }
        
        // Navigate to the appropriate pairing screen based on BLE availability
        if (Platform.OS === 'web' || !bleAvailable) {
          // For web testing or when BLE is unavailable, use SimplePairDeviceScreen directly
          navigation.navigate('SimplePairDevice', { trackerId: newTracker.id });
        } else {
          // Show alert with options to choose which pairing method to use
          Alert.alert(
            'Choose Pairing Method',
            'How would you like to pair your physical tracker?',
            [
              {
                text: 'Bluetooth Pairing',
                onPress: () => navigation.navigate('PairDevice', { trackerId: newTracker.id })
              },
              {
                text: 'Manual Pairing',
                onPress: () => navigation.navigate('SimplePairDevice', { trackerId: newTracker.id })
              }
            ],
            { cancelable: false }
          );
        }
      } else {
        // Create a virtual tracker
        if (!virtualLocationMarker) {
          Alert.alert('Error', 'Could not determine tracker location');
          setLoading(false);
          return;
        }
        
        await createTracker(name, 'virtual', {
          latitude: virtualLocationMarker.latitude,
          longitude: virtualLocationMarker.longitude,
          timestamp: Date.now(),
        });
        
        Alert.alert('Success', 'Virtual tracker created successfully');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create tracker');
      console.error('Error creating tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Add New Tracker</Text>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Tracker Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tracker Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter tracker name (e.g., Keys, Wallet)"
                value={name}
                onChangeText={setName}
              />
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Physical Tracker</Text>
              <Switch
                value={isPhysical}
                onValueChange={(value) => {
                  setIsPhysical(value);
                  // Reset BLE ID when switching modes
                  if (!value) {
                    setBleId('');
                  }
                }}
                trackColor={{ false: '#ccc', true: '#bbd6fe' }}
                thumbColor={isPhysical ? '#007AFF' : '#f4f3f4'}
              />
            </View>
            
            {isPhysical ? (
              <View style={styles.bleSection}>
                <Text style={styles.inputLabel}>Connect Physical Tracker</Text>
                
                {bleId ? (
                  <View style={styles.connectedDevice}>
                    <View style={styles.deviceInfo}>
                      <Ionicons name="bluetooth" size={20} color="#007AFF" />
                      <Text style={styles.deviceId}>ID: {bleId}</Text>
                    </View>
                    <Text style={styles.connectedText}>Connected</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.scanButton}
                      onPress={handleScanForDevices}
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={styles.scanButtonText}>Scanning...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="bluetooth" size={20} color="#fff" />
                          <Text style={styles.scanButtonText}>Scan for Devices</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.manualPairingButton} 
                      onPress={() => {
                        // Generate a mock BLE ID for the device
                        const mockId = 'MANUAL-' + Math.random().toString(36).substring(2, 10).toUpperCase();
                        setBleId(mockId);
                      }}
                    >
                      <Ionicons name="create-outline" size={20} color="#fff" />
                      <Text style={styles.manualPairingText}>Set Up Manually</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                <Text style={styles.helpText}>
                  Make sure your physical tracker is nearby and in pairing mode, or select "Set Up Manually" if you prefer to configure the device without using Bluetooth.
                </Text>
              </View>
            ) : (
              <View style={styles.locationSection}>
                <View style={styles.locationHeader}>
                  <Text style={styles.inputLabel}>Virtual Tracker Location</Text>
                  <View style={styles.switchContainer}>
                    <Text style={styles.smallSwitchLabel}>Custom Location</Text>
                    <Switch
                      value={customLocation}
                      onValueChange={setCustomLocation}
                      trackColor={{ false: '#ccc', true: '#bbd6fe' }}
                      thumbColor={customLocation ? '#007AFF' : '#f4f3f4'}
                    />
                  </View>
                </View>
                
                {mapRegion && (
                  <View style={styles.mapContainer}>
                    <MapView
                      style={styles.map}
                      region={mapRegion}
                      onPress={handleMapPress}
                      showsUserLocation
                    >
                      {virtualLocationMarker && (
                        <Marker
                          coordinate={{
                            latitude: virtualLocationMarker.latitude,
                            longitude: virtualLocationMarker.longitude,
                          }}
                          pinColor="#FF9500"
                          draggable={customLocation}
                          onDragEnd={(e) => setVirtualLocationMarker(e.nativeEvent.coordinate)}
                        />
                      )}
                    </MapView>
                    
                    {customLocation && (
                      <Text style={styles.mapInstructions}>
                        Tap on the map to place your virtual tracker
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Tracker</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  smallSwitchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginRight: 8,
  },
  bleSection: {
    marginTop: 8,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  manualPairingButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualPairingText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#777',
    marginTop: 8,
  },
  connectedDevice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceId: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
  connectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  locationSection: {
    marginTop: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mapContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapInstructions: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: 8,
    textAlign: 'center',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#95c2f7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddTrackerScreen;