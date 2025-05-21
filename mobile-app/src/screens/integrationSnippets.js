// Add advanced alerts sections to the TrackerDetailScreen.tsx
import { useGeofence } from '../../context/GeofenceContext';
import { useScheduledAlert } from '../../context/ScheduledAlertContext';

// Inside the TrackerDetailScreen component, add these hooks:
const { getLinkedGeofences } = useGeofence();
const { getScheduledAlertsForTracker } = useScheduledAlert();

const [linkedGeofences, setLinkedGeofences] = useState([]);
const [scheduledAlerts, setScheduledAlerts] = useState([]);

// Add to the useEffect that loads data:
useEffect(() => {
  if (tracker?.id) {
    loadAdvancedAlertData();
  }
}, [tracker?.id]);

const loadAdvancedAlertData = async () => {
  try {
    // Load geofences
    const geofences = await getLinkedGeofences(tracker.id);
    setLinkedGeofences(geofences);
    
    // Load scheduled alerts
    const alerts = await getScheduledAlertsForTracker(tracker.id);
    setScheduledAlerts(alerts);
  } catch (error) {
    console.error("Error loading advanced alert data:", error);
  }
};

// Add this function to the component's render section:
const renderAdvancedAlerts = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Advanced Alerts</Text>
    
    <TouchableOpacity 
      style={styles.alertTypeButton}
      onPress={() => navigation.navigate('TrackerGeofences', { trackerId: tracker.id })}
    >
      <Ionicons name="map-outline" size={24} color="#007AFF" />
      <View style={styles.alertTypeInfo}>
        <Text style={styles.alertTypeName}>Geofence Alerts</Text>
        <Text style={styles.alertTypeDesc}>
          Get notified when the tracker enters or exits specific areas
        </Text>
      </View>
      <Text style={styles.alertCount}>{linkedGeofences.length}</Text>
      <Ionicons name="chevron-forward" size={16} color="#999" />
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.alertTypeButton}
      onPress={() => navigation.navigate('TrackerScheduledAlerts', { trackerId: tracker.id })}
    >
      <Ionicons name="time-outline" size={24} color="#FF9500" />
      <View style={styles.alertTypeInfo}>
        <Text style={styles.alertTypeName}>Scheduled Alerts</Text>
        <Text style={styles.alertTypeDesc}>
          Time-based reminders and notifications
        </Text>
      </View>
      <Text style={styles.alertCount}>{scheduledAlerts.length}</Text>
      <Ionicons name="chevron-forward" size={16} color="#999" />
    </TouchableOpacity>
  </View>
);

// Add these to styles:
const advancedAlertStyles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  alertTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  alertTypeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  alertTypeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  alertTypeDesc: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  alertCount: {
    backgroundColor: '#EEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 14,
    color: '#555',
    marginRight: 8,
  },
});