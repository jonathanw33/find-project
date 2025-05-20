#include <Arduino.h>
#include <EEPROM.h>

// Device configuration struct - must match the one in your config.h
struct DeviceConfig {
  char wifi_ssid[32];
  char wifi_password[32];
  char device_id[37]; // UUID string
  char api_endpoint[100];
  char api_key[200]; // Increased to 200
  bool paired;
  int transmit_interval; // in seconds
  float motion_threshold;
};

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\nFIND Tracker - Advanced Diagnostic");
  
  // Initialize EEPROM
  EEPROM.begin(512);
  
  // Read current config
  DeviceConfig config;
  EEPROM.get(0, config);
  EEPROM.end();
  
  // Display configuration
  Serial.println("Current Configuration:");
  Serial.println("-----------------------");
  Serial.println("Device ID: " + String(config.device_id));
  Serial.println("WiFi SSID: " + String(config.wifi_ssid));
  Serial.println("API Endpoint: " + String(config.api_endpoint));
  
  // Show detailed API key information
  Serial.println("\nAPI Key (examine closely):");
  Serial.println("---------------------------------");
  String apiKey = String(config.api_key);
  Serial.println(apiKey);
  
  Serial.println("\nAPI Key length: " + String(apiKey.length()));
  Serial.println("First 20 chars: " + apiKey.substring(0, 20));
  Serial.println("Middle 20 chars: " + apiKey.substring(80, 100));
  Serial.println("Last 20 chars: " + apiKey.substring(apiKey.length() - 20));
  
  // Compare with the expected key
  const char* expectedKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHVyam5nYmtmbmJyeXpjemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzIwOTIsImV4cCI6MjA2MDYwODA5Mn0.goPuYbHra2eHKSFidqYMiDbJ5KlYF3WLr0KGqSt62Xw";
  Serial.println("\nExpected key length: " + String(strlen(expectedKey)));
  
  Serial.println("\nComparing characters:");
  for (int i = 0; i < min(strlen(expectedKey), apiKey.length()); i += 20) {
    String storedSection = apiKey.substring(i, min(i + 20, apiKey.length()));
    String expectedSection = String(expectedKey).substring(i, min(i + 20, strlen(expectedKey)));
    
    Serial.print("Position " + String(i) + ": ");
    if (storedSection.equals(expectedSection)) {
      Serial.println("MATCH");
    } else {
      Serial.println("MISMATCH");
      Serial.println("  Stored: " + storedSection);
      Serial.println("  Expected: " + expectedSection);
    }
  }
  
  Serial.println("\nPaired: " + String(config.paired ? "Yes" : "No"));
  Serial.println("Transmit Interval: " + String(config.transmit_interval) + " seconds");
}

void loop() {
  delay(1000);
}