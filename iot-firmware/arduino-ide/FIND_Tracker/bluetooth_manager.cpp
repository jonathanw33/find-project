#include <Arduino.h>
#include <NimBLEDevice.h>
#include <NimBLEServer.h>
#include <NimBLEUtils.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include "bluetooth_manager.h"
#include "config.h"

// Global variables
NimBLEServer* pServer = NULL;
NimBLECharacteristic* pConfigCharacteristic = NULL;
NimBLECharacteristic* pStatusCharacteristic = NULL;
NimBLECharacteristic* pCommandCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
extern DeviceConfig config;
extern void saveConfig();
extern int calculateBatteryLevel();

// Callback for client connection/disconnection
class ServerCallbacks: public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer) {
      deviceConnected = true;
      Serial.println("BLE client connected");
    };

    void onDisconnect(NimBLEServer* pServer) {
      deviceConnected = false;
      Serial.println("BLE client disconnected");
      // Restart advertising when disconnected
      NimBLEDevice::startAdvertising();
    }
};

// Callback for configuration characteristic write
class ConfigCallbacks: public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic *pCharacteristic) {
      std::string value = pCharacteristic->getValue();
      if (value.length() > 0) {
        Serial.println("Received configuration data");
        
        // Parse JSON configuration
        DynamicJsonDocument doc(1024);
        DeserializationError error = deserializeJson(doc, value.c_str());
        
        if (!error) {
          // Update WiFi credentials
          if (doc.containsKey("wifi_ssid") && doc.containsKey("wifi_password")) {
            strlcpy(config.wifi_ssid, doc["wifi_ssid"] | "", sizeof(config.wifi_ssid));
            strlcpy(config.wifi_password, doc["wifi_password"] | "", sizeof(config.wifi_password));
            Serial.print("WiFi SSID set to: ");
            Serial.println(config.wifi_ssid);
          }
          
          // Update device ID
          if (doc.containsKey("device_id")) {
            strlcpy(config.device_id, doc["device_id"] | "", sizeof(config.device_id));
            Serial.print("Device ID set to: ");
            Serial.println(config.device_id);
          }
          
          // Update API endpoint
          if (doc.containsKey("api_endpoint")) {
            strlcpy(config.api_endpoint, doc["api_endpoint"] | "", sizeof(config.api_endpoint));
            Serial.print("API endpoint set to: ");
            Serial.println(config.api_endpoint);
          }
          
          // Update API key
          if (doc.containsKey("api_key")) {
            strlcpy(config.api_key, doc["api_key"] | "", sizeof(config.api_key));
            Serial.println("API key updated");
          }
          
          // Update transmission interval
          if (doc.containsKey("transmit_interval")) {
            config.transmit_interval = doc["transmit_interval"] | DEFAULT_TRANSMIT_INTERVAL;
            Serial.print("Transmit interval set to: ");
            Serial.print(config.transmit_interval);
            Serial.println(" seconds");
          }
          
          // Update motion threshold
          if (doc.containsKey("motion_threshold")) {
            config.motion_threshold = doc["motion_threshold"] | DEFAULT_MOTION_THRESHOLD;
            Serial.print("Motion threshold set to: ");
            Serial.println(config.motion_threshold);
          }
          
          // Mark as paired
          config.paired = true;
          
          // Save configuration
          saveConfig();
          
          Serial.println("Configuration updated and saved");
          
          // If WiFi credentials were provided, attempt to connect
          if (doc.containsKey("wifi_ssid") && doc.containsKey("wifi_password")) {
            WiFi.disconnect();
            delay(1000);
            
            Serial.println("Attempting connection with new WiFi credentials");
            WiFi.begin(config.wifi_ssid, config.wifi_password);
          }
        } else {
          Serial.print("JSON parsing error: ");
          Serial.println(error.c_str());
        }
      }
    }
};

// Callback for command characteristic
class CommandCallbacks: public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic *pCharacteristic) {
      std::string value = pCharacteristic->getValue();
      if (value.length() > 0) {
        Serial.print("Received command: ");
        Serial.println(value.c_str());
        
        // Parse JSON command
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, value.c_str());
        
        if (!error) {
          String command = doc["command"] | "";
          
          if (command == "reset") {
            // Reset device
            Serial.println("Resetting device...");
            delay(1000);
            ESP.restart();
          }
          else if (command == "factory_reset") {
            // Clear configuration
            Serial.println("Performing factory reset...");
            memset(&config, 0, sizeof(config));
            saveConfig();
            delay(1000);
            ESP.restart();
          } 
          else if (command == "locate") {
            // Just log to serial since we don't have visual indicators
            Serial.println("Locate command received - would flash indicators if connected");
          }
        }
      }
    }
};

void setupBluetooth() {
  // Initialize Bluetooth
  NimBLEDevice::init("FIND-Tracker");
  
  // Set low power mode
  NimBLEDevice::setPower(ESP_PWR_LVL_P3); // +3db
  
  // Create the BLE Server
  pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  // Create the BLE Service
  NimBLEService *pService = pServer->createService(SERVICE_UUID);
  
  // Create BLE Characteristics
  pConfigCharacteristic = pService->createCharacteristic(
                            CONFIG_CHAR_UUID,
                            NIMBLE_PROPERTY::READ |
                            NIMBLE_PROPERTY::WRITE
                          );
  pConfigCharacteristic->setCallbacks(new ConfigCallbacks());
  
  pStatusCharacteristic = pService->createCharacteristic(
                            STATUS_CHAR_UUID,
                            NIMBLE_PROPERTY::READ |
                            NIMBLE_PROPERTY::NOTIFY
                          );
  
  pCommandCharacteristic = pService->createCharacteristic(
                             COMMAND_CHAR_UUID,
                             NIMBLE_PROPERTY::WRITE
                           );
  pCommandCharacteristic->setCallbacks(new CommandCallbacks());
  
  // Start the service
  pService->start();
  
  // Start advertising
  NimBLEAdvertising *pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  
  // Simply remove the setScanResponse line completely
  
  // Start advertising
  NimBLEDevice::startAdvertising();
  
  Serial.println("Bluetooth setup complete, waiting for connections...");
}

void updateBLEStatus(float lat, float lng, float accX, float accY, float accZ, bool motion) {
  if (deviceConnected) {
    // Create status JSON
    DynamicJsonDocument doc(256);
    doc["lat"] = lat;
    doc["lng"] = lng;
    doc["acc_x"] = accX;
    doc["acc_y"] = accY;
    doc["acc_z"] = accZ;
    doc["motion"] = motion;
    doc["battery"] = calculateBatteryLevel();
    
    String statusJson;
    serializeJson(doc, statusJson);
    
    // Update characteristic
    pStatusCharacteristic->setValue(statusJson.c_str());
    pStatusCharacteristic->notify();
  }
  
  // Handle reconnections
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // Give time for notifications
    NimBLEDevice::startAdvertising(); // Restart advertising
    oldDeviceConnected = deviceConnected;
  }
  
  // Handle new connections
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}