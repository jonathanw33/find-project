import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../../navigation';
import { bluetoothService } from '../../../services/bluetooth/bluetoothService';
import { Device } from 'react-native-ble-plx';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = StackNavigationProp<MainStackParamList>;

interface PairDeviceScreenProps {
  route: {
    params: {
      trackerId: string;
    };
  };
}

const PairDeviceScreen: React.FC<PairDeviceScreenProps> = ({ route }) => {
  const { trackerId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [statusUpdates, setStatusUpdates] = useState<any>(null);
  
  // Check BLE availability on mount and offer to switch to Simple screen if not available
  useEffect(() => {
    // Check if BLE is available by using the tryStartScan method
    const checkBleAvailability = async () => {
      try {
        await bluetoothService.startScan(() => {});
        // If we reach here, BLE is working - immediately stop the scan
        bluetoothService.stopScan();
      } catch (error) {
        console.log('BLE not available, offering to switch to simple pairing screen');
        Alert.alert(
          'Bluetooth Not Available',
          'Bluetooth Low Energy is not available on this device or environment. Would you like to use the simplified pairing screen instead?',
          [
            {
              text: 'No, Stay Here',
              style: 'cancel'
            },
            {
              text: 'Yes, Use Simple Pairing',
              onPress: () => navigation.replace('SimplePairDevice', { trackerId })
            }
          ]
        );
      }
    };
    
    checkBleAvailability();
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up Bluetooth resources...');
      bluetoothService.stopScan();
      if (isConnected) {
        bluetoothService.disconnect()
          .catch(err => console.error('Error disconnecting:', err));
      }
    };
  }, [isConnected]);
  
  // Clear devices when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setDevices([]);
      return () => {
        bluetoothService.stopScan();
      };
    }, [])
  );
  
  const startScan = async () => {
    try {
      setIsScanning(true);
      setDevices([]);
      
      await bluetoothService.startScan((device) => {
        // Add device to list if not already present
        setDevices((prevDevices) => {
          if (!prevDevices.some((d) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      });
      
      // Auto-stop scan after 15 seconds
      setTimeout(() => {
        if (isScanning) {
          bluetoothService.stopScan();
          setIsScanning(false);
        }
      }, 15000);
    } catch (error) {
      console.error('Error starting scan:', error);
      Alert.alert(
        'Bluetooth Error', 
        'Failed to start scanning for devices. Would you like to use the simplified pairing screen instead?',
        [
          {
            text: 'No, Try Again',
            onPress: () => setIsScanning(false),
            style: 'cancel'
          },
          {
            text: 'Yes, Use Simple Pairing',
            onPress: () => navigation.navigate('SimplePairDevice', { trackerId })
          }
        ]
      );
      setIsScanning(false);
    }
  };
  
  const stopScan = () => {
    bluetoothService.stopScan();
    setIsScanning(false);
  };
  
  const connectToDevice = async (device: Device) => {
    try {
      setSelectedDevice(device);
      setIsConnecting(true);
      
      const connectedDevice = await bluetoothService.connectToDevice(device.id);
      setIsConnected(true);
      
      // Set up status monitoring
      const unsubscribe = await bluetoothService.monitorStatus(connectedDevice, (status) => {
        setStatusUpdates(status);
      });
      
      // Clean up monitoring on disconnect
      setTimeout(() => {
        setShowWifiModal(true);
      }, 500);
      
      setIsConnecting(false);
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to connect to the device');
      setSelectedDevice(null);
      setIsConnecting(false);
    }
  };
  
  const configureDevice = async () => {
    if (!selectedDevice || !isConnected) {
      Alert.alert('Error', 'Device not connected');
      return;
    }
    
    if (!wifiSSID || !wifiPassword) {
      Alert.alert('Error', 'Please enter both WiFi SSID and password');
      return;
    }
    
    try {
      setIsConfiguring(true);
      
      const success = await bluetoothService.configureDevice(
        selectedDevice,
        trackerId,
        wifiSSID,
        wifiPassword
      );
      
      setIsConfiguring(false);
      setShowWifiModal(false);
      
      if (success) {
        Alert.alert(
          'Device Paired',
          'The tracker has been successfully paired and configured.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Pairing Error', 'Failed to register the device in the database');
      }
    } catch (error) {
      setIsConfiguring(false);
      Alert.alert('Configuration Error', 'Failed to configure the device');
    }
  };
  
  const triggerBuzzer = async () => {
    if (!selectedDevice || !isConnected) {
      Alert.alert('Error', 'Device not connected');
      return;
    }
    
    try {
      await bluetoothService.triggerBuzzer(selectedDevice, 2000);
      Alert.alert('Success', 'Buzzer activated');
    } catch (error) {
      Alert.alert('Error', 'Failed to trigger buzzer');
    }
  };
  
  const renderDeviceItem = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
      disabled={isConnecting || isConnected}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>ID: {item.id.substr(item.id.length - 8)}</Text>
        <Text style={styles.deviceRssi}>Signal: {item.rssi || 'N/A'} dBm</Text>
      </View>
      <Ionicons name="bluetooth" size={24} color="#007AFF" />
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Pair Physical Tracker</Text>
      </View>
      
      <View style={styles.content}>
        {isConnected ? (
          <View style={styles.connectedContainer}>
            <View style={styles.connectedDevice}>
              <Ionicons name="bluetooth" size={30} color="#4CAF50" />
              <Text style={styles.connectedText}>Connected to {selectedDevice?.name}</Text>
            </View>
            
            {statusUpdates && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusTitle}>Device Status:</Text>
                {statusUpdates.lat && statusUpdates.lng && (
                  <Text style={styles.statusText}>
                    Location: {statusUpdates.lat.toFixed(6)}, {statusUpdates.lng.toFixed(6)}
                  </Text>
                )}
                {statusUpdates.battery && (
                  <Text style={styles.statusText}>
                    Battery: {(statusUpdates.battery * 100).toFixed(0)}%
                  </Text>
                )}
                {statusUpdates.motion !== undefined && (
                  <Text style={styles.statusText}>
                    Motion Detected: {statusUpdates.motion ? 'Yes' : 'No'}
                  </Text>
                )}
              </View>
            )}
            
            <TouchableOpacity style={styles.actionButton} onPress={triggerBuzzer}>
              <Ionicons name="notifications" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Test Buzzer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionTitle}>How to pair your device:</Text>
              <Text style={styles.instructionText}>1. Make sure your tracker is powered on</Text>
              <Text style={styles.instructionText}>2. Press "Scan for Devices" below</Text>
              <Text style={styles.instructionText}>3. Select your tracker from the list</Text>
              <Text style={styles.instructionText}>4. Enter your WiFi credentials to complete setup</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.scanButton, isScanning && styles.stopButton]}
              onPress={isScanning ? stopScan : startScan}
              disabled={isConnecting}
            >
              {isScanning ? (
                <>
                  <Ionicons name="stop-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>Stop Scanning</Text>
                </>
              ) : (
                <>
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>Scan for Devices</Text>
                </>
              )}
            </TouchableOpacity>
            
            {isScanning && (
              <View style={styles.scanningIndicator}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.scanningText}>Scanning for FIND trackers...</Text>
              </View>
            )}
            
            {devices.length > 0 && (
              <View style={styles.devicesContainer}>
                <Text style={styles.devicesTitle}>Available Devices</Text>
                <FlatList
                  data={devices}
                  renderItem={renderDeviceItem}
                  keyExtractor={(item) => item.id}
                  style={styles.devicesList}
                />
              </View>
            )}
            
            {isConnecting && (
              <View style={styles.connectingOverlay}>
                <View style={styles.connectingCard}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.connectingText}>Connecting to device...</Text>
                </View>
              </View>
            )}
          </>
        )}
      </View>
      
      {/* WiFi Configuration Modal */}
      <Modal
        visible={showWifiModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWifiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure WiFi</Text>
            <Text style={styles.modalText}>
              Enter your WiFi credentials to connect your tracker to the internet.
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="WiFi SSID (Network Name)"
              value={wifiSSID}
              onChangeText={setWifiSSID}
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="WiFi Password"
              value={wifiPassword}
              onChangeText={setWifiPassword}
              secureTextEntry={true}
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWifiModal(false)}
                disabled={isConfiguring}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.configureButton]}
                onPress={configureDevice}
                disabled={isConfiguring}
              >
                {isConfiguring ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.configureButtonText}>Configure</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 16,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scanningText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
  },
  devicesContainer: {
    flex: 1,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  devicesList: {
    flex: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  deviceRssi: {
    fontSize: 12,
    color: '#666',
  },
  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  connectingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  connectingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  connectedContainer: {
    flex: 1,
    alignItems: 'center',
  },
  connectedDevice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  connectedText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#F1F1F1',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  configureButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  configureButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default PairDeviceScreen;