import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { useGeofence } from '../../context/GeofenceContext';
import { Geofence } from '../../services/geofence/geofenceService';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = StackNavigationProp<MainStackParamList, 'SelectGeofence'>;
type RouteProps = RouteProp<MainStackParamList, 'SelectGeofence'>;

interface GeofenceWithAlerts extends Geofence {
  alertOnEnter: boolean;
  alertOnExit: boolean;
}

const SelectGeofenceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { trackerId, availableGeofences } = route.params;
  const { linkTrackerToGeofence, loading } = useGeofence();
  
  const [selectedGeofences, setSelectedGeofences] = useState<GeofenceWithAlerts[]>([]);
  
  const toggleGeofence = (geofence: Geofence) => {
    const index = selectedGeofences.findIndex(g => g.id === geofence.id);
    
    if (index !== -1) {
      // Remove from selected
      setSelectedGeofences(prev => prev.filter(g => g.id !== geofence.id));
    } else {
      // Add to selected with default alert settings
      setSelectedGeofences(prev => [
        ...prev, 
        { 
          ...geofence, 
          alertOnEnter: true, 
          alertOnExit: false 
        }
      ]);
    }
  };
  
  const updateAlertSettings = (geofenceId: string, alertOnEnter: boolean, alertOnExit: boolean) => {
    setSelectedGeofences(prev => 
      prev.map(g => 
        g.id === geofenceId ? { ...g, alertOnEnter, alertOnExit } : g
      )
    );
  };
  
  const handleSave = async () => {
    if (selectedGeofences.length === 0) {
      Alert.alert('Error', 'Please select at least one geofence');
      return;
    }
    
    try {
      // Link all selected geofences to the tracker
      for (const geofence of selectedGeofences) {
        await linkTrackerToGeofence(
          trackerId,
          geofence.id,
          geofence.alertOnEnter,
          geofence.alertOnExit
        );
      }
      
      Alert.alert(
        'Success',
        'Geofences successfully linked to tracker',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('Error linking geofences:', error);
      Alert.alert('Error', 'Failed to link geofences to tracker');
    }
  };  const renderGeofenceItem = ({ item }: { item: Geofence }) => {
    const isSelected = selectedGeofences.some(g => g.id === item.id);
    const selectedGeofence = selectedGeofences.find(g => g.id === item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.geofenceItem,
          isSelected && styles.selectedGeofenceItem
        ]}
        onPress={() => toggleGeofence(item)}
      >
        <View style={styles.geofenceHeader}>
          <Text style={styles.geofenceName}>{item.name}</Text>
          <Ionicons
            name={isSelected ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={isSelected ? "#4CAF50" : "#999"}
          />
        </View>
        
        {item.description && (
          <Text style={styles.geofenceDescription}>{item.description}</Text>
        )}
        
        <Text style={styles.geofenceDetails}>
          {`Radius: ${Math.round(item.radius)}m`}
        </Text>
        
        {isSelected && (
          <View style={styles.alertSettings}>
            <View style={styles.alertOption}>
              <Text style={styles.alertOptionText}>Alert when entering</Text>
              <Switch
                value={selectedGeofence!.alertOnEnter}
                onValueChange={(value) => 
                  updateAlertSettings(
                    item.id,
                    value,
                    selectedGeofence!.alertOnExit
                  )
                }
                trackColor={{ false: '#ccc', true: '#bbd6fe' }}
                thumbColor={selectedGeofence!.alertOnEnter ? '#007AFF' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.alertOption}>
              <Text style={styles.alertOptionText}>Alert when exiting</Text>
              <Switch
                value={selectedGeofence!.alertOnExit}
                onValueChange={(value) => 
                  updateAlertSettings(
                    item.id,
                    selectedGeofence!.alertOnEnter,
                    value
                  )
                }
                trackColor={{ false: '#ccc', true: '#bbd6fe' }}
                thumbColor={selectedGeofence!.alertOnExit ? '#007AFF' : '#f4f3f4'}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Linking geofences...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <FlatList
        data={availableGeofences}
        renderItem={renderGeofenceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No geofences available</Text>
            <Text style={styles.emptySubText}>
              Create geofences first, then link them to this tracker.
            </Text>
          </View>
        }
      />
      
      {selectedGeofences.length > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedCount}>
            {selectedGeofences.length} geofence{selectedGeofences.length !== 1 ? 's' : ''} selected
          </Text>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark" size={24} color="#FFF" />
            <Text style={styles.saveButtonText}>Link Geofences</Text>
          </TouchableOpacity>
        </View>
      )}
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
  },  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding at bottom for bottom bar
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedGeofenceItem: {
    borderColor: '#007AFF',
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
    marginTop: 8,
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
  emptyContainer: {
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
  },  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SelectGeofenceScreen;