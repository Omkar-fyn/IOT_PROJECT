# ESP32 Smart Parcel Box Firmware Documentation

This directory contains the C++ Arduino firmware sketches for the **Smart Parcel Box with Tamper Detection**.

---

## 1. Directory Structure

- `diagnostic/diagnostic.ino`: Standalone diagnostic tool to verify all GPIO pins, test active-high/low polarity, solve floating-wire false buzzer triggers, and debug the HX711 raw `-1` issue.
- `mqtt-integration/mqtt-integration.ino`: Complete production sketch with autonomous local security state machine, WiFi/MQTT telemetry streaming, and remote command handling.

---

## 2. Hardware Pin Map

| Component | ESP32 GPIO | Direction | Description |
|---|---|---|---|
| **Magnetic Sensor (Reed)** | GPIO 27 | Input (`INPUT_PULLUP`) | Detects box lid open/close. Typically LOW when magnet is near (lid closed). |
| **SW-420 Vibration DO** | GPIO 25 | Input | Shock/tamper sensor. Configured with a multi-sample window filter. |
| **Push Button** | GPIO 26 | Input (`INPUT_PULLUP`) | Physical alarm silence and arming toggle switch. |
| **Active Buzzer** | GPIO 18 | Output | Audible tamper siren. Controlled by local security logic. |
| **Red LED** | GPIO 21 | Output | Visual alarm indicator (flashes during tamper). |
| **Green LED** | GPIO 19 | Output | Ready / Armed status indicator. |
| **HX711 DT** | GPIO 32 | Digital Input | Load cell serial data line. |
| **HX711 SCK** | GPIO 33 | Digital Output | Load cell clock line. |

---

## 3. Resolving Previously Observed Diagnostic Issues

### Issue A: Green LED physical behaviour did not match Serial Monitor output
- **Cause**: Some LED breakout boards are wired in an *Active-LOW* (sink) configuration (Anode tied to 3.3V, Cathode to GPIO), while bare LEDs are *Active-HIGH* (source).
- **Resolution**: Use the interactive test in `diagnostic.ino` (press 'g' in Serial Monitor) to verify whether `HIGH` or `LOW` turns the physical LED on. If active-low, invert the logic macro `#define GREEN_LED_ON LOW`.

### Issue B: Buzzer sounded when component wires were touched
- **Cause**: High-impedance floating input or EMI cross-coupling from adjacent wires into the active buzzer gate.
- **Resolution**: Ensure the buzzer pin has a solid ground return path. In software, `pinMode(PIN_BUZZER, OUTPUT)` is initialized and pulled `LOW` immediately in `setup()`. A 10k pull-down resistor from GPIO 18 to GND prevents floating gate triggers.

### Issue C: SW-420 and Reed Switch reading instability
- **Cause**: Switch bounce on lid closure and mechanical micro-vibrations triggering false positives.
- **Resolution**: Implemented software debouncing (50ms) for the magnetic reed switch, and a 200ms multi-pulse window integrator for the SW-420 that requires at least 3 consecutive pulses before asserting a vibration alarm.

### Issue D: HX711 reported READY but produced raw reading of `-1`
- **Cause**: 
  1. DT/DOUT line held continuously low or disconnected from the load cell bridge.
  2. Excitation voltage (`E+`/`E-`) missing or poor breadboard contact on the 4-wire strain gauge bridge.
- **Resolution**: In `mqtt-integration.ino`, any reading of `-1` or out-of-range value sets `weightValid: false` and `currentWeightGrams: 0.0`. It is never published as a legitimate delivery weight. Check wiring continuity between HX711 and load cell bridge (E+, E-, A+, A-).

---

## 4. Required Arduino IDE Libraries

Install these via **Tools -> Manage Libraries...**:
1. **PubSubClient** by Nick O'Leary (v2.8+)
2. **ArduinoJson** by Benoit Blanchon (v6 or v7)
3. **HX711 Arduino Library** by Bogdan Necula (bogde) (v0.7.5+)
4. ESP32 Board Package: **esp32 by Espressif Systems** (v2.0.x or v3.0.x)

