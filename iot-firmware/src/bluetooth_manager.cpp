#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include "bluetooth_manager.h"
#include "config.h"

// Global variables
BLEServer* pServer = NULL;
BLECharacteristic* pConfigCharacteristic = NULL;
BLECharacteristic* pStatusCharacteristic = NULL;
BLECharacteristic* pCommandCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
extern DeviceConfig config;
extern void saveConfig();
extern int calculateBatteryLevel();
extern void triggerBuzzer(int duration);

// Callback for client connection/disconnection
class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("BLE client connected");
      digitalWrite(LED_PIN, HIGH); // Turn on LED to indicate connection
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("BLE client disconnected");
      digitalWrite(LED_PIN, LOW); // Turn off LED
      // Restart advertising when disconnected
      pServer->startAdvertising();
    }
};

// Callback for configuration characteristic write
class ConfigCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
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
          
          // Rapid flashing of LED to indicate successful configuration
          for (int i = 0; i < 5; i++) {
            digitalWrite(LED_PIN, HIGH);
            delay(100);
            digitalWrite(LED_PIN, LOW);
            delay(100);
          }
          
          // If WiFi credentials were provided, attempt to connect
          if (doc.containsKey("wifi_ssid") && doc.containsKey("wifi_password")) {
            WiFi.disconnect();
            delay(1000);
            
            Serial.println("Attempting connection with new WiFi credentials");
            WiFi.begin(config.wifi_ssid, config.wifi_password);
            
            // Wait for connection with a timeout
            int attempts = 0;
            while (WiFi.status() != WL_CONNECTED && attempts < 20) {
              delay(500);
              Serial.print(".");
              attempts++;
              
              // Flash LED during connection
              digitalWrite(LED_PIN, !digitalRead(LED_PIN));
            }
            
            if (WiFi.status() == WL_CONNECTED) {
              Serial.println("\nWiFi connected!");
              Serial.print("IP address: ");
              Serial.println(WiFi.localIP());
              
              // Three quick flashes to indicate success
              for (int i = 0; i < 3; i++) {
                digitalWrite(LED_PIN, HIGH);
                delay(50);
                digitalWrite(LED_PIN, LOW);
                delay(50);
              }
            } else {
              Serial.println("\nWiFi connection failed!");
              digitalWrite(LED_PIN, LOW);
            }
          }
        } else {
          Serial.print("JSON parsing error: ");
          Serial.println(error.c_str());
        }
      }
    }
};

// Callback for command characteristic
class CommandCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string value = pCharacteristic->getValue();
      if (value.length() > 0) {
        Serial.print("Received command: ");
        Serial.println(value.c_str());
        
        // Parse JSON command
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, value.c_str());
        
        if (!error) {
          String command = doc["command"] | "";
          
          if (command == "buzzer") {
            // Trigger buzzer
            int duration = doc["duration"] | 1000;
            Serial.print("Activating buzzer for ");
            Serial.print(duration);
            Serial.println("ms");
            triggerBuzzer(duration);
          }
          else if (command == "reset") {
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
          Serial.println("Locate command received - would flash LEDs if connected");
        }
        }
      }
    }
};

void setupBluetooth() {
  // Initialize Bluetooth
  BLEDevice::init("FIND-Tracker");
  
  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  // Create BLE Characteristics
  pConfigCharacteristic = pService->createCharacteristic(
                            CONFIG_CHAR_UUID,
                            BLECharacteristic::PROPERTY_READ |
                            BLECharacteristic::PROPERTY_WRITE
                          );
  pConfigCharacteristic->setCallbacks(new ConfigCallbacks());
  
  pStatusCharacteristic = pService->createCharacteristic(
                            STATUS_CHAR_UUID,
                            BLECharacteristic::PROPERTY_READ |
                            BLECharacteristic::PROPERTY_NOTIFY
                          );
  pStatusCharacteristic->addDescriptor(new BLE2902());
  
  pCommandCharacteristic = pService->createCharacteristic(
                             COMMAND_CHAR_UUID,
                             BLECharacteristic::PROPERTY_WRITE
                           );
  pCommandCharacteristic->setCallbacks(new CommandCallbacks());
  
  // Start the service
  pService->start();
  
  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
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
    pServer->startAdvertising(); // Restart advertising
    oldDeviceConnected = deviceConnected;
  }
  
  // Handle new connections
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}