import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert as RNAlert,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { Alert, setAlerts } from '../../redux/slices/alertSlice';
import { useAlert } from '../../context/AlertContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = StackNavigationProp<MainStackParamList>;

const AlertsScreen: React.FC = () => {
  const { alerts, loading } = useSelector((state: RootState) => state.alerts);
  const { trackers } = useSelector((state: RootState) => state.trackers);
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { markAsRead, markAllAsRead, deleteAlert } = useAlert();
  const [refreshing, setRefreshing] = useState(false);

  const alertsArray = Object.values(alerts).sort((a, b) => b.timestamp - a.timestamp);
  
  const getTrackerName = (trackerId: string) => {
    return trackers[trackerId]?.name || 'Unknown Tracker';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, you would reload alerts from the backend here
    // For now, we'll just simulate a delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead(alertId);
    } catch (error) {
      RNAlert.alert('Error', 'Failed to mark alert as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      RNAlert.alert('Success', 'All alerts marked as read');
    } catch (error) {
      RNAlert.alert('Error', 'Failed to mark all alerts as read');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
    } catch (error) {
      RNAlert.alert('Error', 'Failed to delete alert');
    }
  };

  const handleAlertPress = (alert: Alert) => {
    if (!alert.isRead) {
      handleMarkAsRead(alert.id);
    }
    
    // Navigate to the tracker detail when alert is pressed
    if (trackers[alert.trackerId]) {
      navigation.navigate('TrackerDetail', { trackerId: alert.trackerId });
    }
  };

  // Helper function to get appropriate icon based on alert type
  const getAlertIcon = (alert: Alert) => {
    switch (alert.type) {
      case 'left_behind':
        return 'warning-outline';
      case 'moved':
        return 'walk-outline';
      case 'low_battery':
        return 'battery-dead-outline';
      case 'out_of_range':
        return 'wifi-outline';
      case 'custom':
      default:
        return 'notifications-outline';
    }
  };

  // Helper function to format alert time
  const formatAlertTime = (timestamp: number) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    
    // If the alert is from today, show only time
    if (
      alertTime.getDate() === now.getDate() &&
      alertTime.getMonth() === now.getMonth() &&
      alertTime.getFullYear() === now.getFullYear()
    ) {
      return alertTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If the alert is from this year, show date without year
    if (alertTime.getFullYear() === now.getFullYear()) {
      return alertTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return alertTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      style={[
        styles.alertItem,
        !item.isRead && styles.unreadAlert
      ]}
      onPress={() => handleAlertPress(item)}
    >
      <View style={styles.alertContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getAlertTypeColor(item.type) }
        ]}>
          <Ionicons
            name={getAlertIcon(item)}
            size={24}
            color="#fff"
          />
        </View>
        
        <View style={styles.alertInfo}>
          <Text style={styles.alertTitle}>{item.title}</Text>
          <Text style={styles.trackerName}>{getTrackerName(item.trackerId)}</Text>
          <Text style={styles.alertMessage}>{item.message}</Text>
        </View>
        
        <View style={styles.alertActions}>
          <Text style={styles.alertTime}>{formatAlertTime(item.timestamp)}</Text>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteAlert(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Helper function to get appropriate color based on alert type
  const getAlertTypeColor = (type: Alert['type']) => {
    switch (type) {
      case 'left_behind':
        return '#F44336'; // Red
      case 'moved':
        return '#4CAF50'; // Green
      case 'low_battery':
        return '#FF9800'; // Orange
      case 'out_of_range':
        return '#2196F3'; // Blue
      case 'custom':
      default:
        return '#9C27B0'; // Purple
    }
  };

  if (loading && !refreshing && alertsArray.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        {alertsArray.length > 0 && (
          <TouchableOpacity
            style={styles.markAllReadButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllReadText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {alertsArray.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#CCC" />
          <Text style={styles.emptyTitle}>No Alerts</Text>
          <Text style={styles.emptyText}>
            You don't have any notifications yet. Alerts will appear here when your trackers detect unusual activity.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alertsArray}
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
  markAllReadButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markAllReadText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
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
  alertItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  alertContent: {
    flexDirection: 'row',
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
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  trackerName: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
  },
  alertActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 5,
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
});

export default AlertsScreen;