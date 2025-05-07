import { LocationPoint, Tracker } from '../redux/slices/trackerSlice';

/**
 * AI Prediction Module for FIND System
 * 
 * This module implements basic predictive algorithms to:
 * 1. Analyze location patterns
 * 2. Predict when items might be left behind
 * 3. Identify common locations where items are forgotten
 * 
 * Future enhancements would integrate with a more sophisticated machine learning service
 */

// Interface for a behavioral pattern
interface BehavioralPattern {
  id: string;
  name: string;
  description: string;
  confidence: number; // 0-1
  // History of locations that form this pattern
  locations: LocationPoint[];
  // Time and day patterns
  dayOfWeekPattern: number[]; // 0-6 for Sun-Sat, value is frequency
  timeOfDayPattern: number[]; // 0-23 hours, value is frequency
  // How many times this pattern has been observed
  occurrences: number;
  // Last time this pattern was seen
  lastSeen: number;
}

// User movement stats
interface MovementStats {
  userId: string;
  // Common stay locations (home, work, etc.)
  commonLocations: {
    location: {
      latitude: number;
      longitude: number;
      radius: number; // meters
    };
    name: string;
    timeSpent: number; // milliseconds
    visitCount: number;
    lastVisit: number;
  }[];
  // Daily movement patterns
  dailyPatterns: BehavioralPattern[];
  // Travel velocity in m/s (for detecting transportation type)
  averageVelocity: number;
  // Time of day activity levels (0-23 hours)
  hourlyActivity: number[];
}

// Cache for user movement stats
const userMovementCache: Record<string, MovementStats> = {};

/**
 * Process location updates to build behavioral patterns
 */
export const processLocationUpdate = (
  userId: string,
  userLocation: LocationPoint,
  trackers: Record<string, Tracker>
): void => {
  // Initialize user stats if not exists
  if (!userMovementCache[userId]) {
    userMovementCache[userId] = {
      userId,
      commonLocations: [],
      dailyPatterns: [],
      averageVelocity: 0,
      hourlyActivity: Array(24).fill(0),
    };
  }

  const userStats = userMovementCache[userId];

  // Update hourly activity
  const hour = new Date(userLocation.timestamp).getHours();
  userStats.hourlyActivity[hour]++;

  // Check if user is at a common location
  const commonLocation = findOrCreateCommonLocation(userStats, userLocation);

  // Update common location stats
  if (commonLocation) {
    commonLocation.lastVisit = userLocation.timestamp;
    commonLocation.visitCount++;
  }

  // Compare user location with tracker locations
  Object.values(trackers).forEach(tracker => {
    if (!tracker.lastSeen) return;
    
    // Calculate distance between user and tracker
    const distance = calculateDistance(
      userLocation.latitude, userLocation.longitude,
      tracker.lastSeen.latitude, tracker.lastSeen.longitude
    );
    
    // If distance is increasing, the tracker might be left behind
    if (distance > 100) { // 100 meters threshold
      // In a real implementation, we would track this pattern over time
      // and only alert if it persists
      console.log(`Tracker ${tracker.name} might be left behind`);
    }
  });
};

/**
 * Find or create a common location in user stats
 */
function findOrCreateCommonLocation(
  userStats: MovementStats,
  location: LocationPoint
): MovementStats['commonLocations'][0] | null {
  // Look for existing location within 100m
  for (const commonLocation of userStats.commonLocations) {
    const distance = calculateDistance(
      location.latitude, location.longitude,
      commonLocation.location.latitude, commonLocation.location.longitude
    );
    
    // If within the location radius, return it
    if (distance * 111000 < commonLocation.location.radius) { // Convert to meters (approx)
      return commonLocation;
    }
  }
  
  // If we've seen this location multiple times, create a new common location
  // In a real implementation, we would cluster locations over time
  // For now, simplify by not creating new locations
  return null;
}

/**
 * Calculate risk score for leaving an item behind
 * Returns a value 0-1 where higher values indicate higher risk
 */
export const calculateLeftBehindRisk = (
  userId: string,
  trackerId: string,
  userLocation: LocationPoint,
  trackerLocation: LocationPoint
): number => {
  const userStats = userMovementCache[userId];
  if (!userStats) return 0;
  
  let risk = 0;
  
  // Factor 1: Distance between user and tracker
  const distance = calculateDistance(
    userLocation.latitude, userLocation.longitude,
    trackerLocation.latitude, trackerLocation.longitude
  );
  // Convert to meters (approximate)
  const distanceMeters = distance * 111000;
  
  // Distance factor: higher distance = higher risk
  // Max out at 100m
  const distanceFactor = Math.min(distanceMeters / 100, 1);
  risk += distanceFactor * 0.4; // 40% weight
  
  // Factor 2: At common location
  const atCommonLocation = isAtCommonLocation(userStats, userLocation);
  if (atCommonLocation) {
    // If at a common location like home or work, risk increases
    // as people often leave items when transitioning
    risk += 0.3; // 30% weight
  }
  
  // Factor 3: Time of day factor
  const hour = new Date(userLocation.timestamp).getHours();
  // Morning (6-9) and evening (17-20) have higher risk as
  // people are usually transitioning during these times
  if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20)) {
    risk += 0.2; // 20% weight
  }
  
  // Factor 4: Movement speed
  // This would be calculated from consecutive location points
  // Simplify for now with a random factor
  risk += Math.random() * 0.1; // 10% weight
  
  return risk;
};

/**
 * Check if user is at a common location
 */
function isAtCommonLocation(
  userStats: MovementStats,
  location: LocationPoint
): boolean {
  for (const commonLocation of userStats.commonLocations) {
    const distance = calculateDistance(
      location.latitude, location.longitude,
      commonLocation.location.latitude, commonLocation.location.longitude
    );
    
    // If within the location radius
    if (distance * 111000 < commonLocation.location.radius) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate heatmap data of forgotten locations
 * Returns an array of points with intensity values
 */
export const generateForgottenLocationsHeatmap = (
  userId: string
): { latitude: number; longitude: number; intensity: number }[] => {
  // In a real implementation, this would analyze patterns from actual data
  // For simulation, return some mock data
  return [
    { latitude: 37.7749, longitude: -122.4194, intensity: 0.9 }, // San Francisco
    { latitude: 37.7458, longitude: -122.4199, intensity: 0.5 }, // Near San Francisco
    { latitude: 37.3382, longitude: -121.8863, intensity: 0.7 }, // San Jose
  ];
};

/**
 * Calculate distance between two lat/lng points
 * Returns distance in degrees (multiply by 111000 for approximate meters)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Simple Euclidean distance calculation
  const latDiff = lat2 - lat1;
  const lonDiff = lon2 - lon1;
  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
}

/**
 * Predict if a tracker is likely to be left behind soon
 * Returns true if there's a high risk
 */
export const predictLeftBehind = (
  userId: string,
  trackerId: string,
  userLocation: LocationPoint,
  trackerLocation: LocationPoint
): boolean => {
  const risk = calculateLeftBehindRisk(userId, trackerId, userLocation, trackerLocation);
  return risk > 0.7; // 70% threshold
};