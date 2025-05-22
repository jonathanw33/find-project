import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tracker } from '../redux/slices/trackerSlice';
import { theme } from '../theme';

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
  const scaleValue = new Animated.Value(1);
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

  const isPhysical = tracker.type === 'physical';
  const typeColor = isPhysical ? theme.colors.physical : theme.colors.virtual;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ scale: scaleValue }],
          // Remove the opacity animation that's causing transparency
        }
      ]}
    >
      <View style={styles.content}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: typeColor.background }
        ]}>
          <Ionicons 
            name={getIconName()} 
            size={32} 
            color={typeColor.primary} 
          />
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.trackerName}>{tracker.name}</Text>
            <View style={[
              styles.badgeContainer, 
              { backgroundColor: typeColor.light }
            ]}>
              <Text style={[
                styles.badgeText, 
                { color: typeColor.primary }
              ]}>
                {isPhysical ? 'Physical' : 'Virtual'}
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
                    ? theme.colors.battery.high
                    : tracker.batteryLevel > 30 
                    ? theme.colors.battery.medium
                    : theme.colors.battery.low
                } 
              />
              <Text style={[
                styles.batteryText,
                {
                  color: tracker.batteryLevel > 70 
                    ? theme.colors.battery.high
                    : tracker.batteryLevel > 30 
                    ? theme.colors.battery.medium
                    : theme.colors.battery.low
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.base,
    ...theme.shadows.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.base,
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  trackerName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  badgeContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  lastSeen: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.base,
    paddingTop: theme.spacing.base,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.radius.full,
    ...theme.shadows.sm,
  },
  buttonText: {
    color: theme.colors.textOnPrimary,
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.sm,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
});

export default TrackerInfoCard;