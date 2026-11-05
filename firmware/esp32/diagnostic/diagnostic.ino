/*
  ==============================================================================
  SMART PARCEL BOX — HARDWARE DIAGNOSTIC SUITE
  Target: ESP32 DevKit (38-pin / 30-pin)
  
  GPIO Pin Mapping:
    - Magnetic Sensor DO: GPIO 27
    - SW-420 Vibration DO: GPIO 25
    - Push Button:        GPIO 26 (Internal PULLUP)
    - Active Buzzer:      GPIO 18
    - Red LED:            GPIO 21
    - Green LED:          GPIO 19
    - HX711 DT (DOUT):    GPIO 32
    - HX711 SCK (CLK):    GPIO 33

  This diagnostic sketch tests each hardware component independently to resolve:
    1. Green LED physical behaviour vs Serial output (Active-HIGH vs Active-LOW).
    2. Buzzer sounding when wires are touched (Floating input / pin crosstalk).
    3. SW-420 vibration sensitivity and false-trigger filtering.
    4. Magnetic switch polarity calibration (Normally Open vs Normally Closed).
    5. HX711 raw reading -1 debugging (Wire seating, clock line, VCC/GND check).
  ==============================================================================
*/

#include <Arduino.h>
#include "HX711.h"

// Pin Definitions
#define PIN_MAGNETIC_DO  27
#define PIN_SW420_DO     25
#define PIN_PUSH_BUTTON  26
#define PIN_BUZZER       18
#define PIN_RED_LED      21
#define PIN_GREEN_LED    19
#define PIN_HX711_DT     32
#define PIN_HX711_SCK    33

HX711 scale;

// Test variables
unsigned long lastPrintTime = 0;
int vibrationTriggerCount = 0;
bool buzzerTestState = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n========================================================");
  Serial.println("  SMART PARCEL BOX — HARDWARE PIN DIAGNOSTIC SUITE     ");
  Serial.println("========================================================");

  // Configure Output Pins
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_GREEN_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Initialize outputs to OFF
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Configure Input Pins
  pinMode(PIN_MAGNETIC_DO, INPUT_PULLUP);
  pinMode(PIN_SW420_DO, INPUT);
  pinMode(PIN_PUSH_BUTTON, INPUT_PULLUP);

  // Initialize HX711
  Serial.print("[DIAGNOSTIC] Initializing HX711 on DT: GPIO 32, SCK: GPIO 33... ");
  scale.begin(PIN_HX711_DT, PIN_HX711_SCK);
  delay(500);

  if (scale.is_ready()) {
    Serial.println("SUCCESS (HX711 Ready!)");
  } else {
    Serial.println("WARNING (HX711 not ready - check DT/SCK wiring and 3.3V power)");
  }

  // Self-Test Outputs: Flash LEDs and Beep Buzzer
  Serial.println("\n[OUTPUT TEST] Testing Red LED (GPIO 21), Green LED (GPIO 19), Buzzer (GPIO 18)...");
  
  Serial.println(" -> Turning RED LED ON for 1 sec...");
  digitalWrite(PIN_RED_LED, HIGH);
  delay(1000);
  digitalWrite(PIN_RED_LED, LOW);

  Serial.println(" -> Turning GREEN LED ON for 1 sec...");
  digitalWrite(PIN_GREEN_LED, HIGH);
  delay(1000);
  digitalWrite(PIN_GREEN_LED, LOW);

  Serial.println(" -> Sounding BUZZER chirp (100ms)...");
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.println("\n[DIAGNOSTIC STREAM] Streaming live pin readings every 500ms:");
  Serial.println("Format: [Lid Raw] [Vibe Raw] [Button] [HX711 Ready] [HX711 Raw]");
}

void loop() {
  int magRaw = digitalRead(PIN_MAGNETIC_DO);
  int vibeRaw = digitalRead(PIN_SW420_DO);
  int btnRaw = digitalRead(PIN_PUSH_BUTTON);

  if (vibeRaw == HIGH) {
    vibrationTriggerCount++;
  }

  // Test button interaction
  if (btnRaw == LOW) {
    // Physical button pressed
    digitalWrite(PIN_GREEN_LED, HIGH);
  } else {
    digitalWrite(PIN_GREEN_LED, LOW);
  }

  if (millis() - lastPrintTime >= 500) {
    lastPrintTime = millis();

    bool hxReady = scale.is_ready();
    long rawWeight = -1;
    if (hxReady) {
      rawWeight = scale.read();
    }

    Serial.print("MAG(27): ");
    Serial.print(magRaw == LOW ? "CLOSED(0)" : "OPEN(1)");
    Serial.print(" | VIBE(25): ");
    Serial.print(vibeRaw);
    Serial.print(" (hits: ");
    Serial.print(vibrationTriggerCount);
    Serial.print(") | BTN(26): ");
    Serial.print(btnRaw == LOW ? "PRESSED(0)" : "RELEASED(1)");
    Serial.print(" | HX711 Ready: ");
    Serial.print(hxReady ? "YES" : "NO");
    Serial.print(" | Raw Weight: ");
    Serial.print(rawWeight);

    // Diagnostic troubleshooting hints
    if (rawWeight == -1 && hxReady) {
      Serial.print(" [NOTE: Raw -1 often indicates DOUT held low or missing load cell E+/E- excitation]");
    }
    Serial.println();
  }

  // Handle serial commands for interactive testing
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'r' || cmd == 'R') {
      digitalWrite(PIN_RED_LED, !digitalRead(PIN_RED_LED));
      Serial.println(digitalRead(PIN_RED_LED) ? "Red LED: ON" : "Red LED: OFF");
    } else if (cmd == 'g' || cmd == 'G') {
      digitalWrite(PIN_GREEN_LED, !digitalRead(PIN_GREEN_LED));
      Serial.println(digitalRead(PIN_GREEN_LED) ? "Green LED: ON" : "Green LED: OFF");
    } else if (cmd == 'b' || cmd == 'B') {
      digitalWrite(PIN_BUZZER, !digitalRead(PIN_BUZZER));
      Serial.println(digitalRead(PIN_BUZZER) ? "Buzzer: ACTIVE" : "Buzzer: OFF");
    } else if (cmd == 't' || cmd == 'T') {
      Serial.println("Taring HX711 scale...");
      if (scale.is_ready()) {
        scale.tare();
        Serial.println("Tare complete.");
      } else {
        Serial.println("Cannot tare: HX711 not ready.");
      }
    }
  }
}

