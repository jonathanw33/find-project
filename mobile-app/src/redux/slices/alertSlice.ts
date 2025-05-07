import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Alert {
  id: string;
  trackerId: string;
  type: 'left_behind' | 'moved' | 'low_battery' | 'out_of_range' | 'custom';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  isActive: boolean;
  icon?: string;
  data?: Record<string, any>; // Additional data for specific alert types
}

interface AlertState {
  alerts: Record<string, Alert>;
  loading: boolean;
  error: string | null;
}

const initialState: AlertState = {
  alerts: {},
  loading: false,
  error: null,
};

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      const alertsMap: Record<string, Alert> = {};
      action.payload.forEach(alert => {
        alertsMap[alert.id] = alert;
      });
      state.alerts = alertsMap;
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts[action.payload.id] = action.payload;
    },
    updateAlert: (state, action: PayloadAction<{ id: string; updates: Partial<Alert> }>) => {
      const { id, updates } = action.payload;
      if (state.alerts[id]) {
        state.alerts[id] = { ...state.alerts[id], ...updates };
      }
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      delete state.alerts[action.payload];
    },
    markAlertAsRead: (state, action: PayloadAction<string>) => {
      if (state.alerts[action.payload]) {
        state.alerts[action.payload].isRead = true;
      }
    },
    markAllAlertsAsRead: (state) => {
      Object.keys(state.alerts).forEach(id => {
        state.alerts[id].isRead = true;
      });
    },
    setAlertLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAlertError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearInactiveAlerts: (state) => {
      Object.keys(state.alerts).forEach(id => {
        if (!state.alerts[id].isActive) {
          delete state.alerts[id];
        }
      });
    },
  },
});

export const {
  setAlerts,
  addAlert,
  updateAlert,
  removeAlert,
  markAlertAsRead,
  markAllAlertsAsRead,
  setAlertLoading,
  setAlertError,
  clearInactiveAlerts,
} = alertSlice.actions;

export default alertSlice.reducer;