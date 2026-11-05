---
name: esp32-firmware-integration
description: Firmware engineering standards for ESP32 DevKit, sensor acquisition, local security finite state machines, and hardware reliability
---

# ESP32 Firmware Integration Skill

## Purpose
Guidelines for writing resilient C++/Arduino firmware for the Smart Parcel Box on the ESP32 DevKit, ensuring local physical security decisions operate independently of network status.

## Hardware GPIO Map
- Magnetic Sensor: GPIO 27 (Input with configurable polarity)
- SW-420 Vibration: GPIO 25 (Digital Input)
- Push Button: GPIO 26 (Input with Internal Pull-up)
- Active Buzzer: GPIO 18 (Digital Output)
- Red LED: GPIO 21 (Digital Output)
- Green LED: GPIO 19 (Digital Output)
- HX711 DT: GPIO 32, SCK: GPIO 33

## Key Directives
- **Autonomous Local Alarm**: The alarm triggers immediately if armed and a tamper event occurs (lid open or vibration). It does NOT wait for MQTT ack or cloud commands.
- **Sensor Validity Checks**: If the HX711 returns `-1` or timeout, report `weightValid: false` and do NOT treat `-1` as a valid gram measurement.
- **Physical Button Disarm**: Alarm silence and disarming is physically controlled via the push button on GPIO 26.
- **Non-blocking Loop**: Avoid long `delay()` calls; use `millis()` timers for telemetry intervals and LED blinking.

