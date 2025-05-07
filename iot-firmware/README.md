# FIND System - IoT Firmware

This directory contains the firmware code for ESP32-based FIND trackers. The firmware will be developed in Phase 3 of the project.

## Planned Features

- BLE communication protocol for pairing with mobile app
- Low-power operation with deep sleep modes
- Accelerometer integration for motion detection
- LED and buzzer control for alerts
- Battery level monitoring
- Secure communication with FIND backend

## Hardware Requirements

- ESP32 development board (recommended: ESP32-WROOM-32)
- Battery (LiPo or Li-Ion)
- Accelerometer (MPU-6050 or similar)
- LED indicator
- Buzzer for alerts
- Button for pairing and functions
- Charging circuit

## Development Setup

1. Install [PlatformIO](https://platformio.org/) or Arduino IDE
2. Clone this repository
3. Open the project in your IDE
4. Connect your ESP32 board
5. Build and flash the firmware

## Project Structure

```
iot-firmware/
├── src/                  # Source code
│   ├── main.cpp          # Main application entry point
│   ├── ble_manager.cpp   # BLE communication management
│   ├── ble_manager.h
│   ├── power_manager.cpp # Power and sleep mode management
│   ├── power_manager.h
│   ├── sensors.cpp       # Sensor integration (accelerometer, etc.)
│   ├── sensors.h
│   ├── config.h          # Configuration parameters
│   └── utils.h           # Utility functions
├── include/              # Additional header files
├── lib/                  # Libraries
├── test/                 # Unit tests
└── platformio.ini        # PlatformIO configuration
```

## Communication Protocol

The ESP32 tracker will communicate with the mobile app using Bluetooth Low Energy (BLE). The protocol will include:

1. **Pairing Process**: Secure device pairing with the app
2. **Location Updates**: Sending relative location information
3. **Battery Status**: Reporting battery level
4. **Alerts**: Receiving and responding to alerts
5. **Configuration**: Receiving configuration updates

## Power Management

To ensure long battery life, the firmware will:

1. Use deep sleep modes when not in use
2. Wake on motion detection or timer
3. Optimize BLE connection parameters
4. Monitor and report battery levels
5. Provide low-battery warnings

## Future Enhancements

- WiFi connectivity for more accurate location
- Mesh networking between multiple trackers
- OTA (Over-The-Air) firmware updates
- Custom PCB design for smaller form factor

## Development Guidelines

- Follow the Arduino coding style
- Document all functions and methods
- Include comments explaining complex logic
- Write unit tests for core functionality
- Prioritize power efficiency and reliability

## Related Documentation

- [ESP32 Technical Reference Manual](https://www.espressif.com/sites/default/files/documentation/esp32_technical_reference_manual_en.pdf)
- [ESP-IDF Programming Guide](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)