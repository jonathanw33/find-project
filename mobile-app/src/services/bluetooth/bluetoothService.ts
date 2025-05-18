import { Platform, Alert } from 'react-native';
import base64 from './bluetoothBase64'; // Using our custom base64 implementation
import { v4 as uuidv4 } from './uuidGenerator'; // Using our custom UUID implementation

// Try to import the regular supabase client, but fall back to mock if it fails
let supabase;
try {
  console.log('Attempting to import Supabase client from global...');
  if ((global as any).supabaseClient) {
    console.log('Using globally initialized Supabase client');
    supabase = (global as any).supabaseClient;
    // Add the anon key directly
    supabase.supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw';
  } else {
    console.log('Global Supabase client not found, trying local import...');
    const supabaseModule = require('../supabase');
    console.log('Supabase module:', supabaseModule);
    supabase = supabaseModule.supabase;
    console.log('Supabase client loaded:', supabase ? 'SUCCESS' : 'NULL');
  }
} catch (error) {
  console.log('Error loading Supabase client:', error);
  console.log('Using default Supabase URL and key');
  // Set default values if we can't load the client
  supabase = {
    supabaseUrl: 'https://hxdurjngbkfnbryzczau.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw',
    auth: {
      getUser: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null })
    },
    rpc: async (func, params) => {
      console.log(`Mock RPC call to ${func} with params:`, params);
      return { data: 'mock-success', error: null };
    }
  };
}
// UUIDs matching the ESP32 firmware
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CONFIG_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const STATUS_CHAR_UUID = '5ac659d8-2583-4add-b315-902e9aed475d';
const COMMAND_CHAR_UUID = '8dd6ce17-8a6b-4cb7-9cab-16edc0578119';

// Flag to check if Bluetooth is available
const isBleAvailable = () => {
  // Check if we're in a development environment that might not support BLE
  if (__DEV__ && Platform.OS === 'web') {
    console.log('BLE is not available in web development mode');
    return false;
  }
  
  // Try to dynamically import the BLE module
  try {
    require('react-native-ble-plx');
    return true;
  } catch (error) {
    console.log('BLE module not available:', error);
    return false;
  }
};

// Mock device for when BLE is not available
const createMockDevice = (id) => ({
  id,
  name: 'Mock FIND-Tracker',
  localName: 'Mock Device',
  rssi: -50,
  mtu: 23,
  manufacturerData: '',
  serviceData: {},
  serviceUUIDs: [SERVICE_UUID],
  solicitedServiceUUIDs: [],
  txPowerLevel: 0,
  isConnectable: true,
  overflowServiceUUIDs: [],
});

class BluetoothService {
  private manager: any;
  private device: any = null;
  private isScanning = false;
  private bleAvailable = false;
  
  constructor() {
    this.bleAvailable = isBleAvailable();
    
    if (this.bleAvailable) {
      try {
        const { BleManager } = require('react-native-ble-plx');
        this.manager = new BleManager();
        console.log('BLE Manager initialized successfully');
      } catch (error) {
        console.error('Failed to initialize BLE Manager:', error);
        this.bleAvailable = false;
      }
    } else {
      console.log('BLE not available, using mock implementation');
    }
  }
  
  // Request permissions (Android only)
  async requestPermissions(): Promise<boolean> {
    if (!this.bleAvailable) {
      console.log('BLE not available, skipping permission request');
      return true;
    }
    
    if (Platform.OS !== 'android') return true;
    
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      
      return (
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted' &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted'
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }
  
  // Start scanning for FIND tracker devices
  async startScan(onDeviceFound: (device: any) => void): Promise<void> {
    if (this.isScanning) return;
    
    // If BLE is not available, simulate finding a device
    if (!this.bleAvailable) {
      console.log('BLE not available, simulating device discovery');
      this.isScanning = true;
      
      // Simulate finding a device after a short delay
      setTimeout(() => {
        const mockDevice = createMockDevice('mock-device-' + Math.floor(Math.random() * 10000));
        onDeviceFound(mockDevice);
        // Auto stop after 3 seconds
        setTimeout(() => this.stopScan(), 3000);
      }, 1500);
      
      return;
    }
    
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }
      
      this.isScanning = true;
      
      // Start scanning for devices with the FIND service UUID
      this.manager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            this.stopScan();
            return;
          }
          
