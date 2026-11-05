/*
  ==============================================================================
  SMART PARCEL BOX — PRODUCTION ESP32 FIRMWARE WITH MQTT & LOCAL SECURITY
  ==============================================================================
  Hardware Pin Map:
    - Magnetic Sensor DO : GPIO 27
    - SW-420 Vibration DO: GPIO 25
    - Push Button        : GPIO 26 (PULLUP)
    - Active Buzzer      : GPIO 18
    - Red LED (Alarm)    : GPIO 21
    - Green LED (Status) : GPIO 19
    - HX711 DT           : GPIO 32
    - HX711 SCK          : GPIO 33
  
  Libraries Required:
    - WiFi.h
    - PubSubClient.h (by Nick O'Leary)
    - ArduinoJson.h (v6 or v7 by Benoit Blanchon)
    - HX711.h (by bogde)
  ==============================================================================
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "HX711.h"

// ----------------- CONFIGURATION -----------------
const char* WIFI_SSID       = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD   = "YOUR_WIFI_PASSWORD";

const char* MQTT_BROKER     = "192.168.1.100"; // IP address of backend / mosquitto host
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "parcelbox_server";
const char* MQTT_PASS       = "secure_broker_password";
const char* DEVICE_ID       = "BOX-001";
const char* FIRMWARE_VER    = "1.0.0";

// Pin Map
#define PIN_MAGNETIC_DO  27
#define PIN_SW420_DO     25
#define PIN_PUSH_BUTTON  26
#define PIN_BUZZER       18
#define PIN_RED_LED      21
#define PIN_GREEN_LED    19
#define PIN_HX711_DT     32
#define PIN_HX711_SCK    33

// Security Thresholds & Logic
#define MIN_PARCEL_WEIGHT_GRAMS 50.0
#define CALIBRATION_FACTOR      420.0f
#define TELEMETRY_INTERVAL_MS   2000
#define VIBRATION_THRESHOLD_CNT 3
#define ARMING_DELAY_MS         10000

// Finite State Machine States
enum BoxState {
  STATE_READY,
  STATE_PARCEL_PRESENT,
  STATE_ARMING,
  STATE_ARMED,
  STATE_ALARM,
  STATE_FAULT
};

// Global Objects & State
WiFiClient espClient;
PubSubClient mqttClient(espClient);
HX711 scale;

BoxState currentState = STATE_READY;
bool systemArmed = false;
bool alarmActive = false;
bool parcelDetected = false;

// Filtered Sensor Readings
bool lidIsClosed = true;
bool vibrationFlag = false;
float currentWeightGrams = 0.0;
long rawWeightReading = 0;
bool weightIsValid = false;
bool hx711IsReady = false;

unsigned long lastTelemetryTime = 0;
unsigned long stateEnteredTime = 0;
unsigned long lastButtonPressTime = 0;
unsigned int sequenceNumber = 0;
int vibrationWindowHits = 0;
unsigned long lastVibeWindowCheck = 0;

// MQTT Topic buffers
char topicTelemetry[64];
char topicEvents[64];
char topicStatus[64];
char topicCommands[64];
char topicCommandAcks[64];

// ----------------- FORWARD DECLARATIONS -----------------
void setupWiFi();
void reconnectMQTT();
void publishStatus(const char* status);
void publishTelemetry();
void publishSecurityEvent(const char* eventType, const char* severity, const char* sensor, const char* desc, float weight = -1);
void onMqttCommand(char* topic, byte* payload, unsigned int length);
void handleLocalSecurityFSM();
void readSensors();

// ----------------- SETUP -----------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[BOOT] Starting Smart Parcel Box Firmware v" FIRMWARE_VER);

  // Initialize GPIO
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_GREEN_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  pinMode(PIN_MAGNETIC_DO, INPUT_PULLUP);
  pinMode(PIN_SW420_DO, INPUT);
  pinMode(PIN_PUSH_BUTTON, INPUT_PULLUP);

  // Initialize HX711
  Serial.println("[SCALE] Initializing HX711...");
  scale.begin(PIN_HX711_DT, PIN_HX711_SCK);
  delay(200);
  if (scale.is_ready()) {
    scale.set_scale(CALIBRATION_FACTOR);
    scale.tare();
    Serial.println("[SCALE] HX711 initialized and tared successfully.");
  } else {
    Serial.println("[SCALE] Warning: HX711 not responding. Operating in fault-tolerant mode.");
  }

  // Setup MQTT topic strings
  snprintf(topicTelemetry, sizeof(topicTelemetry), "parcelbox/%s/telemetry", DEVICE_ID);
  snprintf(topicEvents, sizeof(topicEvents), "parcelbox/%s/events", DEVICE_ID);
  snprintf(topicStatus, sizeof(topicStatus), "parcelbox/%s/status", DEVICE_ID);
  snprintf(topicCommands, sizeof(topicCommands), "parcelbox/%s/commands", DEVICE_ID);
  snprintf(topicCommandAcks, sizeof(topicCommandAcks), "parcelbox/%s/command-acks", DEVICE_ID);

  // Initial outputs: Green LED flashes to indicate booting
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_GREEN_LED, HIGH);
    delay(100);
    digitalWrite(PIN_GREEN_LED, LOW);
    delay(100);
  }

  setupWiFi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMqttCommand);

  currentState = STATE_READY;
  stateEnteredTime = millis();
}

// ----------------- MAIN LOOP -----------------
void loop() {
  // 1. Read all local physical sensors
  readSensors();

  // 2. CRITICAL: Execute Autonomous Local Security State Machine
  // (Works 100% locally even if WiFi or MQTT are disconnected!)
  handleLocalSecurityFSM();

  // 3. Physical Push Button Check for Alarm Silence & Disarm
  if (digitalRead(PIN_PUSH_BUTTON) == LOW) {
    if (millis() - lastButtonPressTime > 300) { // Debounce
      lastButtonPressTime = millis();
      Serial.println("[BUTTON] Physical push button pressed!");

      if (alarmActive) {
        // Silence local alarm
        alarmActive = false;
        digitalWrite(PIN_BUZZER, LOW);
        digitalWrite(PIN_RED_LED, LOW);
        digitalWrite(PIN_GREEN_LED, HIGH);
        systemArmed = false;
        currentState = STATE_READY;
        publishSecurityEvent("ALARM_ACKNOWLEDGED", "INFO", "PUSH_BUTTON", "Local alarm silenced via physical button on box");
      } else {
        // Toggle system armed/disarmed manually
        systemArmed = !systemArmed;
        if (systemArmed) {
          currentState = STATE_ARMED;
          digitalWrite(PIN_GREEN_LED, HIGH);
          publishSecurityEvent("SYSTEM_ARMED", "INFO", "PUSH_BUTTON", "System armed via physical button");
        } else {
          currentState = STATE_READY;
          digitalWrite(PIN_GREEN_LED, LOW);
          publishSecurityEvent("SYSTEM_DISARMED", "INFO", "PUSH_BUTTON", "System disarmed via physical button");
        }
      }
    }
  }

  // 4. Maintain WiFi & MQTT connectivity without blocking security loop
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    } else {
      mqttClient.loop();
    }
  }

  // 5. Periodic Telemetry Streaming
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();
    if (mqttClient.connected()) {
      publishTelemetry();
    }
  }
}

// ----------------- SENSOR ACQUISITION -----------------
void readSensors() {
  // Magnetic sensor: LOW typically indicates magnet is near (lid closed)
  int magVal = digitalRead(PIN_MAGNETIC_DO);
  lidIsClosed = (magVal == LOW);

  // Vibration sensor: count pulses over 200ms window to filter electrical noise
  if (digitalRead(PIN_SW420_DO) == HIGH) {
    vibrationWindowHits++;
  }
  if (millis() - lastVibeWindowCheck >= 200) {
    lastVibeWindowCheck = millis();
    vibrationFlag = (vibrationWindowHits >= VIBRATION_THRESHOLD_CNT);
    vibrationWindowHits = 0;
  }

  // Load cell reading
  hx711IsReady = scale.is_ready();
  if (hx711IsReady) {
    rawWeightReading = scale.read();
    // Validate reading: -1 or excessive noise is treated as invalid
    if (rawWeightReading == -1 || rawWeightReading < -1000000 || rawWeightReading > 10000000) {
      weightIsValid = false;
      currentWeightGrams = 0.0;
    } else {
      weightIsValid = true;
      float calculatedGrams = scale.get_units(2);
      if (calculatedGrams < 0) calculatedGrams = 0.0;
      currentWeightGrams = calculatedGrams;
      parcelDetected = (currentWeightGrams >= MIN_PARCEL_WEIGHT_GRAMS);
    }
  } else {
    weightIsValid = false;
  }
}

// ----------------- LOCAL SECURITY STATE MACHINE -----------------
void handleLocalSecurityFSM() {
  switch (currentState) {
    case STATE_READY:
      digitalWrite(PIN_RED_LED, LOW);
      digitalWrite(PIN_BUZZER, LOW);
      if (parcelDetected && lidIsClosed) {
        // Parcel placed and lid closed -> start arming countdown
        currentState = STATE_ARMING;
        stateEnteredTime = millis();
        publishSecurityEvent("PARCEL_DETECTED", "INFO", "HX711", "Parcel presence detected in box", currentWeightGrams);
      }
      break;

    case STATE_ARMING:
      // Green LED blinks during arming delay
      digitalWrite(PIN_GREEN_LED, (millis() / 500) % 2 == 0 ? HIGH : LOW);
      if (!lidIsClosed) {
        // If lid opens during arming, abort to ready
        currentState = STATE_READY;
      } else if (millis() - stateEnteredTime >= ARMING_DELAY_MS) {
        // Arming delay complete -> ARM SYSTEM
        currentState = STATE_ARMED;
        systemArmed = true;
        digitalWrite(PIN_GREEN_LED, HIGH);
        publishSecurityEvent("SYSTEM_ARMED", "INFO", "LOCAL_SECURITY_FSM", "Box securely armed with parcel inside", currentWeightGrams);
      }
      break;

    case STATE_ARMED:
      digitalWrite(PIN_GREEN_LED, HIGH);
      digitalWrite(PIN_RED_LED, LOW);

      // Check tamper triggers
      if (!lidIsClosed) {
        // TAMPER: Lid opened while armed!
        currentState = STATE_ALARM;
        alarmActive = true;
        publishSecurityEvent("LID_OPENED", "CRITICAL", "REED_SWITCH", "TAMPER ALERT: Box lid opened while system was armed!");
        publishSecurityEvent("ALARM_TRIGGERED", "CRITICAL", "LOCAL_SECURITY_FSM", "Physical alarm activated!");
      } else if (vibrationFlag) {
        // TAMPER: Vibration / shock while armed!
        currentState = STATE_ALARM;
        alarmActive = true;
        publishSecurityEvent("VIBRATION_DETECTED", "WARNING", "SW-420", "Physical impact/vibration detected on armed box");
        publishSecurityEvent("ALARM_TRIGGERED", "CRITICAL", "LOCAL_SECURITY_FSM", "Physical alarm activated due to vibration tampering!");
      }
      break;

    case STATE_ALARM:
      // PHYSICAL AUDIBLE & VISUAL ALARM
      // Pulse buzzer and strobe Red LED
      digitalWrite(PIN_RED_LED, (millis() / 200) % 2 == 0 ? HIGH : LOW);
      digitalWrite(PIN_BUZZER, HIGH);
      digitalWrite(PIN_GREEN_LED, LOW);
      break;

    default:
      break;
  }
}

// ----------------- NETWORKING & MQTT -----------------
void setupWiFi() {
  Serial.print("[WIFI] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  // Non-blocking WiFi check in setup
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 15) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WIFI] WiFi connection pending... Continuing autonomous local operation.");
  }
}

void reconnectMQTT() {
  static unsigned long lastMqttAttempt = 0;
  if (millis() - lastMqttAttempt < 5000) return; // Non-blocking retry every 5 sec
  lastMqttAttempt = millis();

  Serial.print("[MQTT] Connecting to broker...");
  
  // Last Will and Testament payload
  char lwtPayload[128];
  snprintf(lwtPayload, sizeof(lwtPayload), "{\"schemaVersion\":1,\"deviceId\":\"%s\",\"status\":\"OFFLINE\"}", DEVICE_ID);

  String clientId = String("ESP32_ParcelBox_") + String(random(0xffff), HEX);
  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS, topicStatus, 1, true, lwtPayload)) {
    Serial.println(" connected!");
    publishStatus("ONLINE");
    mqttClient.subscribe(topicCommands, 1);
    publishSecurityEvent("DEVICE_ONLINE", "INFO", "SYSTEM", "ESP32 firmware online and connected to MQTT broker");
  } else {
    Serial.print(" failed, rc=");
    Serial.println(mqttClient.state());
  }
}

void publishStatus(const char* status) {
  StaticJsonDocument<256> doc;
  doc["schemaVersion"] = 1;
  doc["deviceId"] = DEVICE_ID;
  doc["status"] = status;
  doc["firmwareVersion"] = FIRMWARE_VER;
  doc["wifiRssi"] = WiFi.RSSI();
  doc["uptimeSeconds"] = millis() / 1000;

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(topicStatus, buffer, true); // Retained
}

void publishTelemetry() {
  StaticJsonDocument<512> doc;
  doc["schemaVersion"] = 1;
  doc["deviceId"] = DEVICE_ID;
  doc["sequence"] = ++sequenceNumber;
  doc["weightRaw"] = rawWeightReading;
  doc["weightGrams"] = currentWeightGrams;
  doc["weightValid"] = weightIsValid;
  doc["hx711Ready"] = hx711IsReady;
  doc["parcelPresent"] = parcelDetected;
  doc["magneticRaw"] = digitalRead(PIN_MAGNETIC_DO);
  doc["lidClosed"] = lidIsClosed;
  doc["vibrationRaw"] = digitalRead(PIN_SW420_DO);
  doc["vibrationDetected"] = vibrationFlag;
  doc["armed"] = systemArmed;
  doc["alarmActive"] = alarmActive;
  doc["redLedActive"] = digitalRead(PIN_RED_LED) == HIGH;
  doc["greenLedActive"] = digitalRead(PIN_GREEN_LED) == HIGH;
  doc["buzzerActive"] = digitalRead(PIN_BUZZER) == HIGH;
  doc["wifiRssi"] = WiFi.RSSI();
  doc["uptimeSeconds"] = millis() / 1000;
  doc["firmwareVersion"] = FIRMWARE_VER;
  doc["isSimulated"] = false;

  char buffer[512];
  serializeJson(doc, buffer);
  mqttClient.publish(topicTelemetry, buffer, false);
}

void publishSecurityEvent(const char* eventType, const char* severity, const char* sensor, const char* desc, float weight) {
  StaticJsonDocument<384> doc;
  char eventId[32];
  snprintf(eventId, sizeof(eventId), "esp_%lu_%u", millis(), sequenceNumber);

  doc["schemaVersion"] = 1;
  doc["eventId"] = eventId;
  doc["deviceId"] = DEVICE_ID;
  doc["eventType"] = eventType;
  doc["severity"] = severity;
  doc["sourceSensor"] = sensor;
  doc["description"] = desc;
  if (weight >= 0) {
    doc["weightGrams"] = weight;
  }
  doc["isSimulated"] = false;

  char buffer[384];
  serializeJson(doc, buffer);
  mqttClient.publish(topicEvents, buffer, true);
  Serial.print("[EVENT] Published: ");
  Serial.println(desc);
}

void onMqttCommand(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<384> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.println("[COMMAND] JSON parse error");
    return;
  }

  const char* cmdId = doc["commandId"] | "unknown";
  const char* cmdType = doc["commandType"] | "";
  Serial.print("[COMMAND] Received: ");
  Serial.println(cmdType);

  StaticJsonDocument<256> ackDoc;
  ackDoc["schemaVersion"] = 1;
  ackDoc["commandId"] = cmdId;
  ackDoc["deviceId"] = DEVICE_ID;
  ackDoc["commandType"] = cmdType;

  if (strcmp(cmdType, "ARM_SYSTEM") == 0) {
    systemArmed = true;
    currentState = STATE_ARMED;
    digitalWrite(PIN_GREEN_LED, HIGH);
    ackDoc["status"] = "SUCCESS";
    ackDoc["message"] = "Box armed remotely";
    publishSecurityEvent("SYSTEM_ARMED", "INFO", "REMOTE_COMMAND", "Box armed via remote dashboard command");
  } else if (strcmp(cmdType, "DISARM_SYSTEM") == 0) {
    // Physical button required on prototype
    ackDoc["status"] = "REJECTED_UNSUPPORTED";
    ackDoc["message"] = "Physical button press on GPIO 26 required for disarm";
  } else if (strcmp(cmdType, "TARE_SCALE") == 0) {
    if (scale.is_ready()) {
      scale.tare();
      ackDoc["status"] = "SUCCESS";
      ackDoc["message"] = "Scale tared successfully";
    } else {
      ackDoc["status"] = "FAILED";
      ackDoc["message"] = "HX711 not ready to tare";
    }
  } else if (strcmp(cmdType, "ACKNOWLEDGE_ALARM") == 0) {
    alarmActive = false;
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_RED_LED, LOW);
    ackDoc["status"] = "SUCCESS";
    ackDoc["message"] = "Alarm acknowledged and silenced";
    publishSecurityEvent("ALARM_ACKNOWLEDGED", "INFO", "REMOTE_COMMAND", "Alarm silenced via remote acknowledgement");
  } else {
    ackDoc["status"] = "REJECTED_UNSUPPORTED";
    ackDoc["message"] = "Unrecognized command";
  }

  char ackBuffer[256];
  serializeJson(ackDoc, ackBuffer);
  mqttClient.publish(topicCommandAcks, ackBuffer, false);
}

