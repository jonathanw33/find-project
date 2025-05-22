import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

// Demo component showing the visual improvements
const VisualImprovementsDemo: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎨 Visual Improvements Demo</Text>
      
      {/* Header Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enhanced Header</Text>
        <View style={styles.demoHeader}>
          <Text style={styles.demoHeaderTitle}>Your Trackers</Text>
          <View style={styles.demoAddButton}>
            <Ionicons name="add" size={24} color={theme.colors.textOnPrimary} />
          </View>
        </View>
      </View>

      {/* Enhanced Tracker Card Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modern Tracker Cards</Text>
        
        {/* Physical Tracker Card */}
        <View style={styles.demoTrackerCard}>
          <View style={[styles.demoIconContainer, { backgroundColor: theme.colors.physical.background }]}>
            <Ionicons name="hardware-chip" size={24} color={theme.colors.physical.primary} />
          </View>
          <View style={styles.demoTrackerInfo}>
            <View style={styles.demoTrackerHeader}>
              <Text style={styles.demoTrackerName}>AirTag Pro</Text>
              <View style={[styles.demoTypeBadge, { backgroundColor: theme.colors.physical.light }]}>
                <Text style={[styles.demoTypeBadgeText, { color: theme.colors.physical.primary }]}>
                  Physical
                </Text>
              </View>
            </View>
            <View style={styles.demoStatusRow}>
              <View style={styles.demoStatusIndicator}>
                <View style={[styles.demoStatusDot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.demoStatusText}>Active</Text>
              </View>
              <Text style={styles.demoLastSeen}>2m ago</Text>
            </View>
            <View style={styles.demoBatteryContainer}>
              <Ionicons name="battery-full" size={16} color={theme.colors.battery.high} />
              <Text style={[styles.demoBatteryText, { color: theme.colors.battery.high }]}>
                87%
              </Text>
            </View>
          </View>
        </View>

        {/* Virtual Tracker Card */}
        <View style={styles.demoTrackerCard}>
          <View style={[styles.demoIconContainer, { backgroundColor: theme.colors.virtual.background }]}>
            <Ionicons name="key" size={24} color={theme.colors.virtual.primary} />
          </View>
          <View style={styles.demoTrackerInfo}>
            <View style={styles.demoTrackerHeader}>
              <Text style={styles.demoTrackerName}>House Keys</Text>
              <View style={[styles.demoTypeBadge, { backgroundColor: theme.colors.virtual.light }]}>
                <Text style={[styles.demoTypeBadgeText, { color: theme.colors.virtual.primary }]}>
                  Virtual
                </Text>
              </View>
            </View>
            <View style={styles.demoStatusRow}>
              <View style={styles.demoStatusIndicator}>
                <View style={[styles.demoStatusDot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.demoStatusText}>Active</Text>
              </View>
              <Text style={styles.demoLastSeen}>15m ago</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Enhanced Empty State Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modern Empty State</Text>
        <View style={styles.demoEmptyState}>
          <View style={styles.demoEmptyIcon}>
            <Ionicons name="cube-outline" size={64} color={theme.colors.gray300} />
          </View>
          <Text style={styles.demoEmptyTitle}>No Trackers Yet</Text>
          <Text style={styles.demoEmptyDescription}>
            Start tracking your important items by adding your first tracker.
          </Text>
          <View style={styles.demoEmptyButton}>
            <Text style={styles.demoEmptyButtonText}>Add Tracker</Text>
          </View>
        </View>
      </View>

      {/* Color Palette Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enhanced Color Palette</Text>
        <View style={styles.colorPalette}>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.colorLabel}>Primary Blue</Text>
          </View>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.colors.success }]} />
            <Text style={styles.colorLabel}>Success Green</Text>
          </View>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.colors.physical.primary }]} />
            <Text style={styles.colorLabel}>Physical Tracker</Text>
          </View>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.colors.virtual.primary }]} />
            <Text style={styles.colorLabel}>Virtual Tracker</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginVertical: theme.spacing.xl,
  },
  section: {
    margin: theme.spacing.base,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  
  // Enhanced Header Demo
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.base,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    ...theme.shadows.md,
  },
  demoHeaderTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  demoAddButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  
  // Enhanced Tracker Card Demo
  demoTrackerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  demoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.base,
  },
  demoTrackerInfo: {
    flex: 1,
  },