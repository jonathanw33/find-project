import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { useGeofence } from '../../context/GeofenceContext';
import { Geofence } from '../../services/geofence/geofenceService';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = StackNavigationProp<MainStackParamList, 'Geofences'>;

const GeofencesScreen: React.FC = () => {
  const { geofences, loading, error, deleteGeofence } = useGeofence();
  const navigation = useNavigation<NavigationProp>();

  const handleAddGeofence = () => {
    navigation.navigate('CreateGeofence');
  };

  const handleEditGeofence = (geofence: Geofence) => {
    navigation.navigate('EditGeofence', { geofenceId: geofence.id });
  };

  const handleDeleteGeofence = (geofence: Geofence) => {
    Alert.alert(
      'Delete Geofence',
      `Are you sure you want to delete "${geofence.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGeofence(geofence.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete geofence');
            }
          },
        },
      ]
    );
  };

  const renderGeofenceItem = ({ item }: { item: Geofence }) => (
    <TouchableOpacity
      style={styles.geofenceItem}
      onPress={() => handleEditGeofence(item)}
    >
      <View style={styles.geofenceInfo}>
        <View style={styles.geofenceTitleRow}>
          <Text style={styles.geofenceName}>{item.name}</Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: item.isActive ? '#4CAF50' : '#F44336' }
          ]} />
        </View>
        {item.description && (
          <Text style={styles.geofenceDescription}>{item.description}</Text>
        )}
        <Text style={styles.geofenceDetails}>
          {`Radius: ${Math.round(item.radius)}m • Created: ${new Date(item.createdAt).toLocaleDateString()}`}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteGeofence(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );  if (loading) {
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
        data={geofences}
        renderItem={renderGeofenceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No geofences yet</Text>
            <Text style={styles.emptySubText}>
              Create geofences to get alerts when your trackers enter or exit specific areas.
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
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding at bottom for FAB
  },
  geofenceItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },  geofenceInfo: {
    flex: 1,
  },
  geofenceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  geofenceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  geofenceDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  geofenceDetails: {
    fontSize: 12,
    color: '#777',
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
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

export default GeofencesScreen;