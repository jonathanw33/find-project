import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { setSelectedTracker } from '../../redux/slices/trackerSlice';
import { useTracker } from '../../context/TrackerContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TrackerInfoCard from '../../components/TrackerInfoCard';

type NavigationProp = StackNavigationProp<MainStackParamList>;

const initialRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const MapScreen: React.FC = () => {
  const [region, setRegion] = useState<Region>(initialRegion);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);
  const { trackers, selectedTrackerId } = useSelector((state: RootState) => state.trackers);
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { createVirtualTracker, selectTracker, getCurrentUserLocation } = useTracker();

  useEffect(() => {
    const getLocation = async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'FIND needs location permissions to track your items.'
          );
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        // If we have a selected tracker, focus the map on it
        if (selectedTrackerId && trackers[selectedTrackerId]?.lastSeen) {
          const tracker = trackers[selectedTrackerId];
          if (tracker.lastSeen) {
            setRegion({
              latitude: tracker.lastSeen.latitude,
              longitude: tracker.lastSeen.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Location Error', 'Could not get your current location');
      } finally {
        setLoading(false);
      }
    };

    // Debug trackers in the Redux store
    console.log("Current trackers in MapScreen:", Object.values(trackers));

    getLocation();

    // Set up location subscription
    const locationSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10, // Update if user moves 10 meters
      },
      (location) => {
        setUserLocation(location);
      }
    );

    return () => {
      // Clean up subscription
      locationSubscription.then((sub) => sub.remove());
    };
  }, [selectedTrackerId, trackers]);

  const handleMarkerPress = (trackerId: string) => {
    dispatch(setSelectedTracker(trackerId));
  };

  const handleAddVirtualTracker = async () => {
    try {
      const location = await getCurrentUserLocation();
      navigation.navigate('AddTracker');
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location');
    }
  };

  const handleMyLocationPress = async () => {
    try {
      const location = await getCurrentUserLocation();
      
      if (location && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location');
    }
  };

  const closeTrackerInfo = () => {
    dispatch(setSelectedTracker(null));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          region={region}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          showsScale
          onRegionChangeComplete={setRegion}
        >
          {Object.values(trackers).map((tracker) => (
            tracker.lastSeen && (
              <Marker
                key={tracker.id}
                coordinate={{
                  latitude: tracker.lastSeen.latitude,
                  longitude: tracker.lastSeen.longitude,
                }}
                title={tracker.name}
                description={`Last seen: ${new Date(tracker.lastSeen.timestamp).toLocaleString()}`}
                onPress={() => handleMarkerPress(tracker.id)}
                pinColor={tracker.type === 'physical' ? '#007AFF' : '#FF9500'}
              />
            )
          ))}
        </MapView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.myLocationButton}
            onPress={handleMyLocationPress}
          >
            <Ionicons name="locate" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddVirtualTracker}
          >
            <Ionicons name="add" size={30} color="#FFF" />
          </TouchableOpacity>
        </View>

        {selectedTrackerId && trackers[selectedTrackerId] && (
          <View style={styles.trackerInfoContainer}>
            <TrackerInfoCard
              tracker={trackers[selectedTrackerId]}
              onClose={closeTrackerInfo}
              onViewDetails={() => navigation.navigate('TrackerDetail', { trackerId: selectedTrackerId })}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  myLocationButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  trackerInfoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    padding: 10,
  },
});

export default MapScreen;