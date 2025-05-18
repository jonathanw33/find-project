# ESP32 FIND Tracker Firmware

This directory contains the firmware for the ESP32-based FIND tracker. The firmware enables communication between the physical tracker and the FIND mobile app, as well as sending location and status data to the Supabase backend.

## Hardware Requirements

- ESP32 Development Board (DOIT ESP32 or similar)
- NEO-7M GPS Module
- MPU6500 Accelerometer/Gyroscope
- SFM-27 Buzzer (for alerts)
- Battery (LiPo/Li-Ion)
- LEDs for status indication

## Connections

### GPS Module (NEO-7M):
- GPS TX → ESP32 GPIO 16 (RX2)
- GPS RX → ESP32 GPIO 17 (TX2)
- VCC → 5V
- GND → GND

### Accelerometer (MPU6500):
- SDA → ESP32 GPIO 21
- SCL → ESP32 GPIO 22
- VCC → 3.3V
- GND → GND

### Buzzer:
- Positive → ESP32 GPIO 13
- Negative → GND

### LED:
- LED → ESP32 GPIO 2 (with appropriate resistor)
- GND → GND

## Features

1. **Bluetooth LE Pairing**: Allows secure pairing with the FIND mobile app
2. **WiFi Connectivity**: Connects to user's WiFi to transmit data to Supabase
3. **GPS Location Tracking**: Provides accurate location data
4. **Motion Detection**: Uses accelerometer to detect movement
5. **Power Management**: Implements sleep modes for battery efficiency
6. **Alert System**: Buzzer activation for local alerts

## Files Included

- `main.cpp`: Main application code
- `bluetooth_manager.cpp/h`: Bluetooth LE implementation
- `config.h`: Configuration parameters

## Installation Instructions

1. Install [PlatformIO](https://platformio.org/) extension in Visual Studio Code
2. Open this firmware directory as a PlatformIO project
3. Connect your ESP32 board via USB
4. Upload the firmware using PlatformIO

## Pairing Process

1. Power on the tracker
2. Use the FIND mobile app to scan for available trackers
3. Select your tracker from the list
4. Enter your WiFi credentials in the app
5. The app will send the configuration to the tracker and register it in Supabase
6. Upon successful pairing, the tracker's LED will turn solid for 3 seconds

## Troubleshooting

- **Tracker not visible in BLE scan**: Make sure the tracker is powered on and within range
- **Failed to connect**: Restart the tracker and try again
- **WiFi connection failure**: Check WiFi credentials and signal strength
- **Location data issues**: Ensure GPS module has clear view of the sky

## Power Consumption

- **Active Mode**: ~80mA with GPS and WiFi active
- **Low Power Mode**: ~15mA with GPS active, WiFi sleeping
- **Deep Sleep**: ~2mA with GPS off, periodic wake-ups

## Development Notes

The firmware is configured to:
1. Start in pairing mode (Bluetooth LE advertising)
2. Once paired and configured, connect to WiFi
3. Transmit data to Supabase every 60 seconds by default
4. Enter low power modes when no movement is detected
5. Wake up on motion events detected by the accelerometer