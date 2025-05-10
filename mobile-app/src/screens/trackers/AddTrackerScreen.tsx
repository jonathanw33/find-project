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

  const handleScanForDevices = () => {
    // In a real app, this would initiate BLE scanning
    setIsScanning(true);
    
    // Simulate finding a device after 2 seconds
    setTimeout(() => {
      setIsScanning(false);
      // For demo purposes, we'll just set a mock BLE ID
      setBleId('D4:3B:7A:12:9F:E5');
      Alert.alert('Device Found', 'FIND Tracker detected');
    }, 2000);
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
        // In a real app, you would register the physical tracker
        Alert.alert('Not Implemented', 'Physical tracker registration is not implemented in this demo');
        setLoading(false);
        return;
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
                onValueChange={setIsPhysical}
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
                )}
                
                <Text style={styles.helpText}>
                  Make sure your physical tracker is nearby and in pairing mode.
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