// Mock data service to avoid network calls
export const mockUserData = {
  id: 'mock-user-id',
  email: 'user@example.com',
  name: 'Demo User',
  avatarUrl: null,
};

export const mockTrackers = [
  {
    id: 'tracker-1',
    name: 'Home Keys',
    type: 'virtual',
    isActive: true,
    lastSeen: {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: Date.now(),
    },
    locationHistory: [],
  },
  {
    id: 'tracker-2',
    name: 'Wallet',
    type: 'virtual',
    isActive: true,
    lastSeen: {
      latitude: 37.7756,
      longitude: -122.4198,
      timestamp: Date.now(),
    },
    locationHistory: [],
  },
];

export const mockAlerts = [];

// Mock authentication functions
export const mockAuth = {
  signUp: async () => ({ user: mockUserData, error: null }),
  signIn: async () => ({ user: mockUserData, error: null }),
  signOut: async () => ({ error: null }),
  getSession: async () => ({ data: { session: { user: mockUserData } }, error: null }),
};

// Mock database functions
export const mockDB = {
  getTrackers: async () => ({ data: mockTrackers, error: null }),
  getAlerts: async () => ({ data: mockAlerts, error: null }),
};
