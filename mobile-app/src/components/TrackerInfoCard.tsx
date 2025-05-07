import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tracker } from '../redux/slices/trackerSlice';

interface TrackerInfoCardProps {
  tracker: Tracker;
  onClose: () => void;
  onViewDetails: () => void;
}

const TrackerInfoCard: React.FC<TrackerInfoCardProps> = ({
  tracker,
  onClose,
  onViewDetails,
}) => {
  // Format time as relative (e.g., "2 minutes ago")
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return 'Just now';
    }
    
    // Convert to minutes
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Convert to days
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Get the appropriate icon based on tracker type
  const getIconName = () => {
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getIconName()} 
            size={32} 
            color={tracker.type === 'physical' ? '#007AFF' : '#FF9500'} 
          />
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.trackerName}>{tracker.name}</Text>
            <View style={[
              styles.badgeContainer, 
              { backgroundColor: tracker.type === 'physical' ? '#E1F5FE' : '#FFF3E0' }
            ]}>
              <Text style={[
                styles.badgeText, 
                { color: tracker.type === 'physical' ? '#0288D1' : '#FF9800' }
              ]}>
                {tracker.type === 'physical' ? 'Physical' : 'Virtual'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.lastSeen}>
            Last seen: {tracker.lastSeen ? getRelativeTime(tracker.lastSeen.timestamp) : 'Unknown'}
          </Text>
          
          {tracker.type === 'physical' && tracker.batteryLevel !== undefined && (
            <View style={styles.batteryContainer}>
              <Ionicons 
                name={
                  tracker.batteryLevel > 70 
                    ? 'battery-full-outline' 
                    : tracker.batteryLevel > 30 
                    ? 'battery-half-outline' 
                    : 'battery-dead-outline'
                } 
                size={16} 
                color={
                  tracker.batteryLevel > 70 
                    ? '#4CAF50' 
                    : tracker.batteryLevel > 30 
                    ? '#FF9800' 
                    : '#F44336'
                } 
              />
              <Text style={[
                styles.batteryText,
                {
                  color: tracker.batteryLevel > 70 
                    ? '#4CAF50' 
                    : tracker.batteryLevel > 30 
                    ? '#FF9800' 
                    : '#F44336'
                }
              ]}>
                {tracker.batteryLevel}%
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={onViewDetails}
        >
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trackerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastSeen: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  closeButton: {
    padding: 5,
  },
});

export default TrackerInfoCard;