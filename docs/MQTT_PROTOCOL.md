# Smart Parcel Box — MQTT Protocol Specification (Version 1)

## 1. Topic Topology

All message channels follow the hierarchical pattern:
`parcelbox/{deviceId}/{subtopic}`

| Topic | Publisher | Subscriber | QoS | Retain | Description |
|---|---|---|---|---|---|
| `parcelbox/{deviceId}/telemetry` | ESP32 / Sim | Backend | 0 or 1 | `false` | Periodic sensor readings (every 2s). |
| `parcelbox/{deviceId}/events` | ESP32 / Sim | Backend | 1 | `true` | Event alerts (tampering, deposit, arming). |
| `parcelbox/{deviceId}/status` | ESP32 / Sim | Backend | 1 | `true` | Connection state with Last Will & Testament (`OFFLINE`). |
| `parcelbox/{deviceId}/commands` | Backend | ESP32 / Sim | 1 | `false` | Authenticated remote instructions. |
| `parcelbox/{deviceId}/command-acks` | ESP32 / Sim | Backend | 1 | `false` | Execution status response for dispatched commands. |

---

## 2. Topic Schemas & Examples

### 2.1 Telemetry (`parcelbox/{deviceId}/telemetry`)

Published every 2 seconds by the ESP32.

```json
{
  "schemaVersion": 1,
  "deviceId": "BOX-001",
  "messageId": "msg_1793667890123_a9b",
  "sequence": 142,
  "timestamp": "2026-11-03T10:30:00.000Z",
  "weightRaw": 619420,
  "weightGrams": 1450,
  "weightValid": true,
  "hx711Ready": true,
  "parcelPresent": true,
  "magneticRaw": 0,
  "lidClosed": true,
  "vibrationRaw": 0,
  "vibrationDetected": false,
  "armed": true,
  "alarmActive": false,
  "redLedActive": false,
  "greenLedActive": true,
  "buzzerActive": false,
  "wifiRssi": -58,
  "uptimeSeconds": 3600,
  "firmwareVersion": "1.0.0",
  "isSimulated": false
}
```

### 2.2 Security & Tamper Events (`parcelbox/{deviceId}/events`)

Triggered immediately on physical state changes.

```json
{
  "schemaVersion": 1,
  "eventId": "evt_1793668200_f71a",
  "deviceId": "BOX-001",
  "eventType": "ALARM_TRIGGERED",
  "severity": "CRITICAL",
  "sourceSensor": "REED_SWITCH",
  "description": "Lid opened while system was armed",
  "timestamp": "2026-11-03T10:35:00.000Z",
  "weightGrams": 1450,
  "isSimulated": false
}
```

Supported Event Types:
- `PARCEL_DETECTED` (Severity: `INFO`)
- `LID_OPENED` (Severity: `INFO` or `CRITICAL` if armed)
- `LID_CLOSED` (Severity: `INFO`)
- `VIBRATION_DETECTED` (Severity: `WARNING` or `CRITICAL` if armed)
- `SYSTEM_ARMED` (Severity: `INFO`)
- `SYSTEM_DISARMED` (Severity: `INFO`)
- `ALARM_TRIGGERED` (Severity: `CRITICAL`)
- `ALARM_ACKNOWLEDGED` (Severity: `INFO`)
- `PARCEL_REMOVED` (Severity: `INFO`)
- `SENSOR_FAULT` (Severity: `WARNING`)
- `DEVICE_ONLINE` (Severity: `INFO`)
- `DEVICE_OFFLINE` (Severity: `WARNING`)

### 2.3 Device Status & Last Will and Testament (`parcelbox/{deviceId}/status`)

Configured upon MQTT broker handshake as the LWT topic:

```json
{
  "schemaVersion": 1,
  "deviceId": "BOX-001",
  "status": "ONLINE",
  "timestamp": "2026-11-03T10:00:00.000Z",
  "firmwareVersion": "1.0.0",
  "wifiRssi": -58
}
```

*(When the device unexpectedly disconnects, the broker automatically publishes `{"schemaVersion":1,"deviceId":"BOX-001","status":"OFFLINE"}`)*

### 2.4 Commands (`parcelbox/{deviceId}/commands`)

Dispatched by authenticated backend users:

```json
{
  "commandId": "cmd_1793668500123_89z",
  "deviceId": "BOX-001",
  "commandType": "ARM_SYSTEM",
  "payload": {},
  "requestedBy": "admin@parcelbox.local",
  "timestamp": "2026-11-03T10:40:00.000Z"
}
```

Supported Command Types:
- `ARM_SYSTEM`: Activates security monitoring.
- `DISARM_SYSTEM`: Requires hardware capability verification; rejected on base prototype where physical button is mandatory.
- `ACKNOWLEDGE_ALARM`: Silences siren remotely.
- `TARE_SCALE`: Calibrates zero-point.
- `UPDATE_SETTINGS`: Updates operational thresholds.

### 2.5 Command Acknowledgement (`parcelbox/{deviceId}/command-acks`)

Published by ESP32 upon executing the received command:

```json
{
  "schemaVersion": 1,
  "commandId": "cmd_1793668500123_89z",
  "deviceId": "BOX-001",
  "commandType": "ARM_SYSTEM",
  "status": "SUCCESS",
  "message": "Box armed remotely",
  "timestamp": "2026-11-03T10:40:01.200Z"
}
```

