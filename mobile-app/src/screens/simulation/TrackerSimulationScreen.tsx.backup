import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { useTracker } from '../../context/TrackerContext';
import { useGeofence } from '../../context/GeofenceContext';
import { useAlert } from '../../context/AlertContext';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { startGeofenceCrossingSimulation, stopSimulation as stopUtilsSimulation, SimulationPattern } from '../../utils/trackerSimulation';
import { LocationPoint } from '../../redux/slices/trackerSlice';
import { Geofence } from '../../services/geofence/geofenceService';

type RouteProps = RouteProp<MainStackParamList, 'TrackerSimulation'>;
type NavigationProps = StackNavigationProp<MainStackParamList>;

const TrackerSimulationScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const { trackerId } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [simulationPattern, setSimulationPattern] = useState<SimulationPattern>('geofence_cross');
  const [showGeofences, setShowGeofences] = useState(true);
  
  const mapRef = useRef<MapView>(null);
  const trackers = useSelector((state: RootState) => state.trackers.trackers);
  const { moveVirtualTracker, startTrackerSimulation, stopTrackerSimulation } = useTracker();
  const { geofences, getLinkedGeofences } = useGeofence();
  const { createAlert } = useAlert();
  
  const [linkedGeofences, setLinkedGeofences] = useState<Geofence[]>([]);
  
  const [simulationSource, setSimulationSource] = useState<'context' | 'utils'>('context');
  
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location Permission Denied', 'Enable location services to use the simulation feature.');
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        
        // Center map on current location initially
        if (trackers[trackerId]?.lastSeen) {
          setRegion({
            latitude: trackers[trackerId].lastSeen.latitude,
            longitude: trackers[trackerId].lastSeen.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } else {
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Could not get your current location');
      } finally {
        setLoading(false);
      }
    };
    
    getLocation();
    
    // Load linked geofences for this tracker
    if (trackerId) {
      loadLinkedGeofences();
    }
    
    // Clean up simulations when leaving the screen
    return () => {
      if (isSimulationActive && trackerId) {
        // Stop both simulation systems to be safe
        stopTrackerSimulation(trackerId);
        stopUtilsSimulation(trackerId);
        setIsSimulationActive(false);
      }
    };
  }, [trackerId]);
  
  const loadLinkedGeofences = async () => {
    try {
      if (trackerId) {
        const geofences = await getLinkedGeofences(trackerId);
        setLinkedGeofences(geofences);
        
        // Select the first geofence by default if available
        if (geofences.length > 0) {
          setSelectedGeofence(geofences[0]);
        }
      }
    } catch (error) {
      console.error('Error loading geofences:', error);
      Alert.alert('Error', 'Could not load geofences');
    }
  };
  
  const handleStartSimulation = async () => {
    if (!trackerId) {
      Alert.alert('Error', 'No tracker selected');
      return;
    }
    
    if (simulationPattern === 'geofence_cross' && !selectedGeofence) {
      Alert.alert('Error', 'Select a geofence for crossing simulation');
      return;
    }
    
    try {
      setIsSimulationActive(true);
      
      if (simulationPattern === 'geofence_cross' && selectedGeofence) {
        // Use utils simulation for geofence crossing
        setSimulationSource('utils');
        
        // Get the tracker's current location
        const trackerLocation: LocationPoint = trackers[trackerId]?.lastSeen || {
          latitude: region.latitude,
          longitude: region.longitude,
          timestamp: Date.now(),
        };
        
        // Start geofence crossing simulation
        startGeofenceCrossingSimulation(
          trackerId,
          trackerLocation,
          selectedGeofence,
          (location) => {
            // This callback will be called with each location update
            handleLocationUpdate(location);
          }
        );
        
        Alert.alert(
          'Simulation Started',
          `Tracker will simulate crossing geofence "${selectedGeofence.name}"`
        );
      } else {
        // Use TrackerContext simulation for regular patterns
        setSimulationSource('context');
        
        startTrackerSimulation(
          trackerId,
          simulationPattern,
          {
            speed: 0.00008, // Slightly faster for testing
            updateInterval: 2000, // More frequent updates
          }
        );
        
        Alert.alert(
          'Simulation Started',
          `Tracker is now following ${simulationPattern} pattern`
        );
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
      Alert.alert('Error', 'Failed to start simulation');
      setIsSimulationActive(false);
    }
  };
  
  const handleStopSimulation = () => {
    if (trackerId) {
      // Stop the appropriate simulation based on source
      if (simulationSource === 'utils') {
        stopUtilsSimulation(trackerId);
        console.log('Stopped utils simulation');
      } else {
        stopTrackerSimulation(trackerId);
        console.log('Stopped context simulation');
      }
      
      // Also stop both to be absolutely sure
      stopTrackerSimulation(trackerId);
      stopUtilsSimulation(trackerId);
      
      setIsSimulationActive(false);
      Alert.alert('Simulation Stopped', 'The tracker simulation has been stopped');
    }
  };
  
  const handleLocationUpdate = async (location: LocationPoint) => {
    if (trackerId) {
      try {
        await moveVirtualTracker(trackerId, location);
      } catch (error) {
        console.error('Error updating tracker location:', error);
      }
    }
  };
  
  const handleGeofencePress = (geofence: Geofence) => {
    setSelectedGeofence(geofence);
    
    // Center map on selected geofence
    mapRef.current?.animateToRegion({
      latitude: geofence.centerLatitude,
      longitude: geofence.centerLongitude,
      latitudeDelta: Math.max(0.01, geofence.radius / 5000), // Adjust zoom based on radius
      longitudeDelta: Math.max(0.01, geofence.radius / 5000),
    });
  };
  
  const renderSimulationControls = () => (
    <View style={styles.controlsContainer}>
      <Text style={styles.sectionTitle}>Simulation Controls</Text>
      
      {!isSimulationActive ? (
        <View>
          <Text style={styles.label}>Simulation Pattern:</Text>
          <View style={styles.buttonsRow}>
            {(['geofence_cross', 'circle', 'line', 'random'] as SimulationPattern[]).map((pattern) => (
              <TouchableOpacity
                key={pattern}
                style={[
                  styles.patternButton,
                  simulationPattern === pattern && styles.patternButtonSelected,
                ]}
                onPress={() => setSimulationPattern(pattern)}
              >
                <Text
                  style={[
                    styles.patternButtonText,
                    simulationPattern === pattern && styles.patternButtonTextSelected,
                  ]}
                >
                  {pattern.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {simulationPattern === 'geofence_cross' && (
            <View style={styles.geofenceSelector}>
              <Text style={styles.label}>Select Geofence to Cross:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {linkedGeofences.length > 0 ? (
                  linkedGeofences.map((geofence) => (
                    <TouchableOpacity
                      key={geofence.id}
                      style={[
                        styles.geofenceButton,
                        selectedGeofence?.id === geofence.id && styles.geofenceButtonSelected,
                      ]}
                      onPress={() => handleGeofencePress(geofence)}
                    >
                      <Text
                        style={[
                          styles.geofenceButtonText,
                          selectedGeofence?.id === geofence.id && styles.geofenceButtonTextSelected,
                        ]}
                      >
                        {geofence.name}
                      </Text>
                      <Text style={styles.geofenceButtonRadius}>
                        {geofence.radius}m
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noGeofencesText}>
                    No geofences linked to this tracker. Add geofences first.
                  </Text>
                )}
              </ScrollView>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartSimulation}
            disabled={simulationPattern === 'geofence_cross' && !selectedGeofence}
          >
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.startButtonText}>Start Simulation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.activeSimulationText}>
            Simulation active: {simulationPattern.replace('_', ' ')}
            {simulationPattern === 'geofence_cross' && selectedGeofence
              ? ` for "${selectedGeofence.name}"`
              : ''
            }
          </Text>
          
          <TouchableOpacity style={styles.stopButton} onPress={handleStopSimulation}>
            <Ionicons name="stop" size={20} color="#FFF" />
            <Text style={styles.stopButtonText}>Stop Simulation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading simulation...</Text>
      </View>
    );
  }
  
  if (!trackerId || !trackers[trackerId]) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#FF3B30" />
          <Text style={styles.errorText}>Tracker not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const tracker = trackers[trackerId];
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonSmall} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Simulate: {tracker.name}</Text>
        <View style={styles.geofenceToggleContainer}>
          <Text style={styles.geofenceToggleLabel}>Show Geofences</Text>
          <Switch
            value={showGeofences}
            onValueChange={setShowGeofences}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={showGeofences ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsCompass
          showsScale
        >
          {/* Tracker marker */}
          {tracker.lastSeen && (
            <Marker
              coordinate={{
                latitude: tracker.lastSeen.latitude,
                longitude: tracker.lastSeen.longitude,
              }}
              title={tracker.name}
              description="Current simulated position"
              pinColor="#FF9500"
            />
          )}
          
          {/* Display geofences */}
          {showGeofences && linkedGeofences
            .filter((geofence) => 
              geofence && 
              geofence.centerLatitude != null && 
              geofence.centerLongitude != null && 
              geofence.radius != null &&
              !isNaN(geofence.centerLatitude) &&
              !isNaN(geofence.centerLongitude) &&
              !isNaN(geofence.radius)
            )
            .map((geofence) => (
            <Circle
              key={geofence.id}
              center={{
                latitude: Number(geofence.centerLatitude),
                longitude: Number(geofence.centerLongitude),
              }}
              radius={Number(geofence.radius)}
              strokeWidth={2}
              strokeColor={selectedGeofence?.id === geofence.id ? '#FF3B30' : '#007AFF'}
              fillColor={selectedGeofence?.id === geofence.id ? 'rgba(255, 59, 48, 0.2)' : 'rgba(0, 122, 255, 0.1)'}
              onPress={() => handleGeofencePress(geofence)}
            />
          ))}
        </MapView>
      </View>
      
      {renderSimulationControls()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginVertical: 10,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  backButtonSmall: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  geofenceToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geofenceToggleLabel: {
    fontSize: 14,
    marginRight: 8,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  patternButton: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  patternButtonSelected: {
    backgroundColor: '#007AFF',
  },
  patternButtonText: {
    color: '#666',
    fontSize: 14,
  },
  patternButtonTextSelected: {
    color: '#fff',
  },
  geofenceSelector: {
    marginBottom: 16,
  },
  geofenceButton: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  geofenceButtonSelected: {
    backgroundColor: '#007AFF',
  },
  geofenceButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  geofenceButtonTextSelected: {
    color: '#fff',
  },
  geofenceButtonRadius: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  noGeofencesText: {
    color: '#999',
    fontStyle: 'italic',
    padding: 12,
  },
  startButton: {
    backgroundColor: '#4CD964',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activeSimulationText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default TrackerSimulationScreen;
