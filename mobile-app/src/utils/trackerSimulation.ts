import { LocationPoint } from '../redux/slices/trackerSlice';
import { Geofence } from '../services/geofence/geofenceService';

export type SimulationPattern = 'random' | 'circle' | 'line' | 'geofence_cross';

export interface SimulationOptions {
  radius?: number;        // For circle pattern (in degrees of lat/long)
  speed?: number;         // Movement speed (in degrees of lat/long per update)
  direction?: number;     // Direction in radians (for line pattern)
  updateInterval?: number; // Time between updates in ms
  jitter?: number;        // Random noise to add to movements (0-1)
  maxDistance?: number;   // Maximum distance to travel for line pattern
  targetGeofence?: Geofence; // For geofence crossing simulation
}

const defaultOptions: SimulationOptions = {
  radius: 0.001,         // About 100m
  speed: 0.00005,        // About 5m per update
  direction: 0,          // East direction
  updateInterval: 3000,  // 3 seconds
  jitter: 0.2,           // 20% randomness
  maxDistance: 0.01,     // About 1km for line pattern
};

// Track all running simulations
const simulations: Record<string, {
  intervalId: NodeJS.Timeout;
  pattern: SimulationPattern;
  options: SimulationOptions;
  currentState: {
    startLocation: LocationPoint;
    currentLocation: LocationPoint;
    angle?: number;      // For circle pattern
    distance?: number;   // For line pattern
    geofenceCrossed?: boolean; // For geofence pattern
    steps?: number;      // For geofence pattern
  };
}> = {};

/**
 * Start a new tracker simulation
 */
export const startSimulation = (
  trackerId: string,
  startLocation: LocationPoint,
  pattern: SimulationPattern = 'random',
  options: SimulationOptions = {},
  onUpdate: (location: LocationPoint) => void
): void => {
  // Stop any existing simulation for this tracker
  stopSimulation(trackerId);
  
  // Merge default options with provided options
  const simulationOptions = { ...defaultOptions, ...options };
  
  // Initialize simulation state
  const state = {
    startLocation,
    currentLocation: { ...startLocation },
    angle: 0,            // Starting angle for circle pattern
    distance: 0,         // Distance traveled for line pattern
    geofenceCrossed: false, // For geofence crossing pattern
    steps: 0             // For tracking simulation progress
  };
  
  // Create interval to update location
  const intervalId = setInterval(() => {
    // Calculate new location based on pattern
    const newLocation = calculateNextLocation(
      state.currentLocation,
      pattern,
      simulationOptions,
      state
    );
    
    // Update state
    state.currentLocation = newLocation;
    
    // Call update callback
    onUpdate(newLocation);
  }, simulationOptions.updateInterval);
  
  // Store simulation info
  simulations[trackerId] = {
    intervalId,
    pattern,
    options: simulationOptions,
    currentState: state,
  };
};

/**
 * Stop a running simulation
 */
export const stopSimulation = (trackerId: string): void => {
  const simulation = simulations[trackerId];
  if (simulation) {
    console.log(`Stopping utils simulation for ${trackerId}`);
    clearInterval(simulation.intervalId);
    delete simulations[trackerId];
  } else {
    console.log(`No utils simulation found for ${trackerId}`);
  }
};

/**
 * Calculate the next location based on the pattern
 */
