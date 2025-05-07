/**
 * FIND System - IoT Tracker Firmware
 * Main application file for ESP32-based tracker
 * 
 * Features:
 * - BLE communication with mobile app
 * - Deep sleep power management
 * - Accelerometer-based motion detection
 * - LED and buzzer for alerts
 * - Battery monitoring
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// Forward declarations
void setupBLE();
void setupAccelerometer();
void enterDeepSleep();
void checkBattery();
void handleMotionInterrupt();
void setupLED();
void setupBuzzer();
void toggleLED(bool state);
void playAlert();

// Pin definitions
const int LED_PIN = 2;        // Onboard LED on most ESP32 development boards
const int BUZZER_PIN = 4;     // Example pin for buzzer
const int BUTTON_PIN = 0;     // Boot button on most ESP32 development boards
const int MPU_INT_PIN = 15;   // Interrupt pin from accelerometer
const int BATTERY_PIN = 34;   // ADC pin for battery monitoring

// BLE UUIDs
#define SERVICE_UUID           "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Global variables
BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
Adafruit_MPU6050 mpu;
bool motionDetected = false;
unsigned long lastWakeupTime = 0;
unsigned long deepSleepDelay = 30000; // 30 seconds before deep sleep
float batteryVoltage = 0.0;
int batteryPercentage = 100;

// BLE callbacks
class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Device connected");
    }

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Device disconnected");
    }
};

class CharacteristicCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string value = pCharacteristic->getValue();
      if (value.length() > 0) {
        Serial.print("Received value: ");
        for (int i = 0; i < value.length(); i++) {
          Serial.print(value[i]);
        }
        Serial.println();

        // Process commands from mobile app
        if (value == "ALERT") {
          playAlert();
        } else if (value == "LED_ON") {
          toggleLED(true);
        } else if (value == "LED_OFF") {
          toggleLED(false);
        }
      }
    }
};

void IRAM_ATTR motionISR() {
  motionDetected = true;
}

void setup() {
  Serial.begin(115200);
  Serial.println("FIND Tracker starting up...");

  // Initialize hardware
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(MPU_INT_PIN, INPUT_PULLUP);
  
  // Flash LED to indicate power on
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
  
  // Setup BLE
  setupBLE();
  
  // Setup accelerometer
  setupAccelerometer();
  
  // Attach interrupt for motion detection
  attachInterrupt(digitalPinToInterrupt(MPU_INT_PIN), motionISR, RISING);
  
  // Check battery level
  checkBattery();
  
  lastWakeupTime = millis();
  Serial.println("Setup complete");
}

void loop() {
  // Handle BLE connections
  if (deviceConnected) {
    // If connected to the app, send regular updates
    unsigned long currentTime = millis();
    static unsigned long lastUpdateTime = 0;
    
    if (currentTime - lastUpdateTime > 1000) { // Update every second
      lastUpdateTime = currentTime;
      
      // Create JSON with sensor data
      String jsonData = "{";
      jsonData += "\"battery\":" + String(batteryPercentage) + ",";
      jsonData += "\"motion\":" + String(motionDetected ? 1 : 0) + ",";
      jsonData += "\"uptime\":" + String(currentTime / 1000);
      jsonData += "}";
      
      // Send data over BLE
      pCharacteristic->setValue(jsonData.c_str());
      pCharacteristic->notify();
      
      // Reset motion flag after reporting
      motionDetected = false;
    }
    
    // Reset sleep timer when connected
    lastWakeupTime = millis();
  }
  
  // Handle reconnecting
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // Give BLE stack time to get ready
    pServer->startAdvertising(); // Restart advertising
    Serial.println("Started advertising");
    oldDeviceConnected = deviceConnected;
  }
  
  // Handle new connection
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
  
  // Check if button is pressed
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      // Button is pressed, do something
      toggleLED(true);
      delay(500);
      toggleLED(false);
      
      // Reset sleep timer
      lastWakeupTime = millis();
    }
  }
  
  // Check if we should enter deep sleep
  if (!deviceConnected && (millis() - lastWakeupTime > deepSleepDelay)) {
    Serial.println("Entering deep sleep mode");
    enterDeepSleep();
  }
  
  // Check battery periodically
  static unsigned long lastBatteryCheck = 0;
  if (millis() - lastBatteryCheck > 60000) { // Every minute
    checkBattery();
    lastBatteryCheck = millis();
  }
}

void setupBLE() {
  Serial.println("Initializing BLE...");
  
  // Create the BLE Device
  BLEDevice::init("FIND_Tracker");
  
  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  // Create a BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );
                    
  pCharacteristic->setCallbacks(new CharacteristicCallbacks());
  
  // Create a BLE Descriptor
  pCharacteristic->addDescriptor(new BLE2902());
  
  // Start the service
  pService->start();
  
  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // iPhone compatibility
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("BLE initialized, advertising started");
}

void setupAccelerometer() {
  Serial.println("Initializing accelerometer...");
  
  Wire.begin();
  
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 sensor!");
    while (1) {
      delay(10);
    }
  }
  
  // Set accelerometer range
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  
  // Setup motion detection
  mpu.setHighPassFilter(MPU6050_HIGHPASS_0_63_HZ);
  mpu.setMotionDetectionThreshold(1); // 1g
  mpu.setMotionDetectionDuration(20); // 20ms
  mpu.setInterruptPinLatch(true);
  mpu.setInterruptPinPolarity(true);
  mpu.setMotionInterrupt(true);
  
  Serial.println("Accelerometer initialized");
}

void enterDeepSleep() {
  Serial.println("Going to deep sleep now");
  
  // Enable wakeup sources
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_15, HIGH); // MPU interrupt
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_0, LOW);   // Button press
  
  // Set timer wakeup as backup (10 minutes)
  esp_sleep_enable_timer_wakeup(10 * 60 * 1000000ULL);
  
  // Go to deep sleep
  esp_deep_sleep_start();
}

void checkBattery() {
  // Read battery voltage
  int rawValue = analogRead(BATTERY_PIN);
  
  // Convert to voltage (depends on voltage divider)
  batteryVoltage = rawValue * (3.3 / 4095.0) * 2; // Assuming a 1:1 voltage divider
  
  // Convert to percentage (assuming LiPo 3.7V battery)
  batteryPercentage = map(batteryVoltage * 100, 320, 420, 0, 100);
  batteryPercentage = constrain(batteryPercentage, 0, 100);
  
  Serial.print("Battery: ");
  Serial.print(batteryVoltage);
  Serial.print("V, ");
  Serial.print(batteryPercentage);
  Serial.println("%");
  
  // Warn if battery is low
  if (batteryPercentage < 20) {
    Serial.println("WARNING: Low battery!");
    // Flash LED to indicate low battery
    for (int i = 0; i < 5; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(100);
      digitalWrite(LED_PIN, LOW);
      delay(100);
    }
  }
}

void toggleLED(bool state) {
  digitalWrite(LED_PIN, state ? HIGH : LOW);
}

void playAlert() {
  Serial.println("Playing alert sound");
  
  // Play a beep pattern
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    toggleLED(true);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    toggleLED(false);
    delay(200);
  }
}