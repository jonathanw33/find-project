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
import { theme } from '../../theme';

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
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cube-outline" size={80} color={theme.colors.gray300} />
          </View>
          <Text style={styles.emptyTitle}>No Trackers Found</Text>
          <Text style={styles.emptyText}>
            You don't have any trackers yet. Add your first tracker to start keeping track of your items.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleAddTracker}
            activeOpacity={0.8}
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.base,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  listContent: {
    padding: theme.spacing.base,
  },
  trackerItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  trackerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.base,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.base,
  },
  trackerInfo: {
    flex: 1,
  },
  trackerName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  connectionStatus: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.xs,
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: theme.spacing.base,
    margin: theme.spacing.base,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.radius.md,
    alignSelf: 'flex-end',
  },
  retryButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxxl,
  },
  emptyIconContainer: {
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    marginBottom: theme.spacing.xl,
    maxWidth: 280,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
    ...theme.shadows.sm,
  },
  emptyButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default TrackerListScreen;