import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface Tracker {
  id: string;
  name: string;
  type: 'physical' | 'virtual'; // physical for real IoT trackers, virtual for dummy mode
  icon?: string;
  batteryLevel?: number;
  isActive: boolean;
  lastSeen: LocationPoint | null;
  locationHistory: LocationPoint[];
  connectionStatus?: 'connected' | 'disconnected' | 'connecting' | 'unknown';
  bleId?: string; // For physical trackers: BLE device ID
}

interface TrackerState {
  trackers: Record<string, Tracker>;
  loading: boolean;
  error: string | null;
  selectedTrackerId: string | null;
}

const initialState: TrackerState = {
  trackers: {},
  loading: false,
  error: null,
  selectedTrackerId: null,
};

const trackerSlice = createSlice({
  name: 'trackers',
  initialState,
  reducers: {
    setTrackers: (state, action: PayloadAction<Tracker[]>) => {
      const trackersMap: Record<string, Tracker> = {};
      action.payload.forEach(tracker => {
        trackersMap[tracker.id] = tracker;
      });
      state.trackers = trackersMap;
    },
    addTracker: (state, action: PayloadAction<Tracker>) => {
      state.trackers[action.payload.id] = action.payload;
    },
    updateTracker: (state, action: PayloadAction<{ id: string; updates: Partial<Tracker> }>) => {
      const { id, updates } = action.payload;
      if (state.trackers[id]) {
        state.trackers[id] = { ...state.trackers[id], ...updates };
      }
    },
    removeTracker: (state, action: PayloadAction<string>) => {
      delete state.trackers[action.payload];
      if (state.selectedTrackerId === action.payload) {
        state.selectedTrackerId = null;
      }
    },
    updateTrackerLocation: (
      state,
      action: PayloadAction<{ id: string; location: LocationPoint }>
    ) => {
      const { id, location } = action.payload;
      if (state.trackers[id]) {
        state.trackers[id].lastSeen = location;
        state.trackers[id].locationHistory = [
          ...state.trackers[id].locationHistory,
          location,
        ].slice(-100); // Keep last 100 points
      }
    },
    setSelectedTracker: (state, action: PayloadAction<string | null>) => {
      state.selectedTrackerId = action.payload;
    },
    setTrackerLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setTrackerError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setTrackers,
  addTracker,
  updateTracker,
  removeTracker,
  updateTrackerLocation,
  setSelectedTracker,
  setTrackerLoading,
  setTrackerError,
} = trackerSlice.actions;

export default trackerSlice.reducer;