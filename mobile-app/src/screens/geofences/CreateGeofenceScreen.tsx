import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  // Dimensions, // Not used, can be removed
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation'; // Assuming this path is correct
import { useGeofence } from '../../context/GeofenceContext'; // Assuming this path is correct
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import MapEvent from 'react-native-maps';import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';

// Define more specific route param types for better type safety
type CreateGeofenceRouteParams = MainStackParamList['CreateGeofence']; // Assuming undefined if no params
type EditGeofenceRouteParams = MainStackParamList['EditGeofence'];   // Assuming { geofenceId: string }

type CreateScreenRouteProp = RouteProp<MainStackParamList, 'CreateGeofence'>;
type EditScreenRouteProp = RouteProp<MainStackParamList, 'EditGeofence'>;

// Navigation prop type
type NavigationProp = StackNavigationProp<MainStackParamList, 'CreateGeofence' | 'EditGeofence'>;


const CreateGeofenceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreateScreenRouteProp | EditScreenRouteProp>();
  const { createGeofence, updateGeofence, geofences } = useGeofence();

  const isEditing = route.name === 'EditGeofence';
  let geofenceIdToEdit: string | null = null;

  if (isEditing) {
    // Type assertion for route.params when editing
    geofenceIdToEdit = (route.params as EditGeofenceRouteParams).geofenceId;
  }

  const existingGeofence = isEditing && geofenceIdToEdit ? geofences.find(g => g.id === geofenceIdToEdit) : null;

  const [name, setName] = useState(existingGeofence?.name || '');
  const [description, setDescription] = useState(existingGeofence?.description || '');
  const [center, setCenter] = useState({
    latitude: existingGeofence?.centerLatitude || 37.77492, // Default to SF
    longitude: existingGeofence?.centerLongitude || -122.41941, // Default to SF
  });
  const [radius, setRadius] = useState(existingGeofence?.radius || 100); // Default radius 100m
  const [isActive, setIsActive] = useState(existingGeofence ? existingGeofence.isActive : true); // Default to true for new
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!isEditing) {
      getCurrentLocation();
    } else if (existingGeofence && mapRef.current) {
        // If editing, animate map to existing geofence location
        mapRef.current.animateToRegion({
            latitude: existingGeofence.centerLatitude,
            longitude: existingGeofence.centerLongitude,
            latitudeDelta: 0.01 * (existingGeofence.radius / 100), // Adjust delta based on radius
            longitudeDelta: 0.01 * (existingGeofence.radius / 100),
        }, 500);
    }

    navigation.setOptions({
      title: isEditing ? 'Edit Geofence' : 'Create Geofence',
    });
  }, [isEditing, navigation]); // Added dependencies

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to set the geofence at your current location.'
        );
        return; // Keep setLoadingLocation true until user grants or denies again
      }

      const location = await Location.getCurrentPositionAsync({});
      const newCenter = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCenter(newCenter);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newCenter,
          latitudeDelta: 0.01, // Standard zoom for current location
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location. Please ensure location services are enabled.');
      console.error("Error getting current location:", error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleMapPress = (event: MapEvent) => { // Typed event
    const newCenter = event.nativeEvent.coordinate;
    setCenter(newCenter);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a name for this geofence.');
      return;
    }

    if (radius < 25) {
      Alert.alert('Validation Error', 'Radius must be at least 25 meters.');
      return;
    }

    setLoading(true);
    try {
      const geofenceData = {
        name: name.trim(),
        description: description.trim() || undefined, // Send undefined if empty
        centerLatitude: center.latitude,
        centerLongitude: center.longitude,
        radius,
        isActive,
      };

      if (isEditing && geofenceIdToEdit) {
        await updateGeofence(geofenceIdToEdit, geofenceData);
        Alert.alert('Success', 'Geofence updated successfully!');
      } else {
        await createGeofence(geofenceData);
        Alert.alert('Success', 'Geofence created successfully!');
      }
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save geofence:', err);
      Alert.alert('Error', 'Could not save geofence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView
        style={styles.scrollContainer} // Added for clarity, can be same as container if no specific scroll styling needed
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: center.latitude,
              longitude: center.longitude,
              latitudeDelta: 0.02 * (radius / 100), // Initial zoom based on radius
              longitudeDelta: 0.02 * (radius / 100),
            }}
            onPress={handleMapPress}
            showsUserLocation={true} // Shows the blue dot for user's current location
            // provider={MapView.PROVIDER_GOOGLE} // Uncomment if you want to force Google Maps and have it configured
          >
            <Marker
              coordinate={center}
              draggable
              onDragEnd={(e) => setCenter(e.nativeEvent.coordinate)}
              pinColor="red" // Make marker distinct
            />
            <Circle
              center={center}
              radius={radius}
              strokeColor="rgba(0, 122, 255, 0.7)"
              fillColor="rgba(0, 122, 255, 0.3)"
            />
          </MapView>
          {(loadingLocation && !isEditing) && (
            <View style={styles.loadingMapOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Fetching current location...</Text>
            </View>
          )}
          <TouchableOpacity style={styles.locateButton} onPress={getCurrentLocation} disabled={loadingLocation}>
            {loadingLocation ? (
                <ActivityIndicator size="small" color="#007AFF" />
            ) : (
                <Ionicons name="locate-outline" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name*</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Home, Work, Gym"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Notify when near office"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Radius</Text>
              <Text style={styles.radiusValue}>{Math.round(radius)} meters</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={25} // Min radius 25m
              maximumValue={5000} // Max radius 5km
              step={25}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#D1D1D6"
              thumbTintColor="#007AFF"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>25m</Text>
              <Text style={styles.sliderLabelText}>5km</Text>
            </View>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#E9E9EA', true: '#81b0ff' }} // Standard iOS colors
              thumbColor={isActive ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#E9E9EA"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name={isEditing ? "checkmark-circle-outline" : "add-circle-outline"} size={22} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Geofence' : 'Create Geofence'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F7', // Light gray background
  },
  scrollContainer: { // Added for potential distinct scroll styling
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32, // Ensure space for save button
  },
  mapContainer: {
    height: 280, // Increased height slightly
    borderRadius: 12,
    overflow: 'hidden', // Important for borderRadius on MapView
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DDD', // Subtle border
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingMapOverlay: { // For loading indicator on map
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent overlay
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  locateButton: {
    position: 'absolute',
    bottom: 12, // Adjusted position
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white
    width: 48, // Increased tap target
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20, // Increased padding
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20, // Increased spacing
  },
  label: {
    fontSize: 16,
    fontWeight: '600', // Slightly bolder
    color: '#444', // Darker gray
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // Spacing for slider
  },
  radiusValue: {
    fontSize: 15, // Slightly smaller
    fontWeight: '500',
    color: '#007AFF',
  },
  input: {
    backgroundColor: '#F7F7F7', // Lighter input background
    borderRadius: 8,
    paddingHorizontal: 15, // Increased padding
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0', // Subtle border
  },
  textArea: {
    height: 90, // Slightly taller
    textAlignVertical: 'top', // Important for multiline
  },
  slider: {
    width: '100%',
    height: 40, // Standard slider height
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4, // Align with slider track
    marginTop: 4,
  },
  sliderLabelText: { // Changed from sliderLabel to avoid conflict with label style
    fontSize: 13,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12, // Added padding
    borderTopWidth: 1, // Separator line
    borderTopColor: '#EFEFF4',
    marginTop: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10, // Slightly more rounded
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15, // Increased padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#A9CEF5', // Lighter blue when disabled
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17, // Slightly larger
    fontWeight: '600',
  },
});

export default CreateGeofenceScreen;