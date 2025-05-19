#include <Arduino.h>
#include <EEPROM.h>

// Device configuration struct - must match the one in your config.h
struct DeviceConfig {
  char wifi_ssid[32];
  char wifi_password[32];
  char device_id[37]; // UUID string
  char api_endpoint[100];
  char api_key[100];
  bool paired;
  int transmit_interval; // in seconds
  float motion_threshold;
};

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\nFIND Tracker - ID Setup");
  
  // Initialize EEPROM
  EEPROM.begin(512);
  
  // Create a new configuration
  DeviceConfig newConfig;
  
  // Clear the entire structure first
  memset(&newConfig, 0, sizeof(DeviceConfig));
  
  // Set device ID - being careful with string lengths
  const char* id = "FIND-BANDUNG-ITB-TRACK-2025-v1";
  strncpy(newConfig.device_id, id, 36);
  newConfig.device_id[36] = '\0'; // Ensure null termination
  
  // Set API endpoint - being careful with string lengths
  const char* endpoint = "https://hxdurjngbkfnbryzczau.supabase.co/rest/v1/rpc/update_device_status";
  strncpy(newConfig.api_endpoint, endpoint, 99);
  newConfig.api_endpoint[99] = '\0'; // Ensure null termination
  
  // Set API key - being careful with string lengths
  const char* key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw";
  strncpy(newConfig.api_key, key, 99);
  newConfig.api_key[99] = '\0'; // Ensure null termination
  
  // Set other configuration values
  newConfig.transmit_interval = 60;
  newConfig.motion_threshold = 0.5;
  
  // Save to EEPROM
  EEPROM.put(0, newConfig);
  bool success = EEPROM.commit();
  EEPROM.end();
  
  // Print status
  if (success) {
    Serial.println("✅ Configuration saved successfully");
    Serial.println("Device ID: " + String(newConfig.device_id));
    Serial.println("Now upload the regular FIND_Tracker.ino sketch");
  } else {
    Serial.println("❌ Failed to save configuration");
  }
}

void loop() {
  // Just wait
  delay(2000);
}