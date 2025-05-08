import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { updateTracker } from '../../redux/slices/trackerSlice';
import { useTracker } from '../../context/TrackerContext';
import { useAlert } from '../../context/AlertContext';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, MapStyleElement } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

type TrackerDetailScreenProps = {
  route: RouteProp<MainStackParamList, 'TrackerDetail'>;
  navigation: StackNavigationProp<MainStackParamList, 'TrackerDetail'>;
};

const mapCustomStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dadada"
      }
    ]
  }
];

const TrackerDetailScreen: React.FC<TrackerDetailScreenProps> = ({ route, navigation }) => {
  const { trackerId } = route.params;
  const { trackers } = useSelector((state: RootState) => state.trackers);
  const tracker = trackers[trackerId];
  const dispatch = useDispatch();
  const { updateTrackerDetails, startTrackerSimulation, stopTrackerSimulation } = useTracker();
  const { simulateLeftBehindAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationPattern, setSimulationPattern] = useState<'random' | 'circle' | 'line'>('random');
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!tracker) {
      Alert.alert('Error', 'Tracker not found');
      navigation.goBack();
    } else {
      // Set the title to the tracker name
      navigation.setOptions({ title: tracker.name });
    }
  }, [tracker, navigation]);

  // Add a state to track marker coordinates
  const [markerCoordinate, setMarkerCoordinate] = useState({
    latitude: tracker?.lastSeen?.latitude || 37.7749,
    longitude: tracker?.lastSeen?.longitude || -122.4194,
  });
  
  // Define map region
  const [region, setRegion] = useState({
    latitude: tracker?.lastSeen?.latitude || 37.7749,
    longitude: tracker?.lastSeen?.longitude || -122.4194,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  // Update marker coordinates and force map update when tracker location changes
  useEffect(() => {
    if (tracker && tracker.lastSeen) {
      console.log("Tracker location updated:", tracker.lastSeen);
      
      // Ensure we have valid coordinates (proper numbers)
      const latitude = parseFloat(tracker.lastSeen.latitude.toString());
      const longitude = parseFloat(tracker.lastSeen.longitude.toString());
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        // Update marker coordinate
        setMarkerCoordinate({
          latitude,
          longitude,
        });
        
        // Update map region to focus on the marker
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        
        // Force map to recenter if we have a ref to it
        if (mapRef.current) {
          try {
            // Add a delay to ensure map is ready
            setTimeout(() => {
              console.log("Forcing map update to coordinates:", latitude, longitude);
              mapRef.current?.animateCamera({
                center: {
                  latitude,
                  longitude,
                },
                zoom: 17,
              }, { duration: 500 });
            }, 500);
          } catch (error) {
            console.error("Error animating map:", error);
          }
        }
      }
    }
  }, [tracker?.lastSeen]);

  // Force an initial update when component mounts
  useEffect(() => {
    // When component mounts, force map to update after a delay to ensure map is ready
    if (tracker?.lastSeen) {
      const timer = setTimeout(() => {
        if (mapRef.current) {
          const latitude = parseFloat(tracker.lastSeen.latitude.toString());
          const longitude = parseFloat(tracker.lastSeen.longitude.toString());
          
          console.log("Initial map update to coordinates:", latitude, longitude);
          
          try {
            mapRef.current.animateCamera({
              center: {
                latitude,
                longitude,
              },
              zoom: 17,
            }, { duration: 500 });
          } catch (error) {
            console.error("Error in initial map animation:", error);
          }
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!tracker) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const handleToggleActive = async () => {
    try {
      setLoading(true);
      await updateTrackerDetails(trackerId, { isActive: !tracker.isActive });
      
      if (!tracker.isActive) {
        Alert.alert('Tracker Activated', `${tracker.name} is now active and will send location updates.`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update tracker status');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSimulation = async () => {
    if (isSimulating) {
      stopTrackerSimulation(trackerId);
      setIsSimulating(false);
    } else {
      // Start the simulation with the current pattern
      startTrackerSimulation(trackerId, simulationPattern);
      setIsSimulating(true);
      
      // Automatically show location history when simulating
      if (!showLocationHistory) {
        setShowLocationHistory(true);
      }
      
      // Make sure the map is properly centered on the current location
      if (mapRef.current && tracker.lastSeen) {
        mapRef.current.animateToRegion({
          latitude: tracker.lastSeen.latitude,
          longitude: tracker.lastSeen.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 500);
      }
    }
  };

  const handleChangeSimulationPattern = (pattern: 'random' | 'circle' | 'line') => {
    setSimulationPattern(pattern);
    if (isSimulating) {
      stopTrackerSimulation(trackerId);
      startTrackerSimulation(trackerId, pattern);
    }
  };

  const handleSimulateAlert = async () => {
    try {
      await simulateLeftBehindAlert(trackerId, tracker.name);
      Alert.alert('Alert Simulated', 'A "Left Behind" alert has been created for this tracker');
    } catch (error) {
      Alert.alert('Error', 'Failed to simulate alert');
    }
  };

  const zoomToFitMarkers = () => {
    if (mapRef.current && tracker.locationHistory && tracker.locationHistory.length > 0) {
      const points = [...tracker.locationHistory];
      if (tracker.lastSeen) {
        points.push(tracker.lastSeen);
      }
      
      // Make sure we have valid coordinates
      const validPoints = points
        .filter(point => 
          point && 
          !isNaN(parseFloat(point.latitude.toString())) && 
          !isNaN(parseFloat(point.longitude.toString()))
        )
        .map(point => ({
          latitude: parseFloat(point.latitude.toString()),
          longitude: parseFloat(point.longitude.toString()),
        }));
      
      if (validPoints.length > 0) {
        console.log("Fitting map to coordinates:", validPoints);
        
        mapRef.current.fitToCoordinates(
          validPoints,
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      }
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          {tracker.lastSeen && (
            <>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={region}
                region={region}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                showsUserLocation={false}
                followsUserLocation={false}
                customMapStyle={mapCustomStyle}
                zoomControlEnabled={true}
                zoomEnabled={true}
                rotateEnabled={true}
                onMapReady={() => {
                  console.log("Map is ready!");
                  if (mapRef.current && tracker.lastSeen) {
                    // Force re-render by slightly delaying the animation
                    setTimeout(() => {
                      console.log("Animating to marker region", tracker.lastSeen);
                      try {
                        // Use animateCamera instead of animateToRegion for better precision
                        mapRef.current?.animateCamera({
                          center: {
                            latitude: parseFloat(tracker.lastSeen.latitude.toString()),
                            longitude: parseFloat(tracker.lastSeen.longitude.toString()),
                          },
                          zoom: 17,
                        }, { duration: 500 });
                        
                        // Force marker update
                        setMarkerCoordinate({
                          latitude: parseFloat(tracker.lastSeen.latitude.toString()),
                          longitude: parseFloat(tracker.lastSeen.longitude.toString()),
                        });
                      } catch (error) {
                        console.error("Error animating map:", error);
                      }
                    }, 300);
                  }
                }}
              >
                {/* Current location marker */}
                {tracker.lastSeen && (
                  <>
                    {/* Main marker */}
                    <Marker
                      key={`current-${tracker.id}-${Date.now()}`} 
                      identifier={tracker.id}
                      coordinate={{
                        latitude: parseFloat(tracker.lastSeen.latitude.toString()),
                        longitude: parseFloat(tracker.lastSeen.longitude.toString()),
                      }}
                      title={tracker.name}
                      description={`Last seen: ${formatTimestamp(tracker.lastSeen.timestamp)}`}
                      pinColor={tracker.type === 'physical' ? '#007AFF' : '#FF9500'}
                      tracksViewChanges={true}
                    />
                  </>
                )}
                
                {/* History polyline and markers */}
                {showLocationHistory && tracker.locationHistory && tracker.locationHistory.length > 1 && (
                  <>
                    <Polyline
                      coordinates={tracker.locationHistory.map(point => ({
                        latitude: parseFloat(point.latitude.toString()),
                        longitude: parseFloat(point.longitude.toString()),
                      }))}
                      strokeColor="#007AFF"
                      strokeWidth={5}
                    />
                    
                    {tracker.locationHistory.map((point, index) => (
                      ((index > 0 && index < tracker.locationHistory.length - 1) || index % 5 === 0) && (
                        <Marker
                          key={`history-${index}`}
                          coordinate={{
                            latitude: parseFloat(point.latitude.toString()),
                            longitude: parseFloat(point.longitude.toString()),
                          }}
                          title={`Location History`}
                          description={`${formatTimestamp(point.timestamp)}`}
                          pinColor="gray"
                          opacity={0.7}
                          tracksViewChanges={true}
                        />
                      )
                    ))}
                  </>
                )}
              </MapView>
              
              <View style={styles.debugOverlay}>
                <Text style={styles.debugText}>
                  Location: {markerCoordinate.latitude.toFixed(6)}, {markerCoordinate.longitude.toFixed(6)}
                </Text>
              </View>
              
              <View style={styles.mapControls}>
                <TouchableOpacity
                  style={styles.mapControlButton}
                  onPress={() => setShowLocationHistory(!showLocationHistory)}
                >
                  <Ionicons
                    name={showLocationHistory ? 'trail-sign' : 'trail-sign-outline'}
                    size={24}
                    color="#007AFF"
                  />
                  <Text style={styles.mapControlText}>
                    {showLocationHistory ? 'Hide History' : 'Show History'}
                  </Text>
                </TouchableOpacity>
                
                {showLocationHistory && tracker.locationHistory && tracker.locationHistory.length > 1 && (
                  <TouchableOpacity
                    style={styles.mapControlButton}
                    onPress={zoomToFitMarkers}
                  >
                    <Ionicons name="expand-outline" size={24} color="#007AFF" />
                    <Text style={styles.mapControlText}>Fit All Points</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
        
        {/* Tracker Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <View style={[
              styles.trackerTypeContainer,
              { backgroundColor: tracker.type === 'physical' ? '#007AFF' : '#FF9500' }
            ]}>
              <Ionicons
                name={tracker.type === 'physical' ? 'hardware-chip' : 'bookmark'}
                size={18}
                color="#fff"
              />
              <Text style={styles.trackerTypeText}>
                {tracker.type === 'physical' ? 'Physical' : 'Virtual'} Tracker
              </Text>
            </View>
            
            <View style={styles.trackerStatus}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: tracker.isActive ? '#4CAF50' : '#F44336' }
              ]} />
              <Text style={styles.trackerStatusText}>
                {tracker.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          <View style={styles.trackerDetailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Seen:</Text>
              <Text style={styles.detailValue}>
                {tracker.lastSeen
                  ? formatTimestamp(tracker.lastSeen.timestamp)
                  : 'Unknown'}
              </Text>
            </View>
            
            {tracker.type === 'physical' && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Battery:</Text>
                  <Text style={[
                    styles.detailValue,
                    {
                      color: tracker.batteryLevel && tracker.batteryLevel > 20
                        ? '#4CAF50'
                        : '#F44336'
                    }
                  ]}>
                    {tracker.batteryLevel ? `${tracker.batteryLevel}%` : 'Unknown'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Connection:</Text>
                  <Text style={styles.detailValue}>
                    {tracker.connectionStatus || 'Unknown'}
                  </Text>
                </View>
                
                {tracker.bleId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Device ID:</Text>
                    <Text style={styles.detailValue}>{tracker.bleId}</Text>
                  </View>
                )}
              </>
            )}
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch
              value={tracker.isActive}
              onValueChange={handleToggleActive}
              trackColor={{ false: '#ccc', true: '#bbd6fe' }}
              thumbColor={tracker.isActive ? '#007AFF' : '#f4f3f4'}
              disabled={loading}
            />
          </View>
        </View>
        
        {/* Simulation Controls (Virtual Trackers only) */}
        {tracker.type === 'virtual' && (
          <View style={styles.simulationSection}>
            <Text style={styles.sectionTitle}>Simulation Controls</Text>
            
            <View style={styles.simulationPatterns}>
              <TouchableOpacity
                style={[
                  styles.patternButton,
                  simulationPattern === 'random' && styles.patternButtonActive
                ]}
                onPress={() => handleChangeSimulationPattern('random')}
                disabled={loading}
              >
                <Ionicons name="shuffle" size={20} color={simulationPattern === 'random' ? '#fff' : '#007AFF'} />
                <Text style={[
                  styles.patternButtonText,
                  simulationPattern === 'random' && styles.patternButtonTextActive
                ]}>
                  Random
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.patternButton,
                  simulationPattern === 'circle' && styles.patternButtonActive
                ]}
                onPress={() => handleChangeSimulationPattern('circle')}
                disabled={loading}
              >
                <Ionicons name="ellipse-outline" size={20} color={simulationPattern === 'circle' ? '#fff' : '#007AFF'} />
                <Text style={[
                  styles.patternButtonText,
                  simulationPattern === 'circle' && styles.patternButtonTextActive
                ]}>
                  Circle
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.patternButton,
                  simulationPattern === 'line' && styles.patternButtonActive
                ]}
                onPress={() => handleChangeSimulationPattern('line')}
                disabled={loading}
              >
                <Ionicons name="trending-up-outline" size={20} color={simulationPattern === 'line' ? '#fff' : '#007AFF'} />
                <Text style={[
                  styles.patternButtonText,
                  simulationPattern === 'line' && styles.patternButtonTextActive
                ]}>
                  Line
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.simulationButton,
                isSimulating ? styles.stopButton : styles.startButton
              ]}
              onPress={handleToggleSimulation}
              disabled={loading}
            >
              <Ionicons
                name={isSimulating ? 'stop-circle' : 'play-circle'}
                size={24}
                color="#fff"
              />
              <Text style={styles.simulationButtonText}>
                {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.alertButton}
              onPress={handleSimulateAlert}
              disabled={loading}
            >
              <Ionicons name="notifications" size={24} color="#fff" />
              <Text style={styles.simulationButtonText}>
                Simulate "Left Behind" Alert
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 300,
    width: '100%',
    marginBottom: 16,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  debugOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 5,
    borderRadius: 5,
    zIndex: 999,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
  },
  mapControls: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 999,
  },
  mapControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  mapControlText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackerTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trackerTypeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  trackerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  trackerStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  trackerDetailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#555',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  simulationSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
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
  simulationPatterns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  patternButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
  },
  patternButtonActive: {
    backgroundColor: '#007AFF',
  },
  patternButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  patternButtonTextActive: {
    color: '#fff',
  },
  simulationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FF9500',
  },
  simulationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TrackerDetailScreen;