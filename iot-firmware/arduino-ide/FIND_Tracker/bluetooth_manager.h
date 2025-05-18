#ifndef BLUETOOTH_MANAGER_H
#define BLUETOOTH_MANAGER_H

#include <Arduino.h>

// Function to setup Bluetooth
void setupBluetooth();

// Function to update BLE status
void updateBLEStatus(float lat, float lng, float accX, float accY, float accZ, bool motion);

// Function declarations for the main app to use
extern void loadConfig();
extern void saveConfig();

#endif // BLUETOOTH_MANAGER_H