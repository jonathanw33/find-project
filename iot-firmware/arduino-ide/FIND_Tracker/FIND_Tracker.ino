#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>
#include <MPU6050_tockn.h>
#include <Wire.h>
#include <EEPROM.h>
#include "config.h"
#include "bluetooth_manager.h"
#include <NimBLEDevice.h>

// Objects
TinyGPSPlus gps;
MPU6050 mpu(Wire);
HardwareSerial GPSSerial(1);

// Variables
float latitude = 0, longitude = 0, hdop = 0;
int satellites = 0;
float accX = 0, accY = 0, accZ = 0;
float gyroX = 0, gyroY = 0, gyroZ = 0;
float temperature = 0;
unsigned long lastTransmitTime = 0;
unsigned long lastMotionCheckTime = 0;
bool motionDetected = false;
unsigned long motionStartTime = 0;
String deviceId = "";
bool hasGpsFix = false;
unsigned long lastGpsFixTime = 0;
int batteryLevel = -1;
DeviceConfig config;

// Function declarations
void loadConfig();
void saveConfig();
void connectWiFi();
void readGPS();
void readMPU();
bool checkMotion();
void transmitData();
int calculateBatteryLevel();
void enterLowPowerMode();

void setup() {
  Serial.begin(115200);
  Serial.println("FIND Tracker v" FIRMWARE_VERSION " Initializing...");
  
  // Initialize GPS
  GPSSerial.begin(GPS_BAUDRATE, SERIAL_8N1, GPS_RX, GPS_TX);
  Serial.println("GPS initialized");
  
  // Initialize I2C and MPU
  Wire.begin(MPU_SDA, MPU_SCL);
  mpu.begin();
  mpu.calcGyroOffsets(true);
  Serial.println("MPU initialized");
  
  // Load configuration
  loadConfig();
  
  if (strlen(config.device_id) > 0 && config.device_id[0] != '\0' && config.device_id[0] != 255) {
    deviceId = String(config.device_id);
    Serial.print("Using device ID: ");
    Serial.println(deviceId);
  } 
  // Show device ID
  if (strlen(config.device_id) > 0 && config.device_id[0] != '\0' && config.device_id[0] != 255) {
    deviceId = String(config.device_id);
    Serial.print("Device ID: ");
    Serial.println(deviceId);
  } else {
    Serial.println("No device ID set - needs pairing");
    // Clear the device ID to ensure it's properly blank
    memset(config.device_id, 0, sizeof(config.device_id));
  }
  
  // Setup Bluetooth for pairing
  setupBluetooth();
  Serial.println("Bluetooth initialized");
  
  // Connect to WiFi if configured
  if (config.paired) {
    connectWiFi();
  }
  
  // Initial battery level check
  batteryLevel = calculateBatteryLevel();
  Serial.print("Initial battery level: ");
  Serial.print(batteryLevel);
  Serial.println("%");
  
  Serial.println("FIND Tracker Ready!");
}

void loop() {
  // Read sensor data
  readGPS();
  readMPU();
  
  // Update BLE status if connected
  updateBLEStatus(latitude, longitude, accX, accY, accZ, motionDetected);
  
  // Check for motion
  if (millis() - lastMotionCheckTime > MOTION_CHECK_INTERVAL_MS) {
    lastMotionCheckTime = millis();
    
    bool currentMotion = checkMotion();
    
    // State change from still to motion
    if (!motionDetected && currentMotion) {
      motionDetected = true;
      motionStartTime = millis();
      
      // Transmit immediately when motion starts
      if (config.paired && WiFi.status() == WL_CONNECTED) {
        transmitData();
      }
    } 
    // State change from motion to still
    else if (motionDetected && !currentMotion) {
      motionDetected = false;
      
      // Transmit when motion stops
      if (config.paired && WiFi.status() == WL_CONNECTED) {
        transmitData();
      }
    }
  }
  
  // Regular transmission interval for paired devices
  if (config.paired && 
      WiFi.status() == WL_CONNECTED && 
      millis() - lastTransmitTime > config.transmit_interval * 1000) {
    lastTransmitTime = millis();
    transmitData();
  }
  
  // Enter low power mode if no motion detected for a while
  if (!motionDetected && 
      millis() - motionStartTime > MOTION_INACTIVE_TIMEOUT_SEC * 1000) {
    enterLowPowerMode();
  }
  
  // Short delay
  delay(10);
}

void loadConfig() {
  EEPROM.begin(512);
  EEPROM.get(0, config);
  EEPROM.end();
  
  // Check if configuration is valid by examining key fields
  bool configValid = true;
  
  // Check if memory is uninitialized (typically 0xFF in fresh EEPROM)
  if (config.transmit_interval == 0 || config.transmit_interval == 0xFFFF) {
    configValid = false;
  }
  
  // Check device_id validity - if first character is non-printable, it's probably invalid
  if (config.device_id[0] < 32 || config.device_id[0] > 126) {
    // Clear the device ID to make sure it's properly blank
    memset(config.device_id, 0, sizeof(config.device_id));
    configValid = false;
  }
  
  // Set default values if configuration is invalid
  if (!configValid) {
    Serial.println("Invalid or missing configuration, setting defaults");
    config.transmit_interval = DEFAULT_TRANSMIT_INTERVAL;
    config.motion_threshold = DEFAULT_MOTION_THRESHOLD;
    config.paired = false;
    
    // Clear WiFi credentials
    memset(config.wifi_ssid, 0, sizeof(config.wifi_ssid));
    memset(config.wifi_password, 0, sizeof(config.wifi_password));
    
    // Clear API configuration
    memset(config.api_endpoint, 0, sizeof(config.api_endpoint));
    memset(config.api_key, 0, sizeof(config.api_key));
    
    // Save default configuration
    EEPROM.begin(512);
    EEPROM.put(0, config);
    EEPROM.commit();
    EEPROM.end();
  }
}

