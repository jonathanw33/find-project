        {/* Advanced Alerts Section */}
        <View style={styles.advancedAlertSection}>
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
