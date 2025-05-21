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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation'; // Assuming this path is correct
import { useScheduledAlert } from '../../context/ScheduledAlertContext'; // Assuming this path is correct
import { ScheduledAlert } from '../../services/scheduledAlerts/scheduledAlertService'; // Assuming this path is correct
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = StackNavigationProp<MainStackParamList, 'TrackerScheduledAlerts'>;
type RouteProps = RouteProp<MainStackParamList, 'TrackerScheduledAlerts'>;

const TrackerScheduledAlertsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { trackerId } = route.params;

  const { getScheduledAlertsForTracker, deleteScheduledAlert, loading, error } = useScheduledAlert();

  const [alerts, setAlerts] = useState<ScheduledAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  useEffect(() => {
    loadScheduledAlerts();
  }, [trackerId]);

  const loadScheduledAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const data = await getScheduledAlertsForTracker(trackerId);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading scheduled alerts:', error);
      Alert.alert('Error', 'Failed to load scheduled alerts');
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleAddScheduledAlert = () => {
    navigation.navigate('CreateScheduledAlert', { trackerId });
  };

  const handleEditScheduledAlert = (alert: ScheduledAlert) => {
    navigation.navigate('EditScheduledAlert', {
      trackerId,
      alertId: alert.id
    });
  };

  const handleDeleteScheduledAlert = (alert: ScheduledAlert) => {
    Alert.alert(
      'Delete Alert',
      `Are you sure you want to delete "${alert.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScheduledAlert(alert.id);
              setAlerts(prev => prev.filter(a => a.id !== alert.id));
            } catch (error) {
              console.error('Error deleting alert:', error);
              Alert.alert('Error', 'Failed to delete alert');
            }
          },
        },
      ]
    );
  };

  const formatScheduleTime = (alert: ScheduledAlert) => {
    switch (alert.scheduleType) {
      case 'one_time':
        return `One-time: ${alert.scheduledDate || 'No date'} ${alert.scheduledTime || 'No time'}`;
      case 'daily':
        return `Daily at ${alert.scheduledTime || 'No time'}`;
      case 'weekly': {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = alert.dayOfWeek !== undefined ? days[alert.dayOfWeek] : 'Unknown day';
        return `Weekly on ${dayName} at ${alert.scheduledTime || 'No time'}`;
      }
      case 'monthly': {
        const dayOfMonth = alert.dayOfMonth !== undefined ? alert.dayOfMonth : 'Unknown day';
        return `Monthly on day ${dayOfMonth} at ${alert.scheduledTime || 'No time'}`;
      }
      default:
        return 'Unknown schedule';
    }
  };

  const renderAlertItem = ({ item }: { item: ScheduledAlert }) => (
    <TouchableOpacity
      style={styles.alertItem}
      onPress={() => handleEditScheduledAlert(item)}
    >
      <View style={styles.alertInfo}>
        <View style={styles.alertTitleRow}>
          <Text style={styles.alertTitle}>{item.title}</Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: item.isActive ? '#4CAF50' : '#F44336' }
          ]} />
        </View>
        <Text style={styles.alertMessage}>{item.message}</Text>
        <Text style={styles.alertSchedule}>{formatScheduleTime(item)}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteScheduledAlert(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading || loadingAlerts) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading scheduled alerts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Error: {typeof error === 'string' ? error : 'An unknown error occurred'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>No Scheduled Alerts</Text>
          <Text style={styles.emptySubText}>
            You haven't set up any alerts for this tracker yet. Tap the '+' button to add your first alert.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddScheduledAlert}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F7', // A slightly off-white background
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F0F7',
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
  alertItem: {
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
  },
  alertInfo: {
    flex: 1,
    marginRight: 10, // Add some space between info and delete button
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // This will push the status indicator to the right
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    // Removed marginBottom as spacing is handled by alertTitleRow
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8, // Add some space to the left of the indicator
  },
  alertMessage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  alertSchedule: {
    fontSize: 12,
    color: '#777',
  },
  deleteButton: {
    padding: 8, // Make it easier to tap
    justifyContent: 'center', // Center the icon vertically
    alignItems: 'center', // Center the icon horizontally
  },
  emptyContainer: {
    flex: 1, // Take up available space
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    // marginTop: 60, // Removed to allow flex to center it
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

export default TrackerScheduledAlertsScreen;