function calculateNextLocation(
  currentLocation: LocationPoint,
  pattern: SimulationPattern,
  options: SimulationOptions,
  state: {
    startLocation: LocationPoint;
    currentLocation: LocationPoint;
    angle?: number;
    distance?: number;
    geofenceCrossed?: boolean;
    steps?: number;
  }
): LocationPoint {
  let newLat = currentLocation.latitude;
  let newLng = currentLocation.longitude;
  
  switch (pattern) {
    case 'circle':
      // Move in a circle around the starting point
      if (state.angle === undefined) state.angle = 0;
      
      newLat = state.startLocation.latitude + 
               Math.cos(state.angle) * (options.radius || 0.001);
      newLng = state.startLocation.longitude + 
               Math.sin(state.angle) * (options.radius || 0.001);
      
      // Add some jitter if specified
      if (options.jitter) {
        const jitterAmount = options.jitter * options.speed! * 0.5;
        newLat += (Math.random() - 0.5) * jitterAmount;
        newLng += (Math.random() - 0.5) * jitterAmount;
      }
      
      // Increment angle for next update
      state.angle += (options.speed || 0.00005) * 20;
      break;
      
    case 'line':
      // Move in a straight line in the given direction
      if (state.distance === undefined) state.distance = 0;
      
      // Check if we've reached the maximum distance
      if (state.distance >= (options.maxDistance || 0.01)) {
        // Reverse direction
        options.direction = (options.direction || 0) + Math.PI;
        state.distance = 0;
      }
      
      // Calculate new position
      newLat = currentLocation.latitude + 
               Math.cos(options.direction || 0) * (options.speed || 0.00005);
      newLng = currentLocation.longitude + 
               Math.sin(options.direction || 0) * (options.speed || 0.00005);
      
      // Add some jitter if specified
      if (options.jitter) {
        const jitterAmount = options.jitter * options.speed! * 0.5;
        newLat += (Math.random() - 0.5) * jitterAmount;
        newLng += (Math.random() - 0.5) * jitterAmount;
      }
      
      // Increment distance traveled
      state.distance += options.speed || 0.00005;
      break;
      
    case 'geofence_cross':
      // Initialize simulation state
      if (state.steps === undefined) state.steps = 0;
      if (state.geofenceCrossed === undefined) state.geofenceCrossed = false;

      // Check if we have a target geofence
      if (!options.targetGeofence) {
        // If no target geofence, just move randomly
        const randomRange = options.speed || 0.00005;
        newLat = currentLocation.latitude + (Math.random() - 0.5) * randomRange * 2;
        newLng = currentLocation.longitude + (Math.random() - 0.5) * randomRange * 2;
        break;
      }

      const geofence = options.targetGeofence;
      
      // Calculate current distance to geofence center
      const currentDistance = calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        geofence.centerLatitude, geofence.centerLongitude
      ) * 111000; // Convert to approximate meters (1 degree ~ 111km)
      
      // Determine if we're inside or outside the geofence
      const isInside = currentDistance <= geofence.radius;
      
      // Increase step count
      state.steps += 1;
      
      if (!state.geofenceCrossed) {
        // We haven't crossed the geofence yet
        if (isInside) {
          // We're inside and need to move out - move away from center
          const angle = Math.atan2(
            currentLocation.longitude - geofence.centerLongitude,
            currentLocation.latitude - geofence.centerLatitude
          );
          
          // Move outward
          newLat = currentLocation.latitude + Math.cos(angle) * (options.speed || 0.00005) * 2;
          newLng = currentLocation.longitude + Math.sin(angle) * (options.speed || 0.00005) * 2;
          
          // Check if we've just crossed out of the geofence
          const newDistance = calculateDistance(
            newLat, newLng,
            geofence.centerLatitude, geofence.centerLongitude
          ) * 111000;
          
          if (newDistance > geofence.radius) {
            console.log('Geofence EXITED during simulation!');
            state.geofenceCrossed = true;
          }
        } else {
          // We're outside and need to move in - move toward center
          const angle = Math.atan2(
            geofence.centerLongitude - currentLocation.longitude,
            geofence.centerLatitude - currentLocation.latitude
          );
          
          // Move inward
          newLat = currentLocation.latitude + Math.cos(angle) * (options.speed || 0.00005) * 2;
          newLng = currentLocation.longitude + Math.sin(angle) * (options.speed || 0.00005) * 2;
          
          // Check if we've just crossed into the geofence
          const newDistance = calculateDistance(
            newLat, newLng,
            geofence.centerLatitude, geofence.centerLongitude
          ) * 111000;
          
          if (newDistance <= geofence.radius) {
            console.log('Geofence ENTERED during simulation!');
            state.geofenceCrossed = true;
          }
        }
      } else {
        // We've already crossed once, now cross back
        if (isInside) {
          // We're inside and need to move out - move away from center
          const angle = Math.atan2(
            currentLocation.longitude - geofence.centerLongitude,
            currentLocation.latitude - geofence.centerLatitude
          );
          
          // Move outward more quickly to exit
          newLat = currentLocation.latitude + Math.cos(angle) * (options.speed || 0.00005) * 3;
          newLng = currentLocation.longitude + Math.sin(angle) * (options.speed || 0.00005) * 3;
          
          // Check if we've just crossed out of the geofence
          const newDistance = calculateDistance(
            newLat, newLng,
            geofence.centerLatitude, geofence.centerLongitude
          ) * 111000;
          
          if (newDistance > geofence.radius) {
            console.log('Geofence EXITED during simulation!');
            // Reset cycle so we can cross again
            state.geofenceCrossed = false;
          }
        } else {
          // We're outside and need to move in - move toward center
          const angle = Math.atan2(
            geofence.centerLongitude - currentLocation.longitude,
            geofence.centerLatitude - currentLocation.latitude
          );
          
          // Move inward
          newLat = currentLocation.latitude + Math.cos(angle) * (options.speed || 0.00005) * 2;
          newLng = currentLocation.longitude + Math.sin(angle) * (options.speed || 0.00005) * 2;
          
          // Check if we've just crossed into the geofence
          const newDistance = calculateDistance(
            newLat, newLng,
            geofence.centerLatitude, geofence.centerLongitude
          ) * 111000;
          
          if (newDistance <= geofence.radius) {
            console.log('Geofence ENTERED during simulation!');
            // Reset cycle so we can cross again
            state.geofenceCrossed = false;
          }
        }
      }
      
      // Add some jitter for realism
      if (options.jitter) {
        const jitterAmount = options.jitter * options.speed! * 0.5;
        newLat += (Math.random() - 0.5) * jitterAmount;
        newLng += (Math.random() - 0.5) * jitterAmount;
      }
      break;
      
    case 'random':
    default:
      // Random movement within a range
      const randomRange = options.speed || 0.00005;
      newLat = currentLocation.latitude + (Math.random() - 0.5) * randomRange * 2;
      newLng = currentLocation.longitude + (Math.random() - 0.5) * randomRange * 2;
      break;
  }
  
  return {
    latitude: newLat,
    longitude: newLng,
    timestamp: Date.now(),
    accuracy: 10 + Math.random() * 20, // Random accuracy between 10-30m
  };
}

