import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tracker } from '../redux/slices/trackerSlice';
import { theme } from '../theme';

interface EnhancedTrackerCardProps {
  tracker: Tracker;
  onPress: () => void;
  onDelete?: () => void;
}

const EnhancedTrackerCard: React.FC<EnhancedTrackerCardProps> = ({
  tracker,
  onPress,
  onDelete,
}) => {
  // Format time as relative (e.g., "2 minutes ago")
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return 'Just now';
    }
    
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    
    if (hours < 24) {
      return `${hours}h ago`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  // Get the appropriate icon based on tracker type
  const getIconName = () => {
    if (tracker.type === 'physical') {
      return 'hardware-chip';
    }
    
    const name = tracker.name.toLowerCase();
    
    if (name.includes('key') || name.includes('keys')) {
      return 'key';
    } else if (name.includes('wallet') || name.includes('purse')) {
      return 'wallet';
    } else if (name.includes('phone') || name.includes('mobile')) {
      return 'phone-portrait';
    } else if (name.includes('laptop') || name.includes('computer')) {
      return 'laptop';
    } else if (name.includes('bag') || name.includes('backpack')) {
      return 'briefcase';
    } else {
      return 'cube';
    }
  };

  const isPhysical = tracker.type === 'physical';
  const typeColor = isPhysical ? theme.colors.physical : theme.colors.virtual;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {/* Icon Container */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: typeColor.background }
        ]}>
          <Ionicons 
            name={getIconName()} 
            size={24} 
            color={typeColor.primary} 
          />
        </View>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <Text style={styles.trackerName} numberOfLines={1}>
              {tracker.name}
            </Text>
            <View style={[
              styles.typeBadge,
              { backgroundColor: typeColor.light }
            ]}>
              <Text style={[
                styles.typeBadgeText,
                { color: typeColor.primary }
              ]}>
                {isPhysical ? 'Physical' : 'Virtual'}
              </Text>
            </View>
          </View>          
          {/* Status Row */}
          <View style={styles.statusRow}>
            <View style={styles.statusIndicatorContainer}>
              <View style={[
                styles.statusIndicator,
                { 
                  backgroundColor: tracker.isActive 
                    ? theme.colors.success 
                    : theme.colors.gray300 
                }
              ]} />
              <Text style={styles.statusText}>
                {tracker.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            
            <Text style={styles.lastSeenText}>
              {tracker.lastSeen 
                ? getRelativeTime(tracker.lastSeen.timestamp) 
                : 'No location'
              }
            </Text>
          </View>
          
          {/* Battery Level (for physical trackers) */}
          {isPhysical && tracker.batteryLevel !== undefined && (
            <View style={styles.batteryContainer}>
              <Ionicons 
                name={
                  tracker.batteryLevel > 70 
                    ? 'battery-full' 
                    : tracker.batteryLevel > 30 
                    ? 'battery-half' 
                    : 'battery-dead'
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
    </Pressable>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  content: {
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
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  trackerName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  typeBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  lastSeenText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  batteryText: {
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default EnhancedTrackerCard;