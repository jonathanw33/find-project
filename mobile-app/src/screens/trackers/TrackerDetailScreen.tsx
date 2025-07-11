import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
// import { updateTracker } from '../../redux/slices/trackerSlice'; // Not used directly, dispatch is used with actions
import { useTracker } from '../../context/TrackerContext';
import { useSupabaseTrackers } from '../../hooks/useSupabaseTrackers';
import { useAlert } from '../../context/AlertContext';
import { useGeofence } from '../../context/GeofenceContext';
import { useScheduledAlert } from '../../context/ScheduledAlertContext';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, Region, Circle } from 'react-native-maps'; // Added Circle for geofences
import { SafeAreaView } from 'react-native-safe-area-context';
import { markTrackerAsLost } from '../../utils/markTrackerLost';
import { startGeofenceCrossingSimulation, stopSimulation as stopUtilsSimulation } from '../../utils/trackerSimulation';
import { LocationPoint } from '../../redux/slices/trackerSlice';
import { Geofence } from '../../services/geofence/geofenceService';


type TrackerDetailScreenProps = {
  route: RouteProp<MainStackParamList, 'TrackerDetail'>;
  navigation: StackNavigationProp<MainStackParamList, 'TrackerDetail'>;
};

const defaultRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const TrackerDetailScreen: React.FC<TrackerDetailScreenProps> = ({ route, navigation }) => {
  const { trackerId } = route.params;
  
  // Minimal logging for debugging
  const { trackers } = useSelector((state: RootState) => state.trackers);
  const tracker = trackers[trackerId];
  
  const dispatch = useDispatch(); // Kept if other dispatches are needed later
  const { startTrackerSimulation, stopTrackerSimulation, moveVirtualTracker } = useTracker();
  const { updateTrackerDetails: supabaseUpdateTrackerDetails, updateLocation, fetchTrackerHistory } = useSupabaseTrackers();
  const { simulateLeftBehindAlert } = useAlert();
  const { getLinkedGeofences } = useGeofence();
  const { getScheduledAlertsForTracker } = useScheduledAlert();
  
  const [loading, setLoading] = useState(false);
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [showGeofences, setShowGeofences] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationPattern, setSimulationPattern] = useState<'random' | 'circle' | 'line' | 'geofence_cross'>('random');
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [linkedGeofences, setLinkedGeofences] = useState([]);
  const [scheduledAlerts, setScheduledAlerts] = useState([]);
  const [simulationGeofences, setSimulationGeofences] = useState<(Geofence & { alertOnEnter: boolean, alertOnExit: boolean })[]>([]);
  const mapRef = useRef<MapView>(null);

  // Load location history when component mounts
  useEffect(() => {
    if (tracker) {
      fetchTrackerHistory(tracker.id);
      loadAdvancedAlertData();
    }
  }, [tracker?.id]);
  
  const loadAdvancedAlertData = async () => {
    if (!tracker) return;
    
    try {
      // Load geofences
      const geofences = await getLinkedGeofences(tracker.id);
      setLinkedGeofences(geofences);
      setSimulationGeofences(geofences);
      
      // Auto-select first geofence if available for simulation
      if (geofences.length > 0 && !selectedGeofence) {
        setSelectedGeofence(geofences[0]);
      }
      
      // Load scheduled alerts
      const alerts = await getScheduledAlertsForTracker(tracker.id);
      setScheduledAlerts(alerts);
    } catch (error) {
      console.error("Error loading advanced alert data:", error);
    }
  };

  const [region, setRegion] = useState<Region>(() => {
    if (tracker?.lastSeen) {
      return {
        latitude: tracker.lastSeen.latitude,
        longitude: tracker.lastSeen.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return defaultRegion;
  });

  // Simplified useEffect for region updates
  useEffect(() => {
    if (!tracker) {
      console.warn('TrackerDetailScreen - useEffect: Tracker is null, cannot set title or region.');
      return;
    }

    if (process.env.NODE_ENV === 'development' && false) { // Set to true to enable tracker update logs
      console.log(`Tracker update: ${tracker.name}`);
    }
    navigation.setOptions({ title: tracker.name });

    // Don't update the region or do major animations if we're in simulation mode
    // This prevents jarring refreshes during simulation
    if (isSimulating && tracker.lastSeen) {
      // During simulation, just smoothly update the marker position without resetting the view
      if (mapRef.current) {
        // Use a gentle animation if the user isn't actively panning the map
        mapRef.current.animateCamera({
          center: {
            latitude: tracker.lastSeen.latitude,
            longitude: tracker.lastSeen.longitude,
          },
          // Keep the current zoom level
          // Don't use zoom: explicitly which would change the zoom level
        }, { duration: 500 });
      }
      return;
    }

    // Only do full region updates when not in simulation mode or on first load
    if (tracker.lastSeen && typeof tracker.lastSeen.latitude === 'number' && typeof tracker.lastSeen.longitude === 'number') {
      const newLatitude = tracker.lastSeen.latitude;
      const newLongitude = tracker.lastSeen.longitude;

      // Log region state if in dev mode
      if (process.env.NODE_ENV === 'development' && false) { // Set to true to enable location logs
        console.log(`Tracker location: ${newLatitude}, ${newLongitude}`);
      }

      const newMapRegion = {
        latitude: newLatitude,
        longitude: newLongitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newMapRegion); // Update the region state

      // Animate to the region
      setTimeout(() => { // Small delay to ensure mapRef might be ready
        if (mapRef.current) {
          console.log('TrackerDetailScreen - useEffect (delayed): Animating map to new region:', JSON.stringify(newMapRegion));
          mapRef.current.animateToRegion(newMapRegion, 500);
          
          // Also try using fitToCoordinates after a slightly longer delay
          setTimeout(() => {
            if (mapRef.current) {
              zoomToFitMarkers();
              console.log('TrackerDetailScreen - useEffect: Called zoomToFitMarkers');
            }
          }, 1000);
        } else {
          console.warn('TrackerDetailScreen - useEffect (delayed): mapRef.current STILL null.');
        }
      }, 100); // 100ms delay, adjust if needed
    } else {
      console.warn('TrackerDetailScreen - useEffect: tracker.lastSeen is missing or has invalid coordinates.', JSON.stringify(tracker.lastSeen));
    }
  }, [tracker, isSimulating]); // Added isSimulating to dependencies

  const handleToggleActive = async () => {
    if (!tracker) return;
    try {
      setLoading(true);
      await supabaseUpdateTrackerDetails(trackerId, { isActive: !tracker.isActive });
      if (!tracker.isActive) { // Note: tracker.isActive here is the value *before* the update
        Alert.alert('Tracker Activated', `${tracker.name} is now active and will send location updates.`);
      } else {
        Alert.alert('Tracker Deactivated', `${tracker.name} is now inactive.`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update tracker status');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSimulation = async () => {
    if (!tracker) return;
    
    if (isSimulating) {
      // First update UI state
      setIsSimulating(false);
      
      // Stop both simulation systems to be sure
      stopTrackerSimulation(trackerId);
      stopUtilsSimulation(trackerId);
      
      // After stopping, fit to markers once to reset the view
      setTimeout(() => {
        if (mapRef.current && tracker.lastSeen) {
          zoomToFitMarkers();
        }
      }, 500);
    } else {
      // Validate geofence cross simulation
      if (simulationPattern === 'geofence_cross') {
        if (simulationGeofences.length === 0) {
          Alert.alert(
            'No Geofences Available',
            'You need to link at least one geofence to this tracker for geofence crossing simulation.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Manage Geofences', 
                onPress: () => navigation.navigate('TrackerGeofences', { trackerId }) 
              }
            ]
          );
          return;
        }
        
        if (!selectedGeofence) {
          Alert.alert('Error', 'Please select a geofence for crossing simulation.');
          return;
        }
      }
      
      // Before starting, make sure location history is visible for standard patterns
      if (simulationPattern !== 'geofence_cross' && !showLocationHistory) {
        setShowLocationHistory(true);
      }
      
      // Show geofences for geofence cross simulation
      if (simulationPattern === 'geofence_cross' && !showGeofences) {
        setShowGeofences(true);
      }
      
      // First fit to markers to get a good view of the simulation area
      if (mapRef.current && tracker.lastSeen) {
        mapRef.current.animateToRegion({
          latitude: tracker.lastSeen.latitude,
          longitude: tracker.lastSeen.longitude,
          // Use a wider view for simulation so user can see movement
          latitudeDelta: simulationPattern === 'geofence_cross' && selectedGeofence 
            ? Math.max(0.01, selectedGeofence.radius / 2500) 
            : 0.01,
          longitudeDelta: simulationPattern === 'geofence_cross' && selectedGeofence 
            ? Math.max(0.01, selectedGeofence.radius / 2500) 
            : 0.01,
        }, 500);
      }
      
      // Then update UI state
      setIsSimulating(true);
      
      // Short delay before starting simulation to let UI updates complete
      setTimeout(() => {
        if (simulationPattern === 'geofence_cross' && selectedGeofence) {
          // Stop any existing TrackerContext simulation first
          stopTrackerSimulation(trackerId);
          
          // Use utils simulation for geofence crossing
          const trackerLocation: LocationPoint = tracker.lastSeen || {
            latitude: region.latitude,
            longitude: region.longitude,
            timestamp: Date.now(),
          };
          
          console.log('Starting geofence cross simulation with geofence:', selectedGeofence.name);
          
          startGeofenceCrossingSimulation(
            trackerId,
            trackerLocation,
            selectedGeofence,
            async (location) => {
              // This callback will be called with each location update
              // We need to update the tracker location in Redux store
              console.log('Geofence simulation update:', location.latitude, location.longitude);
              try {
                await moveVirtualTracker(trackerId, location);
              } catch (error) {
                console.error('Error updating tracker location during geofence simulation:', error);
              }
            }
          );
        } else {
          // Stop any existing utils simulation first
          stopUtilsSimulation(trackerId);
          
          // Use TrackerContext simulation for regular patterns
          startTrackerSimulation(trackerId, simulationPattern);
        }
      }, 300);
    }
  };

  const handleChangeSimulationPattern = (pattern: 'random' | 'circle' | 'line' | 'geofence_cross') => {
    if (!tracker) return;
    setSimulationPattern(pattern);
    if (isSimulating) {
      // Stop current simulation
      stopTrackerSimulation(trackerId);
      stopUtilsSimulation(trackerId);
      
      // Start new simulation with new pattern
      setTimeout(() => {
        if (pattern === 'geofence_cross' && selectedGeofence) {
          // Stop any existing TrackerContext simulation first
          stopTrackerSimulation(trackerId);
          
          const trackerLocation: LocationPoint = tracker.lastSeen || {
            latitude: region.latitude,
            longitude: region.longitude,
            timestamp: Date.now(),
          };
          
          console.log('Changing to geofence cross simulation with geofence:', selectedGeofence.name);
          
          startGeofenceCrossingSimulation(
            trackerId,
            trackerLocation,
            selectedGeofence,
            async (location) => {
              // Location updates for geofence simulation
              console.log('Geofence simulation pattern change update:', location.latitude, location.longitude);
              try {
                await moveVirtualTracker(trackerId, location);
              } catch (error) {
                console.error('Error updating tracker location during geofence simulation:', error);
              }
            }
          );
        } else if (pattern !== 'geofence_cross') {
          // Stop any existing utils simulation first
          stopUtilsSimulation(trackerId);
          
          startTrackerSimulation(trackerId, pattern);
        }
      }, 100);
    }
  };

  const handleSimulateAlert = async () => {
    if (!tracker) return;
    try {
      await simulateLeftBehindAlert(trackerId, tracker.name);
      Alert.alert('Alert Simulated', 'A "Left Behind" alert has been created for this tracker');
    } catch (error) {
      Alert.alert('Error', 'Failed to simulate alert');
    }
  };

  const zoomToFitMarkers = () => {
    console.log('zoomToFitMarkers called');
    if (!tracker) {
      console.warn('zoomToFitMarkers: No tracker available');
      return;
    }
    
    if (!mapRef.current) {
      console.warn('zoomToFitMarkers: mapRef.current is null');
      return;
    }
    
    // First try to fit to all points if we have location history
    if (tracker.locationHistory && tracker.locationHistory.length > 0) {
      const points = [...tracker.locationHistory];
      if (tracker.lastSeen) {
        points.push(tracker.lastSeen); // Include current location
      }

      if (points.length > 0) {
        console.log(`zoomToFitMarkers: Fitting to ${points.length} coordinates`);
        try {
          mapRef.current.fitToCoordinates(
            points.map(point => ({
              latitude: Number(point.latitude),
              longitude: Number(point.longitude),
            })),
            {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            }
          );
        } catch (error) {
          console.error('Error in fitToCoordinates:', error);
        }
      }
    } 
    // If no history or fitToCoordinates failed, just animate to current location
    else if (tracker.lastSeen) {
      console.log('zoomToFitMarkers: Animating to single coordinate', 
        tracker.lastSeen.latitude, tracker.lastSeen.longitude);
      
      try {
        mapRef.current.animateToRegion({
          latitude: Number(tracker.lastSeen.latitude),
          longitude: Number(tracker.lastSeen.longitude),
          latitudeDelta: 0.005, // Zoom in a bit closer for a single point
          longitudeDelta: 0.005,
        }, 500);
      } catch (error) {
        console.error('Error in animateToRegion:', error);
        
        // As a last resort, try to set the region directly
        setRegion({
          latitude: Number(tracker.lastSeen.latitude),
          longitude: Number(tracker.lastSeen.longitude),
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    } else {
      console.warn('zoomToFitMarkers: No lastSeen coordinates available');
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

  // Simplified logging before rendering
  const logInfo = () => {
    if (process.env.NODE_ENV === 'development' && false) { // Set to true to enable detailed map logs
      console.log(`TrackerDetailScreen - Region: ${JSON.stringify(region)}`);
      if (tracker?.lastSeen) {
        console.log(`TrackerDetailScreen - Marker at: ${tracker.lastSeen.latitude}, ${tracker.lastSeen.longitude}`);
      }
    }
  }
  
  logInfo();

  if (!tracker) { // This check handles the case where tracker might be undefined initially
    return (
      <SafeAreaView style={styles.container} edges={['right', 'left']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Loading tracker data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView>
      <View style={styles.mapContainer}>
      {tracker && tracker.lastSeen ? ( // Ensure tracker and lastSeen are present
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            // Only control the region prop when not in simulation mode
            // This prevents the map from resetting its view during simulation
            region={!isSimulating ? region : undefined}
            onMapReady={() => {
              if (process.env.NODE_ENV === 'development') {
                console.log("Map ready for tracker:", tracker.name);
              }
              // Force a fit to marker on map ready
              setTimeout(() => {
                if (mapRef.current && tracker.lastSeen) {
                  mapRef.current.animateToRegion({
                    latitude: tracker.lastSeen.latitude,
                    longitude: tracker.lastSeen.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }, 500);
                }
              }, 500);
            }}
            mapPadding={{top: 0, right: 0, bottom: 0, left: 0}}
            // Don't force re-renders during simulation by changing the key
            key={isSimulating ? `map-fixed-${trackerId}` : `map-${trackerId}-${tracker.lastSeen.timestamp}`}
            // Allow user to pan and zoom during simulation
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={true}
          >
            {/* ORIGINAL MARKER WITH TRACKER DATA - MAIN MARKER */}
            <Marker
              // Don't change the key during simulation to prevent marker redraws
              key={isSimulating ? `tracker-${trackerId}` : `tracker-${trackerId}-${tracker.lastSeen.timestamp}`}
              coordinate={{
                latitude: Number(tracker.lastSeen.latitude), 
                longitude: Number(tracker.lastSeen.longitude),
              }}
              title={tracker.name}
              description={`Last seen: ${formatTimestamp(tracker.lastSeen.timestamp)}`}
              pinColor={tracker.type === 'physical' ? '#007AFF' : '#FF9500'}
              zIndex={5}
              // If Android has issues, try enabling this
              // tracksViewChanges={false}
            />

            {showLocationHistory && tracker.locationHistory && tracker.locationHistory.length > 1 && (
              <>
                <Polyline
                  // Use a static key during simulation to prevent complete redraws
                  key={isSimulating ? `polyline-${trackerId}` : `polyline-${trackerId}-${tracker.locationHistory.length}`}
                  coordinates={tracker.locationHistory.map(point => ({
                    latitude: Number(point.latitude),
                    longitude: Number(point.longitude),
                  }))}
                  strokeColor="#007AFF"
                  strokeWidth={3}
                />
                {/* Only show history markers when not simulating to reduce visual noise and improve performance */}
                {!isSimulating && tracker.locationHistory.map((point, index) => (
                  (index > 0 && index < tracker.locationHistory.length - 1 && index % 3 === 0) && (
                    <Marker
                      key={`history-${tracker.id}-${point.timestamp}-${index}`}
                      coordinate={{
                        latitude: Number(point.latitude),
                        longitude: Number(point.longitude),
                      }}
                      title={`Location History`}
                      description={`${formatTimestamp(point.timestamp)}`}
                      pinColor="gray"
                      opacity={0.7}
                    />
                  )
                ))}
              </>
            )}

            {/* Display geofences when enabled */}
            {showGeofences && simulationGeofences
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
              />
            ))}
              </MapView>

              <View style={styles.mapControls}>
                <TouchableOpacity
                  style={styles.mapControlButton}
                  onPress={() => setShowLocationHistory(!showLocationHistory)}
                >
                  <Ionicons
                    name={showLocationHistory ? 'trail-sign' : 'trail-sign-outline'}
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.mapControlText}>
                    {showLocationHistory ? 'Hide History' : 'Show History'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mapControlButton}
                  onPress={() => setShowGeofences(!showGeofences)}
                >
                  <Ionicons
                    name={showGeofences ? 'location' : 'location-outline'}
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.mapControlText}>
                    {showGeofences ? 'Hide Geofences' : 'Show Geofences'}
                  </Text>
                </TouchableOpacity>

                {((showLocationHistory && tracker.locationHistory && tracker.locationHistory.length > 0) || tracker.lastSeen) && (
                  <TouchableOpacity
                    style={styles.mapControlButton}
                    onPress={zoomToFitMarkers}
                  >
                    <Ionicons name="expand-outline" size={20} color="#007AFF" />
                    <Text style={styles.mapControlText}>Fit View</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <View style={styles.centeredMessage}>
              {(() => {
                console.log('TrackerDetailScreen - NOT rendering MapView because tracker or tracker.lastSeen is missing.');
                return null;
              })()}              <Ionicons name="map-outline" size={48} color="#ccc" />
              <Text style={styles.centeredMessageText}>
                {tracker ? 'Location data not yet available.' : 'Tracker data loading...'}
              </Text>
            </View>
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
                        : tracker.batteryLevel // Handle case where batteryLevel might be 0 or null
                        ? '#F44336'
                        : '#555' // Default color if unknown
                    }
                  ]}>
                    {tracker.batteryLevel !== undefined && tracker.batteryLevel !== null ? `${tracker.batteryLevel}%` : 'Unknown'}
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
                    <Text style={[styles.detailValue, styles.deviceIdText]}>{tracker.bleId}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.pairDeviceButton}
                  onPress={() => {
                    // Show options to choose BLE or manual pairing
                    Alert.alert(
                      'Pairing Method',
                      'Choose how to pair this tracker with a physical device',
                      [
                        {
                          text: 'Bluetooth Pairing',
                          onPress: () => navigation.navigate('PairDevice', { trackerId: tracker.id })
                        },
                        {
                          text: 'Manual Pairing',
                          onPress: () => navigation.navigate('SimplePairDevice', { trackerId: tracker.id })
                        },
                        {
                          text: 'Cancel',
                          style: 'cancel'
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="bluetooth" size={20} color="#fff" />
                  <Text style={styles.pairDeviceButtonText}>
                    {tracker.connectionStatus === 'connected' ? 'Reconfigure Device' : 'Pair Physical Device'}
                  </Text>
                </TouchableOpacity>
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
              {/* Pattern Buttons */}
              {(['random', 'circle', 'line', 'geofence_cross'] as const).map((pattern) => (
                <TouchableOpacity
                  key={pattern}
                  style={[
                    styles.patternButton,
                    simulationPattern === pattern && styles.patternButtonActive,
                  ]}
                  onPress={() => handleChangeSimulationPattern(pattern)}
                  disabled={loading}
                >
                  <Ionicons
                    name={
                      pattern === 'random' ? 'shuffle' :
                      pattern === 'circle' ? 'ellipse-outline' :
                      pattern === 'line' ? 'trending-up-outline' :
                      'map-outline'
                    }
                    size={16}
                    color={simulationPattern === pattern ? '#fff' : '#007AFF'}
                  />
                  <Text
                    style={[
                      styles.patternButtonText,
                      simulationPattern === pattern && styles.patternButtonTextActive,
                    ]}
                  >
                    {pattern === 'geofence_cross' ? 'Geofence Cross' : pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Geofence Selection for Geofence Cross Pattern */}
            {simulationPattern === 'geofence_cross' && (
              <View style={styles.geofenceSelector}>
                <Text style={styles.geofenceSelectorLabel}>Select Geofence to Cross:</Text>
                {simulationGeofences.length > 0 ? (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.geofenceScrollView}
                  >
                    {simulationGeofences.map((geofence) => (
                      <TouchableOpacity
                        key={geofence.id}
                        style={[
                          styles.geofenceButton,
                          selectedGeofence?.id === geofence.id && styles.geofenceButtonSelected,
                        ]}
                        onPress={() => setSelectedGeofence(geofence)}
                      >
                        <Text
                          style={[
                            styles.geofenceButtonText,
                            selectedGeofence?.id === geofence.id && styles.geofenceButtonTextSelected,
                          ]}
                        >
                          {geofence.name}
                        </Text>
                        <Text style={[
                          styles.geofenceButtonRadius,
                          selectedGeofence?.id === geofence.id && styles.geofenceButtonRadiusSelected
                        ]}>
                          {Math.round(geofence.radius)}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noGeofencesContainer}>
                    <Text style={styles.noGeofencesText}>
                      No geofences linked to this tracker.
                    </Text>
                    <TouchableOpacity
                      style={styles.addGeofenceButton}
                      onPress={() => navigation.navigate('TrackerGeofences', { trackerId })}
                    >
                      <Ionicons name="add" size={16} color="#007AFF" />
                      <Text style={styles.addGeofenceButtonText}>Add Geofences</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
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
            <TouchableOpacity
              style={styles.lostButton}
              onPress={() => markTrackerAsLost(trackerId)}
              disabled={loading}
            >
              <Ionicons name="alert-circle" size={24} color="#fff" />
              <Text style={styles.simulationButtonText}>
                Mark as Lost
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Advanced Alerts Section */}
        <View style={advancedAlertStyles.advancedAlertSection}>
          <Text style={styles.sectionTitle}>Advanced Alerts</Text>
          
          <TouchableOpacity 
            style={advancedAlertStyles.alertTypeButton}
            onPress={() => navigation.navigate('TrackerGeofences', { trackerId: tracker.id })}
          >
            <Ionicons name="map-outline" size={24} color="#007AFF" />
            <View style={advancedAlertStyles.alertTypeInfo}>
              <Text style={advancedAlertStyles.alertTypeName}>Geofence Alerts</Text>
              <Text style={advancedAlertStyles.alertTypeDesc}>
                Get notified when the tracker enters or exits specific areas
              </Text>
            </View>
            <Text style={advancedAlertStyles.alertCount}>{linkedGeofences.length}</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={advancedAlertStyles.alertTypeButton}
            onPress={() => navigation.navigate('TrackerScheduledAlerts', { trackerId: tracker.id })}
          >
            <Ionicons name="time-outline" size={24} color="#FF9500" />
            <View style={advancedAlertStyles.alertTypeInfo}>
              <Text style={advancedAlertStyles.alertTypeName}>Scheduled Alerts</Text>
              <Text style={advancedAlertStyles.alertTypeDesc}>
                Time-based reminders and notifications
              </Text>
            </View>
            <Text style={advancedAlertStyles.alertCount}>{scheduledAlerts.length}</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9', // Match screen background
    padding: 20,
  },
  mapContainer: {
    height: 300, // Fixed height instead of percentage
    width: '100%',
    marginBottom: 16,
    backgroundColor: 'lightgreen', // Debug color
    borderWidth: 2,
    borderColor: 'red',
    overflow: 'hidden', // Ensure content doesn't spill out
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1, // Ensure map has a defined z-index
    width: '100%',
    height: '100%',
  },
  centeredMessage: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centeredMessageText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  mapControls: {
    position: 'absolute',
    bottom: 10, // Adjusted for better spacing
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Evenly space buttons
    zIndex: 1, // Ensure controls are above the map
  },
  mapControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    marginHorizontal: 2, // Smaller margin since we have 3 buttons now
  },
  mapControlText: {
    marginLeft: 4,
    fontSize: 12, // Smaller text for 3 buttons
    color: '#007AFF',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16, // Add margin at the bottom
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
    marginLeft: 6,
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
    alignItems: 'center', // Align items vertically
    marginBottom: 10, // Increased spacing
    paddingVertical: 4, // Add some vertical padding
  },
  detailLabel: {
    fontSize: 15, // Slightly adjusted
    color: '#555',
    flex: 1, // Allow label to take space
  },
  detailValue: {
    fontSize: 15, // Slightly adjusted
    fontWeight: '500',
    color: '#333',
    flexShrink: 1, // Allow value to shrink if needed
    textAlign: 'right', // Align value to the right
  },
  deviceIdText: {
    fontSize: 13, // Smaller for potentially long IDs
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Monospace for IDs
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8, // Add margin top
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
    margin: 16, // Consistent margin
    marginTop: 0, // Remove top margin if it's directly after infoSection
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
    textAlign: 'center', // Center title
  },
  simulationPatterns: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Better distribution
    marginBottom: 20, // Increased spacing
  },
  patternButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, 
    paddingHorizontal: 6, // Smaller padding for 4 buttons
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 2, // Smaller margin for 4 buttons
  },
  patternButtonActive: {
    backgroundColor: '#007AFF',
  },
  patternButtonText: {
    fontSize: 11, // Smaller for 4 buttons
    color: '#007AFF',
    marginLeft: 4, // Space from icon
    fontWeight: '500',
  },
  patternButtonTextActive: {
    color: '#fff',
  },
  simulationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, // Larger touch area
    borderRadius: 8,
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#4CAF50', // Green for start
  },
  stopButton: {
    backgroundColor: '#F44336', // Red for stop
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#FF9500', // Orange for alert simulation
  },
  lostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#D32F2F', // Red for marking as lost
    marginTop: 12,
  },
  simulationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pairDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginTop: 16,
  },
  pairDeviceButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  geofenceSelector: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  geofenceSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  geofenceScrollView: {
    marginHorizontal: -4, // Offset the horizontal margin of buttons
  },
  geofenceButton: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  geofenceButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  geofenceButtonText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  geofenceButtonTextSelected: {
    color: '#fff',
  },
  geofenceButtonRadius: {
    color: '#777',
    fontSize: 11,
    marginTop: 2,
  },
  geofenceButtonRadiusSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noGeofencesContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noGeofencesText: {
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  addGeofenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addGeofenceButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
});

// Add additional styles for advanced alerts
const advancedAlertStyles = StyleSheet.create({
  advancedAlertSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  alertTypeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  alertTypeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  alertTypeDesc: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  alertCount: {
    backgroundColor: '#EEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 14,
    color: '#555',
    marginRight: 8,
  },
});

export default TrackerDetailScreen;