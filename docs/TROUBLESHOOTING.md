# Smart Parcel Box — Hardware & System Troubleshooting Guide

This guide provides procedures for diagnosing and resolving edge hardware anomalies, network drops, and MQTT communication problems.

---

## 1. Hardware & Sensor Troubleshooting

### Symptom: Green LED does not match Serial Monitor output
- **Diagnostic Step**: Open `firmware/esp32/diagnostic/diagnostic.ino` in Arduino IDE. Open Serial Monitor (115200 baud) and type `'g'`.
- **Cause**: Active-low LED breakout vs Active-high discrete LED wiring.
- **Fix**: Invert output pin logic:
  ```cpp
  // If active-low:
  digitalWrite(PIN_GREEN_LED, LOW); // Turns ON
  digitalWrite(PIN_GREEN_LED, HIGH); // Turns OFF
  ```

### Symptom: Buzzer beeps or clicks when touching wires
- **Diagnostic Step**: Measure resistance between GPIO 18 and GND when the ESP32 is powered off.
- **Cause**: High-impedance floating input on the active buzzer gate picking up 50/60Hz mains hum or EMI from adjacent jumper wires.
- **Fix**: Connect a **10kΩ pull-down resistor** between GPIO 18 and GND to clamp the gate low when idle.

### Symptom: SW-420 triggers constantly or produces spurious vibration alarms
- **Diagnostic Step**: Observe the L2 onboard comparator LED on the SW-420 board while the box is stationary.
- **Cause**: Sensitivity trimmer potentiometer adjusted too close to threshold.
- **Fix**:
  1. Gently turn the onboard blue potentiometer clockwise until the onboard trigger LED turns off when idle.
  2. The firmware includes a 200ms window filter requiring at least 3 pulses before triggering an alarm.

### Symptom: HX711 reports READY but raw reading is -1
- **Diagnostic Step**: Check voltage between `E+` and `E-` on the HX711 header. It should measure ~2.5V to 3.3V.
- **Cause**:
  1. Broken or loose wire on excitation lines (`E+`/`E-`).
  2. Data pin (GPIO 32) shorted to ground or floating.
- **Fix**:
  1. Reseat all four load cell wires (E+, E-, A+, A-).
  2. Verify DT is connected to GPIO 32 and SCK to GPIO 33.
  3. Firmware automatically marks `weightValid: false` when reading is -1 to protect data integrity.

---

## 2. Network & MQTT Troubleshooting

### Symptom: Dashboard shows "CONNECTION LOST / DATA STALE"
- **Cause**: No MQTT telemetry message was received from the device within 15 seconds.
- **Checklist**:
  1. Check if ESP32 Serial Monitor shows `[WIFI] Connected!` and `[MQTT] connected!`.
  2. Verify that the MQTT broker IP in `mqtt-integration.ino` matches your development machine's local IP address (`ipconfig` on Windows).
  3. Verify port 1883 is open and accessible through the Windows Firewall.

### Symptom: Commands dispatched from dashboard are not acknowledged
- **Cause**: ESP32 is not subscribed to `parcelbox/{deviceId}/commands` or the command was rejected.
- **Checklist**:
  1. Check device capabilities: Base prototype firmware rejects `DISARM_SYSTEM` remote commands to enforce physical presence at the box.
  2. Inspect the backend logs (`npm run dev:api`) to confirm the command was published to Mosquitto.

