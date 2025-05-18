import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { Tracker, setSelectedTracker } from '../../redux/slices/trackerSlice';
import { useTracker } from '../../context/TrackerContext';
import { useSupabaseTrackers } from '../../hooks/useSupabaseTrackers';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = StackNavigationProp<MainStackParamList>;

const TrackerListScreen: React.FC = () => {
  const { trackers, loading, error } = useSelector((state: RootState) => state.trackers);
  const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { deleteTracker: contextDeleteTracker } = useTracker();
  const { fetchTrackers, deleteTracker: supabaseDeleteTracker } = useSupabaseTrackers();
  const [refreshing, setRefreshing] = useState(false);

  const trackersArray = Object.values(trackers);

  useEffect(() => {
    // Load trackers when the component mounts, but only if we have enough time for auth to complete
    const loadTrackers = async () => {
      try {
        await fetchTrackers();
      } catch (error) {
        console.error('Error loading trackers on mount:', error);
        // We'll handle this elsewhere
      }
    };
    
    // Delay initial load slightly to give auth a chance to complete
    const timer = setTimeout(loadTrackers, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload trackers from Supabase
      await fetchTrackers();
    } catch (error) {
      console.error('Error refreshing trackers:', error);
      // Don't show alert here, we'll handle it via the error state
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectTracker = (tracker: Tracker) => {
    dispatch(setSelectedTracker(tracker.id));
    navigation.navigate('TrackerDetail', { trackerId: tracker.id });
  };

  const handleAddTracker = () => {
    navigation.navigate('AddTracker');
  };

  const handleDeleteTracker = (tracker: Tracker) => {
    Alert.alert(
      'Delete Tracker',
      `Are you sure you want to delete "${tracker.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabaseDeleteTracker(tracker.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete tracker');
            }
          },
        },
      ]
    );
  };

  // Helper function to get appropriate icon based on tracker type and name
  const getIconName = (tracker: Tracker) => {
    if (tracker.type === 'physical') {
      return 'hardware-chip-outline';
    }
    
    // For virtual trackers, choose an icon based on the name
    const name = tracker.name.toLowerCase();
    
    if (name.includes('key') || name.includes('keys')) {
      return 'key-outline';
    } else if (name.includes('wallet') || name.includes('purse')) {
      return 'wallet-outline';
    } else if (name.includes('phone') || name.includes('mobile')) {
      return 'phone-portrait-outline';
    } else if (name.includes('laptop') || name.includes('computer')) {
      return 'laptop-outline';
    } else if (name.includes('bag') || name.includes('backpack')) {
      return 'briefcase-outline';
    } else {
      return 'cube-outline'; // Default icon
    }
  };

  const renderItem = ({ item }: { item: Tracker }) => (
    <TouchableOpacity
      style={styles.trackerItem}
      onPress={() => handleSelectTracker(item)}
    >
      <View style={styles.trackerContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: item.type === 'physical' ? '#E1F5FE' : '#FFF3E0' }
        ]}>
          <Ionicons
            name={getIconName(item)}
            size={24}
            color={item.type === 'physical' ? '#0288D1' : '#FF9800'}
          />
        </View>
        
        <View style={styles.trackerInfo}>
          <Text style={styles.trackerName}>{item.name}</Text>
          <View style={styles.statusRow}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: item.isActive ? '#4CAF50' : '#F44336' },
            ]} />
            <Text style={styles.statusText}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
            
            {item.type === 'physical' && item.connectionStatus && (
              <Text style={styles.connectionStatus}>
                • {item.connectionStatus}
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteTracker(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if ((loading || authLoading) && !refreshing && trackersArray.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {authLoading ? 'Verifying authentication...' : 'Loading trackers...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Trackers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddTracker}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {error && !error.includes('User not authenticated') && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {trackersArray.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={60} color="#CCC" />
          <Text style={styles.emptyTitle}>No Trackers Found</Text>
          <Text style={styles.emptyText}>
            You don't have any trackers yet. Add your first tracker to start keeping track of your items.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleAddTracker}
          >
            <Text style={styles.emptyButtonText}>Add Tracker</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trackersArray}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  trackerItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trackerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trackerInfo: {
    flex: 1,
  },
  trackerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  connectionStatus: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  deleteButton: {
    padding: 8,
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    padding: 15,
    margin: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB6B6',
  },
  errorText: {
    color: '#D8000C',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignSelf: 'flex-end',
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrackerListScreen;