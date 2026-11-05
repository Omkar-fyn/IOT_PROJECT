# Smart Parcel Box — Hardware Connections & Wiring Guide

## 1. ESP32 GPIO Pin Assignments

The established GPIO pin configuration below must be maintained. Do not alter these pin assignments without updating both `firmware/esp32/` and the system documentation.

| Component | ESP32 GPIO | Direction | Type | Voltage | Notes |
|---|---|---|---|---|---|
| **Magnetic Sensor DO** | **GPIO 27** | Input | Digital (`INPUT_PULLUP`) | 3.3V | Reed switch detecting lid open/closed. Software debounced (80ms). |
| **SW-420 DO** | **GPIO 25** | Input | Digital | 3.3V | Vibration/shock module with onboard comparator. Window-filtered. |
| **Push Button** | **GPIO 26** | Input | Digital (`INPUT_PULLUP`) | 3.3V | Physical button for silencing alarm and arming/disarming. |
| **Active Buzzer** | **GPIO 18** | Output | Digital | 3.3V / 5V | Audible tamper siren. Pulled down on boot to prevent floating triggers. |
| **Red LED** | **GPIO 21** | Output | Digital | 3.3V | Visual alarm strobe. 220Ω series resistor required. |
| **Green LED** | **GPIO 19** | Output | Digital | 3.3V | Ready / Armed indicator. 220Ω series resistor required. |
| **HX711 DT (DOUT)** | **GPIO 32** | Input | Digital Serial Data | 3.3V | 24-bit ADC data line from load cell amplifier. |
| **HX711 SCK (CLK)** | **GPIO 33** | Output | Digital Serial Clock | 3.3V | Clock pulses driven by ESP32 to shift out conversion bits. |

---

## 2. Power & Voltage Specifications

> [!CAUTION]
> **Never apply a 5V logic signal directly to an ESP32 GPIO pin.** ESP32 pins are strictly 3.3V tolerant. Exceeding 3.6V will permanently damage the microcontroller.

- **VCC Distribution**:
  - Magnetic Sensor DO module: Connect VCC to **ESP32 3.3V**.
  - SW-420 module: Connect VCC to **ESP32 3.3V**.
  - HX711 module: Connect VDD/VCC to **ESP32 3.3V**.
  - Active Buzzer module: If using a 5V active buzzer, power it via the 5V/VIN pin and switch it via an NPN transistor (e.g. 2N2222) with the base connected to GPIO 18 through a 1kΩ resistor.
- **Common Ground**: All sensors, modules, LEDs, and power supplies **must share a common ground (GND)** to establish an electrical reference.

---

## 3. Load Cell & HX711 Amplifier Wiring

The 4-wire strain gauge bridge connects to the HX711 input header:

| Load Cell Wire Function | HX711 Pin | Description | Typical Wire Color* |
|---|---|---|---|
| **Excitation Positive (E+)** | **E+** | Supply voltage to strain gauge bridge | Red |
| **Excitation Negative (E-)** | **E-** | Ground return of strain gauge bridge | Black |
| **Signal Positive (A+)** | **A+** | Output differential voltage + | White |
| **Signal Negative (A-)** | **A-** | Output differential voltage - | Green |

*\*Note: Wire colors can vary by manufacturer. Always verify resistance across pairs using a multimeter: Excitation (E+ to E-) typically measures ~350Ω-410Ω, and Signal (A+ to A-) typically measures ~350Ω.*

---

## 4. Troubleshooting Previously Observed Diagnostic Issues

### Issue 1: Green LED physical behaviour did not match Serial Monitor output
- **Underlying Cause**: Many 3-pin breakout LED modules are wired in an *Active-LOW* (sink) configuration where the diode anode is tied to VCC, meaning writing `LOW` turns the LED on. Conversely, discrete bare LEDs placed in a breadboard are typically *Active-HIGH* (source).
- **Resolution**:
  1. Upload `firmware/esp32/diagnostic/diagnostic.ino`.
  2. Send `'g'` in the Serial Monitor. If the LED turns on when Serial reports `OFF`, the circuit is wired active-low.
  3. In `mqtt-integration.ino`, set `#define GREEN_LED_ACTIVE_LOW true` or invert the pin logic accordingly.

### Issue 2: Buzzer sounded when component wires were touched
- **Underlying Cause**: High-impedance floating gate on the active buzzer module. Human proximity and adjacent signal wires caused electro-static and EMI capacitive coupling into GPIO 18.
- **Resolution**:
  1. Add an external **10kΩ pull-down resistor** between GPIO 18 and GND.
  2. In firmware `setup()`, configure `pinMode(PIN_BUZZER, OUTPUT)` and explicitly call `digitalWrite(PIN_BUZZER, LOW)` before executing any sensor loops.

### Issue 3: Magnetic Switch & Vibration False Triggers
- **Underlying Cause**: Mechanical contact bounce on lid closure and environmental acoustic noise.
- **Resolution**:
  1. The magnetic reed switch utilizes software debouncing (80ms sampling window) in `readSensors()`.
  2. The SW-420 DO line is sampled across a **200ms window**, requiring at least 3 distinct positive threshold crossings before asserting a vibration alarm state.

### Issue 4: HX711 reported READY but produced raw reading of `-1`
- **Underlying Cause**:
  1. If the DT (data) line is pulled permanently low or disconnected from the load cell bridge, `scale.read()` can return `-1` or `0xFFFFFFFF`.
  2. Loss of excitation voltage (`E+`/`E-`) prevents the strain gauge Wheatstone bridge from outputting a differential millivolt signal.
- **Resolution**:
  1. Ensure the load cell wires are firmly seated in the screw terminals or breadboard.
  2. Check continuity between ESP32 3.3V and HX711 VCC.
  3. In `mqtt-integration.ino`, any reading of `-1` sets `weightValid: false`. The system marks the sensor as `FAULT` and refuses to publish `-1` as a valid delivery weight.