/**
 * Get all running simulations
 */
export const getRunningSimulations = (): string[] => {
  return Object.keys(simulations);
};

/**
 * Change the pattern of a running simulation
 */
export const changeSimulationPattern = (
  trackerId: string, 
  newPattern: SimulationPattern,
  newOptions: SimulationOptions = {}
): boolean => {
  const simulation = simulations[trackerId];
  if (!simulation) return false;
  
  // Update pattern and options
  simulation.pattern = newPattern;
  simulation.options = { ...simulation.options, ...newOptions };
  
  return true;
};

/**
 * Generate a left-behind simulation event
 * Simulates the tracker staying in place while the user moves away
 */
export const simulateLeftBehind = (
  trackerId: string,
  userLocation: LocationPoint,
  onTrigger: () => void
): NodeJS.Timeout => {
  // This simulation increases the distance between user and tracker over time
  const simulation = simulations[trackerId];
  if (!simulation) {
    throw new Error(`No simulation running for tracker ${trackerId}`);
  }
  
  // We'll trigger the left-behind alert after the user has moved about 100m away
  // This is approximately 0.001 degrees in lat/lng
  const triggerDistance = 0.001;
  
  // Current tracker location
  const trackerLocation = simulation.currentState.currentLocation;
  
  // Calculate initial distance
  const initialDistance = calculateDistance(
    userLocation.latitude, userLocation.longitude,
    trackerLocation.latitude, trackerLocation.longitude
  );
  
  // Check distance every 5 seconds
  const leftBehindInterval = setInterval(() => {
    // Get current user location (this would come from the app in real usage)
    const currentDistance = calculateDistance(
      userLocation.latitude, userLocation.longitude,
      trackerLocation.latitude, trackerLocation.longitude
    );
    
    // If distance increases significantly from initial, trigger alert
    if (currentDistance - initialDistance > triggerDistance) {
      onTrigger();
      // Clear this interval as we've triggered the alert
      clearInterval(leftBehindInterval);
    }
  }, 5000);
  
  return leftBehindInterval;
};

/**
 * Calculate distance between two lat/lng points in degrees
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Simple Euclidean distance calculation (not accurate for large distances but fine for simulation)
  const latDiff = lat2 - lat1;
  const lonDiff = lon2 - lon1;
  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
}

/**
 * Start a geofence crossing simulation.
 * This is a specialized simulation that will make a tracker cross into and out of a geofence
 * to test geofence enter/exit alerts.
 */
export const startGeofenceCrossingSimulation = (
  trackerId: string,
  startLocation: LocationPoint,
  geofence: Geofence,
  onUpdate: (location: LocationPoint) => void
): void => {
  // Determine a good starting position
  // If starting near geofence, we'll want to make sure it's outside so we can test entrance
  const distanceToGeofence = calculateDistance(
    startLocation.latitude, startLocation.longitude,
    geofence.centerLatitude, geofence.centerLongitude
  ) * 111000; // Convert to approximate meters (1 degree ~ 111km)
  
  const isInsideGeofence = distanceToGeofence <= geofence.radius;
  
  // If inside, we'll move the starting point outside with a buffer
  let adjustedStartLocation = { ...startLocation };
  if (isInsideGeofence) {
    // Calculate angle from geofence center to start location
    const angle = Math.atan2(
      startLocation.longitude - geofence.centerLongitude,
      startLocation.latitude - geofence.centerLatitude
    );
    
    // Move further in this direction to get outside
    const distanceToAdd = (geofence.radius * 1.2 - distanceToGeofence) / 111000; // Convert back to degrees
    adjustedStartLocation = {
      ...startLocation,
      latitude: startLocation.latitude + Math.cos(angle) * distanceToAdd,
      longitude: startLocation.longitude + Math.sin(angle) * distanceToAdd
    };
    
    console.log('Adjusted starting location to outside geofence');
  }
  
  // Start the simulation with the geofence_cross pattern
  startSimulation(
    trackerId,
    adjustedStartLocation,
    'geofence_cross',
    {
      targetGeofence: geofence,
      speed: 0.00008, // Slightly faster for better testing
      updateInterval: 2000, // More frequent updates
      jitter: 0.1 // Less jitter for more predictable crossing
    },
    onUpdate
  );
  
  console.log(`Started geofence crossing simulation for "${trackerId}" and geofence ${geofence.name}`);
};