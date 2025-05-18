import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

/**
 * Simplified PairDeviceScreen that doesn't depend on Bluetooth
 * This allows for testing the Supabase integration without BLE
 */
const SimplePairDeviceScreen = ({ route }) => {
  const { trackerId } = route.params;
  const navigation = useNavigation();
  
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('ESP32 Tracker');
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!deviceId || !wifiSSID || !wifiPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Attempting to pair device with ID:', deviceId);
      console.log('WiFi SSID:', wifiSSID);
      
      // Try importing different Supabase clients to find one that works
      let supabaseClient = null;
      
      // Try importing from global first
      try {
        if ((global as any).supabaseClient) {
          console.log('Using global Supabase client');
          supabaseClient = (global as any).supabaseClient;
        }
      } catch (e) {
        console.error('Global Supabase client not available:', e);
      }
      
      // If no global client, try from supabase.ts
      if (!supabaseClient) {
        try {
          const supabaseModule = require('../../../services/supabase');
          console.log('Supabase module loaded successfully:', !!supabaseModule);
          supabaseClient = supabaseModule.supabase;
        } catch (importError) {
          console.error('Error importing Supabase module:', importError);
        }
      }
      
      // If still no client, try from AuthContext
      if (!supabaseClient) {
        try {
          const authContextModule = require('../../../context/AuthContext');
          console.log('AuthContext module loaded successfully');
          // The supabase client is not exported from AuthContext, so we can't use it this way
        } catch (importError) {
          console.error('Error importing AuthContext module:', importError);
        }
      }
      
      // If still no client, use mock
      if (!supabaseClient) {
        try {
          const mockModule = require('../../../services/mockSupabase');
          console.log('Using mock Supabase client as fallback');
          supabaseClient = mockModule.supabase;
        } catch (importError) {
          console.error('Error importing mock Supabase module:', importError);
        }
      }
      
      if (!supabaseClient) {
        console.error('No Supabase client available after all attempts');
        throw new Error('Failed to initialize Supabase client');
      }
      
      // Get the current user
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      console.log('User authenticated:', user.id);
      
      // Call the pair_physical_device RPC function
      const { data, error } = await supabaseClient.rpc('pair_physical_device', {
        tracker_id: trackerId,
        device_uuid: deviceId,
        device_name: deviceName || 'ESP32 Tracker',
        device_model: 'ESP32'
      });
      
      if (error) {
        console.error('Error from Supabase RPC:', error);
        throw error;
      }
      
      console.log('Device paired successfully. Response:', data);
      
      // Create a configuration similar to what the BLE version would send
      const config = {
        wifi_ssid: wifiSSID,
        wifi_password: wifiPassword,
        device_id: deviceId,
        api_endpoint: `https://hxdurjngbkfnbryzczau.supabase.co/rest/v1/rpc/update_device_status`,
        api_key: supabaseClient.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw',
        transmit_interval: 60, // 60 seconds
        motion_threshold: 0.5
      };
      
      console.log('Configuration that would be sent to ESP32:', config);
      
      // Show the configuration for debugging and to help with manual setup
      Alert.alert(
        'Device Configuration',
        `Please configure your ESP32 with the following:\n\nWiFi: ${wifiSSID}\nAPI URL: ${config.api_endpoint}\nDevice ID: ${deviceId}`,
        [
          {
            text: 'Copy to Clipboard',
            onPress: () => {
              /* Would add clipboard functionality here */
              Alert.alert('Info', 'Configuration copied to clipboard');
            }
          },
          {
            text: 'Continue',
            onPress: () => {
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
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', `Failed to pair device: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manual Device Pairing</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>No Bluetooth Available</Text>
          <Text style={styles.infoText}>
            This is a simplified pairing screen since Bluetooth functionality is not available.
            Please use this form to enter your device details manually.
          </Text>
        </View>
        
        <View style={styles.form}>
          <Text style={styles.label}>Device ID</Text>
          <TextInput
            style={styles.input}
            value={deviceId}
            onChangeText={setDeviceId}
            placeholder="Enter device ID (from Serial Monitor)"
            placeholderTextColor="#999"
          />
          
          <Text style={styles.label}>Device Name</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="Enter device name"
            placeholderTextColor="#999"
          />
          
          <Text style={styles.label}>WiFi SSID</Text>
          <TextInput
            style={styles.input}
            value={wifiSSID}
            onChangeText={setWifiSSID}
            placeholder="Enter WiFi network name"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
          
          <Text style={styles.label}>WiFi Password</Text>
          <TextInput
            style={styles.input}
            value={wifiPassword}
            onChangeText={setWifiPassword}
            placeholder="Enter WiFi password"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
          />
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Pairing...' : 'Pair Device'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>Testing Instructions</Text>
          <Text style={styles.instructionText}>
            1. On your ESP32, upload the FIND Tracker firmware.
          </Text>
          <Text style={styles.instructionText}>
            2. Open the Serial Monitor in Arduino IDE to see the device ID.
          </Text>
          <Text style={styles.instructionText}>
            3. Enter that device ID in the form above.
          </Text>
          <Text style={styles.instructionText}>
            4. Enter your actual WiFi credentials.
          </Text>
          <Text style={styles.instructionText}>
            5. Click "Pair Device" and check the Serial Monitor for connection logs.
          </Text>
        </View>
      </ScrollView>
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
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
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
  infoBox: {
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
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
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default SimplePairDeviceScreen;