void saveConfig() {
  EEPROM.begin(512);
  EEPROM.put(0, config);
  EEPROM.commit();
  EEPROM.end();
  
  // Update device ID
  deviceId = String(config.device_id);
}

void connectWiFi() {
  if (strlen(config.wifi_ssid) == 0) {
    return; // No WiFi credentials, don't try to connect
  }
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(config.wifi_ssid);
  
  WiFi.begin(config.wifi_ssid, config.wifi_password);
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && 
         millis() - startTime < WIFI_CONNECT_TIMEOUT_MS) {
    delay(500);
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed!");
    WiFi.disconnect();
  }
}

void readGPS() {
  unsigned long gpsStartTime = millis();
  bool newData = false;
  
  // Process GPS data
  while (GPSSerial.available() > 0) {
    char c = GPSSerial.read();
    if (gps.encode(c)) {
      newData = true;
    }
  }
  
  // Update coordinates if we have valid GPS data
  if (newData && gps.location.isValid()) {
    latitude = gps.location.lat();
    longitude = gps.location.lng();
    
    if (gps.hdop.isValid()) {
      hdop = gps.hdop.hdop();
    }
    
    if (gps.satellites.isValid()) {
      satellites = gps.satellites.value();
    }
    
    // Update fix status
    hasGpsFix = true;
    lastGpsFixTime = millis();
    
    // Debug output
    Serial.print("GPS: ");
    Serial.print(latitude, 6);
    Serial.print(", ");
    Serial.print(longitude, 6);
    Serial.print(" (HDOP: ");
    Serial.print(hdop);
    Serial.print(", Satellites: ");
    Serial.print(satellites);
    Serial.println(")");
  } else if (millis() - lastGpsFixTime > GPS_FIX_TIMEOUT_MS) {
    // No valid fix for a while
    hasGpsFix = false;
  }
}

void readMPU() {
  mpu.update();
  
  accX = mpu.getAccX();
  accY = mpu.getAccY();
  accZ = mpu.getAccZ();
  
  gyroX = mpu.getGyroX();
  gyroY = mpu.getGyroY();
  gyroZ = mpu.getGyroZ();
  
  temperature = mpu.getTemp();
}

bool checkMotion() {
  // Calculate acceleration magnitude
  float accMagnitude = sqrt(accX*accX + accY*accY + accZ*accZ);
  
  // Check if magnitude exceeds threshold (removing 1g for gravity)
  float motionMagnitude = abs(accMagnitude - 1.0);
  
  return motionMagnitude > config.motion_threshold;
}

void transmitData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Attempting to reconnect...");
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      return; // Still not connected, exit
    }
  }
  
  // Check if we have a valid device ID
  if (strlen(config.device_id) == 0) {
    Serial.println("No device ID configured, cannot transmit data");
    return;
  }
  
  // Update battery level
  batteryLevel = calculateBatteryLevel();
  
  // Create JSON document
  DynamicJsonDocument doc(1024);
  
  // Basic device info
  doc["device_uuid"] = config.device_id;
  doc["battery_level"] = batteryLevel;
  
  // Location data (only if we have a GPS fix)
  if (hasGpsFix) {
    doc["latitude"] = latitude;
    doc["longitude"] = longitude;
    doc["accuracy"] = hdop * 5.0; // Rough estimate of accuracy in meters
  }
  
  // Motion data
  JsonObject motion = doc.createNestedObject("motion_data");
  motion["acc_x"] = accX;
  motion["acc_y"] = accY;
  motion["acc_z"] = accZ;
  motion["gyro_x"] = gyroX;
  motion["gyro_y"] = gyroY;
  motion["gyro_z"] = gyroZ;
  motion["motion_detected"] = motionDetected;
  motion["temperature"] = temperature;
  
  // Convert to JSON string
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Transmitting data: ");
  Serial.println(jsonString);
  
  // Send to server
  HTTPClient http;
  http.begin(config.api_endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + config.api_key);
  http.setConnectTimeout(API_TIMEOUT_MS);
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    String payload = http.getString();
    Serial.println("HTTP Response code: " + String(httpCode));
    Serial.println("Response: " + payload);
  } else {
    Serial.println("Error on HTTP request: " + String(httpCode));
  }
  
  http.end();
  
  // Update last transmit time
  lastTransmitTime = millis();
}

int calculateBatteryLevel() {
  // Read battery voltage from analog pin
  int rawValue = analogRead(BATTERY_PIN);
  float voltage = rawValue * 3.3 / 4095 * BATTERY_MULTIPLIER; // Convert to voltage
  
  // Map voltage to percent (simple linear mapping)
  int percent = map(voltage * 100, 
                    MIN_BATTERY_VOLTAGE * 100, 
                    MAX_BATTERY_VOLTAGE * 100, 
                    0, 100);
  
  // Constrain to 0-100 range
  percent = constrain(percent, 0, 100);
  
  return percent;
}

void enterLowPowerMode() {
  // Implement low power mode here - can be expanded later with deep sleep
  Serial.println("Entering low power mode...");
  
  // Reduce power consumption
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  
  // Light sleep for a while (easier to wake up than deep sleep)
  esp_sleep_enable_timer_wakeup(LIGHT_SLEEP_DURATION_SEC * 1000000ULL);
  
  // Wait a moment for serial output to complete
  delay(100);
  
  // Enter light sleep
  esp_light_sleep_start();
  
  // Code continues here after waking up
  Serial.println("Woke up from light sleep");
  
  // Reconnect WiFi if paired
  if (config.paired) {
    connectWiFi();
  }
}