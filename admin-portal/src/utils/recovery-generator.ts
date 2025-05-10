import { LogisticsRequestWithDetails } from '@/types/supabase';
import { getStatusOverride } from './storage/recoveryStatus';
import { saveTrackerStatusOverride, getTrackerStatusOverride } from './storage/trackerStatus';

/**
 * Generates consistent dummy recovery data based on a request ID
 */
export const generateRecoveryData = (requestId: string): LogisticsRequestWithDetails => {
  // Generate deterministic but varied data based on ID
  const idChars = requestId.split('');
  const idSum = idChars.reduce((sum, char, i) => sum + char.charCodeAt(0) * (i + 1), 0);
  
  // Use the sum to create "random" but consistent values for this ID
  const randomSeed = idSum % 1000;
  const statusIndex = randomSeed % 5;
  const baseStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][statusIndex] as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  
  // Check for status override in localStorage
  const statusOverride = getStatusOverride(requestId);
  const status = statusOverride ? statusOverride.status as typeof baseStatus : baseStatus;
  const updatedAt = statusOverride ? statusOverride.updated_at : new Date(2025, 4, 5, 14, 22).toISOString();
  
  const trackerNames = [
    'Office Keychain', 
    'Car Tracker', 
    'Backpack Tag', 
    'Wallet Finder', 
    'Laptop Locator'
  ];
  
  const userNames = [
    'Budi Santoso', 
    'Dewi Kartika', 
    'Eko Prasetyo', 
    'Fitri Wulandari', 
    'Hadi Nugroho'
  ];
  
  const carriers = [
    'JNE Express', 
    'SiCepat', 
    'AnterAja', 
    'J&T Express', 
    'Gojek'
  ];
  
  const trackerId = `tracker-${randomSeed}`;
  
  // Check and set tracker status based on recovery status
  const trackerStatus = getTrackerStatusOverride(trackerId);
  
  // If this is a new recovery or status has changed, update tracker status
  if (!trackerStatus || trackerStatus.recovery_id !== requestId) {
    if (status !== 'delivered' && status !== 'cancelled') {
      // Mark tracker as lost/recovering if recovery is in progress
      saveTrackerStatusOverride(trackerId, 'recovered', requestId);
    } else if (status === 'delivered') {
      // Mark tracker as normal if delivered
      saveTrackerStatusOverride(trackerId, 'normal', requestId);
    } else if (status === 'cancelled') {
      // Mark tracker as still lost if cancelled
      saveTrackerStatusOverride(trackerId, 'lost', requestId);
    }
  }
  
  // Create test data for this recovery
  return {
    id: requestId,
    tracker_id: trackerId,
    user_id: `user-${randomSeed % 500}`,
    status: status,
    created_at: new Date(2025, 4, 1, 10, 30).toISOString(),
    updated_at: updatedAt,
    tracking_number: `JNE${randomSeed}${randomSeed % 10000}`,
    shipping_address: '123 Java Street, Bandung, West Java, Indonesia',
    notes: 'This recovery request was created for testing the FIND admin portal. The tracker was found at a local coffee shop.',
    carrier: carriers[randomSeed % carriers.length],
    delivery_latitude: -6.90 - ((randomSeed % 20) / 100),
    delivery_longitude: 107.60 + ((randomSeed % 20) / 100),
    // Additional fields from relations
    tracker_name: trackerNames[randomSeed % trackerNames.length],
    user_email: `user${randomSeed}@example.com`,
    user_name: userNames[randomSeed % userNames.length],
    user_phone: `+62 ${800 + randomSeed % 199}-${1000 + randomSeed % 9000}`,
    user_address: '123 Java Street, Bandung, West Java, Indonesia',
    // Nested relations
    trackers: {
      id: trackerId,
      user_id: `user-${randomSeed % 500}`,
      name: trackerNames[randomSeed % trackerNames.length],
      type: 'physical',
      icon: null,
      battery_level: 20 + (randomSeed % 80),
      is_active: true,
      last_seen_latitude: -6.90 - ((randomSeed % 20) / 100),
      last_seen_longitude: 107.60 + ((randomSeed % 20) / 100),
      last_seen_timestamp: new Date(2025, 4, 1, 9, 15).toISOString(),
      connection_status: 'disconnected',
      ble_id: null,
      created_at: new Date(2024, 11, 15, 8, 30).toISOString(),
      updated_at: new Date(2025, 3, 30, 17, 45).toISOString()
    },
    profiles: {
      id: `user-${randomSeed % 500}`,
      email: `user${randomSeed}@example.com`,
      name: userNames[randomSeed % userNames.length],
      avatar_url: null,
      phone: `+62 ${800 + randomSeed % 199}-${1000 + randomSeed % 9000}`,
      address: '123 Java Street, Bandung, West Java, Indonesia',
      created_at: new Date(2024, 10, 1, 10, 0).toISOString(),
      updated_at: new Date(2025, 3, 15, 12, 30).toISOString()
    }
  };
};