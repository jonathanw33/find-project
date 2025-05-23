import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { useGeofence } from '../../context/GeofenceContext';
import { Geofence } from '../../services/geofence/geofenceService';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = StackNavigationProp<MainStackParamList, 'TrackerGeofences'>;
type RouteProps = RouteProp<MainStackParamList, 'TrackerGeofences'>;

interface TrackerGeofenceProps {
  geofence: Geofence;
  alertOnEnter: boolean;
  alertOnExit: boolean;
}

const TrackerGeofencesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { trackerId } = route.params;
  
  const { getLinkedGeofences, geofences, linkTrackerToGeofence, unlinkTrackerFromGeofence, updateTrackerGeofence, loading, error } = useGeofence();
  
  const [linkedGeofences, setLinkedGeofences] = useState<TrackerGeofenceProps[]>([]);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isInitialLoad) {
      loadLinkedGeofences();
    }
  }, [trackerId, isInitialLoad]);

  const loadLinkedGeofences = useCallback(async () => {
    if (loadingLinked) return; // Prevent multiple simultaneous calls
    
    try {
      setLoadingLinked(true);
      console.log('Loading linked geofences for tracker:', trackerId);
      
      const data = await getLinkedGeofences(trackerId);
      console.log('Loaded linked geofences:', data);
      
      const formattedData = data.map(item => ({
        geofence: {
          id: item.id,
          name: item.name,
          description: item.description,
          centerLatitude: item.centerLatitude,
          centerLongitude: item.centerLongitude,
          radius: item.radius,
          isActive: item.isActive,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
        alertOnEnter: item.alertOnEnter,
        alertOnExit: item.alertOnExit,
      }));
      
      setLinkedGeofences(formattedData);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error loading linked geofences:', error);
      if (isInitialLoad) {
        Alert.alert('Error', 'Failed to load geofences');
      }
    } finally {
      setLoadingLinked(false);
    }
  }, [trackerId, getLinkedGeofences, loadingLinked, isInitialLoad]);  const handleAddGeofence = () => {
    // First show a list of available geofences to link
    const availableGeofences = geofences.filter(
      g => !linkedGeofences.some(lg => lg.geofence.id === g.id)
    );
    
    if (availableGeofences.length === 0) {
      Alert.alert(
        'No Available Geofences',
        'All geofences are already linked to this tracker. Create a new geofence first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create New Geofence', onPress: () => navigation.navigate('CreateGeofence') }
        ]
      );
      return;
    }
    
    navigation.navigate('SelectGeofence', { 
      trackerId, 
      availableGeofences
    });
  };

  const handleUpdateAlerts = async (geofenceId: string, alertOnEnter: boolean, alertOnExit: boolean) => {
    try {
      await updateTrackerGeofence(trackerId, geofenceId, alertOnEnter, alertOnExit);
      
      // Update local state immediately for better UX
      setLinkedGeofences(prev => 
        prev.map(item => 
          item.geofence.id === geofenceId 
            ? { ...item, alertOnEnter, alertOnExit } 
            : item
        )
      );
    } catch (error) {
      console.error('Error updating alerts:', error);
      Alert.alert('Error', 'Failed to update alert settings');
    }
  };

  const handleUnlinkGeofence = async (geofenceId: string) => {
    Alert.alert(
      'Unlink Geofence',
      'Are you sure you want to unlink this geofence from the tracker?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkTrackerFromGeofence(trackerId, geofenceId);
              
              // Update local state immediately
              setLinkedGeofences(prev => 
                prev.filter(item => item.geofence.id !== geofenceId)
              );
            } catch (error) {
              console.error('Error unlinking geofence:', error);
              Alert.alert('Error', 'Failed to unlink geofence');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = useCallback(() => {
    setIsInitialLoad(true);
    loadLinkedGeofences();
  }, [loadLinkedGeofences]);  const renderGeofenceItem = ({ item }: { item: TrackerGeofenceProps }) => (
    <View style={styles.geofenceItem}>
      <View style={styles.geofenceHeader}>
        <Text style={styles.geofenceName}>{item.geofence.name}</Text>
        <TouchableOpacity
          style={styles.unlinkButton}
          onPress={() => handleUnlinkGeofence(item.geofence.id)}
        >
          <Ionicons name="close-circle" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      {item.geofence.description && (
        <Text style={styles.geofenceDescription}>{item.geofence.description}</Text>
      )}
      
      <Text style={styles.geofenceDetails}>
        {`Radius: ${Math.round(item.geofence.radius)}m`}
      </Text>
      
      <View style={styles.alertSettings}>
        <Text style={styles.alertSettingsTitle}>Alert Settings</Text>
        
        <View style={styles.alertOption}>
          <Text style={styles.alertOptionText}>Alert when entering</Text>
          <TouchableOpacity
            style={[
              styles.alertButton,
              item.alertOnEnter ? styles.alertButtonActive : null
            ]}
            onPress={() => handleUpdateAlerts(
              item.geofence.id,
              !item.alertOnEnter,
              item.alertOnExit
            )}
          >
            <Ionicons
              name={item.alertOnEnter ? "notifications" : "notifications-off"}
              size={16}
              color={item.alertOnEnter ? "white" : "#007AFF"}
            />
            <Text
              style={[
                styles.alertButtonText,
                item.alertOnEnter ? styles.alertButtonTextActive : null
              ]}
            >
              {item.alertOnEnter ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.alertOption}>
          <Text style={styles.alertOptionText}>Alert when exiting</Text>
          <TouchableOpacity
            style={[
              styles.alertButton,
              item.alertOnExit ? styles.alertButtonActive : null
            ]}
            onPress={() => handleUpdateAlerts(
              item.geofence.id,
              item.alertOnEnter,
              !item.alertOnExit
            )}
          >
            <Ionicons
              name={item.alertOnExit ? "notifications" : "notifications-off"}
              size={16}
              color={item.alertOnExit ? "white" : "#007AFF"}
            />
            <Text
              style={[
                styles.alertButtonText,
                item.alertOnExit ? styles.alertButtonTextActive : null
              ]}
            >
              {item.alertOnExit ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );  if (loadingLinked && isInitialLoad) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading geofences...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <FlatList
        data={linkedGeofences}
        renderItem={renderGeofenceItem}
        keyExtractor={(item) => item.geofence.id}
        contentContainerStyle={styles.listContent}
        refreshing={loadingLinked && !isInitialLoad}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No geofences linked</Text>
            <Text style={styles.emptySubText}>
              Link geofences to this tracker to receive alerts when it enters or exits specific areas.
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity style={styles.addButton} onPress={handleAddGeofence}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding at bottom for FAB
  },
  geofenceItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  geofenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  geofenceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unlinkButton: {
    padding: 6,
  },
  geofenceDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  geofenceDetails: {
    fontSize: 12,
    color: '#777',
    marginBottom: 16,
  },
  alertSettings: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  alertSettingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
  },
  alertOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertOptionText: {
    fontSize: 14,
    color: '#333',
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  alertButtonActive: {
    backgroundColor: '#007AFF',
  },
  alertButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  alertButtonTextActive: {
    color: '#FFFFFF',
  },  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default TrackerGeofencesScreen;