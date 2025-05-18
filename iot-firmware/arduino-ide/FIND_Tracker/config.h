#ifndef CONFIG_H
#define CONFIG_H

// Pin definitions
#define GPS_RX 16
#define GPS_TX 17
#define MPU_SDA 21
#define MPU_SCL 22
#define BATTERY_PIN 34  // ADC pin for battery voltage reading

// Bluetooth UUIDs
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CONFIG_CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define STATUS_CHAR_UUID    "5ac659d8-2583-4add-b315-902e9aed475d"
#define COMMAND_CHAR_UUID   "8dd6ce17-8a6b-4cb7-9cab-16edc0578119"

// Device configuration struct
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

// Battery calculation constants
#define BATTERY_MULTIPLIER 2.0f  // Voltage divider: reading * 2 for actual voltage
#define MAX_BATTERY_VOLTAGE 4.2f // Full charge voltage
#define MIN_BATTERY_VOLTAGE 3.3f // Cutoff voltage

// Power management settings
#define DEEP_SLEEP_DURATION_MIN 5     // 5 minutes deep sleep when inactive
#define LIGHT_SLEEP_DURATION_SEC 30   // 30 seconds light sleep when no motion
#define MOTION_INACTIVE_TIMEOUT_SEC 300 // 5 minutes of no motion to enter deep sleep

// GPS settings
#define GPS_FIX_TIMEOUT_MS 60000      // Wait 60 seconds maximum for GPS fix
#define GPS_BAUDRATE 9600             // NEO-7M default baudrate

// Motion detection settings
#define MOTION_CHECK_INTERVAL_MS 1000 // Check for motion every second
#define DEFAULT_MOTION_THRESHOLD 0.5f // Default threshold for motion detection

// Network settings
#define WIFI_CONNECT_TIMEOUT_MS 20000 // WiFi connection timeout (20 seconds)
#define API_TIMEOUT_MS 10000          // API request timeout (10 seconds)
#define DEFAULT_TRANSMIT_INTERVAL 60  // Default data transmission interval (60 seconds)

// Firmware information
#define FIRMWARE_VERSION "1.0.0"
#define DEVICE_MODEL "ESP32-FIND-TRACKER"

#endif // CONFIG_H