          if (device && device.name && device.name.startsWith('FIND-Tracker')) {
            onDeviceFound(device);
          }
        }
      );
    } catch (error) {
      console.error('Error starting scan:', error);
      this.isScanning = false;
      throw error;
    }
  }
  
  // Stop scanning
  stopScan(): void {
    if (this.isScanning) {
      if (this.bleAvailable && this.manager) {
        this.manager.stopDeviceScan();
      }
      this.isScanning = false;
    }
  }
  
  // Connect to a device
  async connectToDevice(deviceId: string): Promise<any> {
    try {
      this.stopScan();
      
      // If BLE is not available, simulate a connection
      if (!this.bleAvailable) {
        console.log('BLE not available, simulating device connection');
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockDevice = createMockDevice(deviceId);
        this.device = mockDevice;
        console.log('Connected to mock device:', mockDevice.name);
        
        return mockDevice;
      }
      
      // Connect to the device
      const device = await this.manager.connectToDevice(deviceId);
      console.log('Connected to device:', device.name);
      
      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();
      console.log('Discovered services and characteristics');
      
      this.device = device;
      return device;
    } catch (error) {
      console.error('Error connecting to device:', error);
      throw error;
    }
  }
  
  // Disconnect from the device
  async disconnect(): Promise<void> {
    if (this.device) {
      if (this.bleAvailable && this.manager) {
        await this.manager.cancelDeviceConnection(this.device.id);
      }
      this.device = null;
    }
  }
  
  // Configure the device
  async configureDevice(
    device: any,
    trackerId: string,
    wifiSSID: string,
    wifiPassword: string
  ): Promise<boolean> {
    try {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Generate a unique device UUID
      const deviceUuid = uuidv4();
      
      // Create API endpoint for device to post data
      const apiEndpoint = `https://hxdurjngbkfnbryzczau.supabase.co/rest/v1/rpc/update_device_status`;
      
      // Create configuration JSON
      const config = {
        wifi_ssid: wifiSSID,
        wifi_password: wifiPassword,
        device_id: deviceUuid,
        api_endpoint: apiEndpoint,
        api_key: supabase.supabaseAnonKey, // Use the anon key for API access
        transmit_interval: 60, // 60 seconds
        motion_threshold: 0.5
      };
      
      // Convert config to JSON string
      const configJson = JSON.stringify(config);
      
      // If BLE is not available, skip writing to device
      if (!this.bleAvailable) {
        console.log('BLE not available, skipping device configuration');
        console.log('Would have sent this config to the device:', config);
      } else {
        // Write configuration to the device
        await device.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          CONFIG_CHAR_UUID,
          base64.encode(configJson)
        );
      }
      
      console.log('Device configured successfully');
      
      // Register the device in the database
      const { data, error } = await supabase.rpc('pair_physical_device', {
        tracker_id: trackerId,
        device_uuid: deviceUuid,
        device_name: device.name || 'FIND Tracker',
        device_model: 'ESP32'
      });
      
      if (error) {
        console.error('Error registering device:', error);
        return false;
      }
      
      console.log('Device registered in database:', data);
      return true;
    } catch (error) {
      console.error('Error configuring device:', error);
      throw error;
    }
  }
  
  // Send command to the device (e.g., make it beep)
  async sendCommand(device: any, command: string, params: any = {}): Promise<void> {
    try {
      const commandObj = {
        command,
        ...params
      };
      
      const commandJson = JSON.stringify(commandObj);
      
      // If BLE is not available, just log what would have happened
      if (!this.bleAvailable) {
        console.log(`BLE not available, would have sent command: ${command}`);
        console.log('Command data:', commandObj);
        return;
      }
      
      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        COMMAND_CHAR_UUID,
        base64.encode(commandJson)
      );
      
      console.log(`Command ${command} sent successfully`);
    } catch (error) {
      console.error(`Error sending command ${command}:`, error);
      throw error;
    }
  }
  
  // Make the device beep
  async triggerBuzzer(device: any, duration: number = 1000): Promise<void> {
    return this.sendCommand(device, 'buzzer', { duration });
  }
  
  // Reset the device
  async resetDevice(device: any): Promise<void> {
    return this.sendCommand(device, 'reset');
  }
  
  // Factory reset the device
  async factoryResetDevice(device: any): Promise<void> {
    return this.sendCommand(device, 'factory_reset');
  }
  
  // Monitor device status
  async monitorStatus(
    device: any,
    onStatusUpdate: (status: any) => void
  ): Promise<() => void> {
    try {
      // If BLE is not available, simulate status updates
      if (!this.bleAvailable) {
        console.log('BLE not available, simulating status updates');
        
        // Create a mock status
        const mockStatus = {
          battery: 0.85,
          lat: 37.7749,
          lng: -122.4194,
          motion_detected: false,
          timestamp: new Date().toISOString()
        };
        
        // Send initial status
        onStatusUpdate(mockStatus);
        
        // Set up an interval to simulate updates
        const intervalId = setInterval(() => {
          // Update mock values slightly
          mockStatus.battery = Math.max(0, Math.min(1, mockStatus.battery - 0.01));
          mockStatus.lat += (Math.random() - 0.5) * 0.001;
          mockStatus.lng += (Math.random() - 0.5) * 0.001;
          mockStatus.motion_detected = Math.random() > 0.7;
          mockStatus.timestamp = new Date().toISOString();
          
          onStatusUpdate({...mockStatus});
        }, 5000);
        
        // Return cleanup function
        return () => clearInterval(intervalId);
      }
      
      // If BLE is available, use the real subscription
      const subscription = device.monitorCharacteristicForService(
        SERVICE_UUID,
        STATUS_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Error monitoring status:', error);
            return;
          }
          
          if (characteristic && characteristic.value) {
            const statusJson = base64.decode(characteristic.value);
            try {
              const status = JSON.parse(statusJson);
              onStatusUpdate(status);
            } catch (parseError) {
              console.error('Error parsing status JSON:', parseError);
            }
          }
        }
      );
      
      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('Error setting up status monitoring:', error);
      throw error;
    }
  }
}

export const bluetoothService = new BluetoothService();