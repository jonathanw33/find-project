import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert as RNAlert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { Alert, setAlerts } from '../../redux/slices/alertSlice';
import { useAlert } from '../../context/AlertContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { alertService } from '../../services/supabase';

type NavigationProp = StackNavigationProp<MainStackParamList>;

const AlertsScreen: React.FC = () => {
  const { alerts, loading } = useSelector((state: RootState) => state.alerts);
  const { trackers } = useSelector((state: RootState) => state.trackers);
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { markAsRead, markAllAsRead, deleteAlert } = useAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Refresh alerts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('AlertsScreen focused - refreshing alerts');
      loadAlertsFromDatabase();
    }, [])
  );

  // Function to manually load alerts from database
  const loadAlertsFromDatabase = async () => {
    try {
      console.log('Loading alerts from database...');
      const alertsData = await alertService.getAlerts();
      console.log(`Loaded ${alertsData.length} alerts from database`);
      
      // Transform to match our Redux structure
      const transformedAlerts: Alert[] = alertsData.map(alert => ({
        id: alert.id,
        trackerId: alert.tracker_id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        icon: alert.icon || undefined,
        isRead: alert.is_read,
        isActive: alert.is_active,
        data: alert.data || undefined,
        timestamp: new Date(alert.timestamp).getTime(),
      }));
      
      dispatch(setAlerts(transformedAlerts));
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const alertsArray = Object.values(alerts).sort((a, b) => b.timestamp - a.timestamp);
  
  // Filter alerts based on selected filter
  const filteredAlerts = alertsArray.filter(alert => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return !alert.isRead;
    
    // Check both the main type and the data.alert_type for comprehensive filtering
    const mainType = alert.type;
    const dataType = alert.data?.alert_type;
    
    if (selectedFilter === 'geofence') {
      return mainType === 'geofence_enter' || 
             mainType === 'geofence_exit' || 
             dataType === 'geofence_enter' || 
             dataType === 'geofence_exit';
    }
    
    if (selectedFilter === 'movement') {
      return mainType === 'left_behind' || mainType === 'moved';
    }
    
    if (selectedFilter === 'scheduled') {
      return mainType === 'scheduled' || dataType === 'scheduled';
    }
    
    return mainType === selectedFilter;
  });

  // Get filter options with counts
  const getFilterOptions = () => {
    const geofenceCount = alertsArray.filter(a => 
      a.type === 'geofence_enter' || 
      a.type === 'geofence_exit' || 
      a.data?.alert_type === 'geofence_enter' || 
      a.data?.alert_type === 'geofence_exit'
    ).length;
    
    const movementCount = alertsArray.filter(a => 
      a.type === 'left_behind' || a.type === 'moved'
    ).length;
    
    const scheduledCount = alertsArray.filter(a => 
      a.type === 'scheduled' || a.data?.alert_type === 'scheduled'
    ).length;
    
    const unreadCount = alertsArray.filter(a => !a.isRead).length;
    
    return [
      { key: 'all', label: 'All', count: alertsArray.length },
      { key: 'unread', label: 'Unread', count: unreadCount },
      { key: 'geofence', label: 'Geofence', count: geofenceCount },
      { key: 'movement', label: 'Movement', count: movementCount },
      { key: 'scheduled', label: 'Scheduled', count: scheduledCount },
    ];
  };
  
  const getTrackerName = (trackerId: string) => {
    return trackers[trackerId]?.name || 'Unknown Tracker';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlertsFromDatabase();
    setRefreshing(false);
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

  const handleCreateTestAlert = () => {
    const trackerIds = Object.keys(trackers);
    if (trackerIds.length === 0) {
      RNAlert.alert('No Trackers', 'Create a tracker first to test alerts.');
      return;
    }

    const testAlertTypes = [
      {
        type: 'geofence_enter' as const,
        title: 'Geofence Entered',
        message: 'Your tracker has entered the Home area',
        data: { geofence_data: { geofence_name: 'Home', geofence_id: 'test-home' } }
      },
      {
        type: 'geofence_exit' as const,
        title: 'Geofence Exited',
        message: 'Your tracker has left the Office area',
        data: { geofence_data: { geofence_name: 'Office', geofence_id: 'test-office' } }
      },
      {
        type: 'scheduled' as const,
        title: 'Daily Reminder',
        message: 'Don\'t forget to check your keys before leaving!',
        data: { schedule_data: { schedule_type: 'daily', schedule_id: 'test-daily' } }
      },
      {
        type: 'left_behind' as const,
        title: 'Item Left Behind',
        message: 'You might be leaving your tracker behind!',
        data: {}
      }
    ];

    // Show options for different test alerts
    RNAlert.alert(
      'Create Test Alert',
      'Choose the type of alert to create:',
      [
        ...testAlertTypes.map(alertType => ({
          text: alertType.title,
          onPress: () => createTestAlert(trackerIds[0], alertType)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const createTestAlert = async (trackerId: string, alertData: any) => {
    try {
      await createAlert({
        trackerId,
        type: alertData.type,
        title: alertData.title,
        message: alertData.message,
        data: alertData.data
      });
      RNAlert.alert('Success', 'Test alert created!');
    } catch (error) {
      RNAlert.alert('Error', 'Failed to create test alert');
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
    // Check both main type and data.alert_type
    const mainType = alert.type;
    const dataType = alert.data?.alert_type;
    
    // Use data type if available, otherwise fall back to main type
    const effectiveType = dataType || mainType;
    
    switch (effectiveType) {
      case 'left_behind':
        return 'warning-outline';
      case 'moved':
        return 'walk-outline';
      case 'low_battery':
        return 'battery-dead-outline';
      case 'out_of_range':
        return 'wifi-outline';
      case 'geofence_enter':
        return 'enter-outline';
      case 'geofence_exit':
        return 'exit-outline';
      case 'scheduled':
        return 'time-outline';
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
          { backgroundColor: getAlertTypeColor(item) }
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
          {/* Show additional details for specific alert types */}
          {((item.type === 'geofence_enter' || item.type === 'geofence_exit') || 
            (item.data?.alert_type === 'geofence_enter' || item.data?.alert_type === 'geofence_exit')) && 
           item.data?.geofence_data && (
            <Text style={styles.alertDetails}>
              Geofence: {item.data.geofence_data.geofence_name}
            </Text>
          )}
          {(item.type === 'scheduled' || item.data?.alert_type === 'scheduled') && 
           item.data?.schedule_data && (
            <Text style={styles.alertDetails}>
              Type: {item.data.schedule_data.schedule_type} reminder
            </Text>
          )}
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
  const getAlertTypeColor = (alert: Alert) => {
    // Check both main type and data.alert_type
    const mainType = alert.type;
    const dataType = alert.data?.alert_type;
    
    // Use data type if available, otherwise fall back to main type
    const effectiveType = dataType || mainType;
    
    switch (effectiveType) {
      case 'left_behind':
        return '#F44336'; // Red
      case 'moved':
        return '#4CAF50'; // Green
      case 'low_battery':
        return '#FF9800'; // Orange
      case 'out_of_range':
        return '#2196F3'; // Blue
      case 'geofence_enter':
        return '#4CAF50'; // Green for entering
      case 'geofence_exit':
        return '#FF5722'; // Deep Orange for exiting
      case 'scheduled':
        return '#9C27B0'; // Purple for scheduled
      case 'custom':
      default:
        return '#607D8B'; // Blue Grey
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
        <View style={styles.headerActions}>
          {/* Test Alert Button for development */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleCreateTestAlert}
          >
            <Ionicons name="flask-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
          
          {alertsArray.length > 0 && (
            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.markAllReadText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Section */}
      {alertsArray.length > 0 && (
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={getFilterOptions()}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.filterContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === item.key && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(item.key)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === item.key && styles.filterButtonTextActive
                  ]}
                >
                  {item.label}
                </Text>
                {item.count > 0 && (
                  <View style={[
                    styles.filterBadge,
                    selectedFilter === item.key && styles.filterBadgeActive
                  ]}>
                    <Text style={[
                      styles.filterBadgeText,
                      selectedFilter === item.key && styles.filterBadgeTextActive
                    ]}>
                      {item.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {filteredAlerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#CCC" />
          <Text style={styles.emptyTitle}>
            {selectedFilter === 'all' ? 'No Alerts' : `No ${selectedFilter} Alerts`}
          </Text>
          <Text style={styles.emptyText}>
            {selectedFilter === 'all' 
              ? "You don't have any notifications yet. Alerts will appear here when your trackers detect unusual activity."
              : `No ${selectedFilter} alerts found. Try selecting a different filter.`
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginRight: 8,
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
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterBadge: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: '#fff',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterBadgeTextActive: {
    color: '#007AFF',
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
  alertDetails: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontStyle: 'italic',
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