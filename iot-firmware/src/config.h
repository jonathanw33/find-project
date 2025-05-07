/**
 * FIND System - IoT Tracker Firmware
 * Configuration file with default settings
 */

#ifndef CONFIG_H
#define CONFIG_H

// Device identification
#define DEVICE_NAME "FIND_Tracker"
#define FIRMWARE_VERSION "0.1.0"

// Hardware configuration
#define LED_PIN 2            // Onboard LED on most ESP32 development boards
#define BUZZER_PIN 4         // Example pin for buzzer
#define BUTTON_PIN 0         // Boot button on most ESP32 development boards
#define MPU_INT_PIN 15       // Interrupt pin from accelerometer
#define BATTERY_PIN 34       // ADC pin for battery monitoring

// BLE configuration
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BLE_MTU_SIZE 512

// Power management
#define DEEP_SLEEP_TIMEOUT 30000          // 30 seconds before entering deep sleep (ms)
#define SLEEP_DURATION 600000000          // 10 minutes deep sleep time (us)
#define BATTERY_CHECK_INTERVAL 60000      // Battery check interval (ms)
#define LOW_BATTERY_THRESHOLD 20          // Low battery warning threshold (%)
#define CRITICAL_BATTERY_THRESHOLD 10     // Critical battery threshold (%)

// Motion detection
#define MOTION_THRESHOLD 1.0              // Motion detection threshold (g)
#define MOTION_DURATION 20                // Motion detection duration (ms)
#define MOTION_UPDATE_INTERVAL 1000       // Update interval when motion detected (ms)

// Alert settings
#define ALERT_BEEP_COUNT 3                // Number of beeps in alert pattern
#define ALERT_BEEP_DURATION 200           // Duration of each beep (ms)
#define ALERT_PAUSE_DURATION 200          // Pause between beeps (ms)

// Data transmission
#define STATUS_UPDATE_INTERVAL 1000       // Regular status update interval (ms)
#define RECONNECT_DELAY 500               // Delay before reconnecting BLE (ms)

// Debug settings
#define DEBUG_MODE true                   // Enable debug output
#define SERIAL_BAUD_RATE 115200           // Serial baud rate

#endif // CONFIG_H