# Smart Parcel Box — Database Schema Specification

The platform utilizes MongoDB with Mongoose ODM. If an external MongoDB server is not running during local testing or CI, the backend seamlessly activates an in-memory repository with the same indexing and pagination characteristics.

---

## 1. Collections & Field Types

### 1.1 `users`
Stores authenticated user accounts. Plaintext passwords are strictly prohibited.
- `_id`: ObjectId
- `name`: String (trimmed)
- `email`: String (unique index, lowercase)
- `passwordHash`: String (bcrypt hashed)
- `role`: String (`admin` | `operator` | `viewer`)
- `createdAt`: Date
- `updatedAt`: Date

### 1.2 `devices`
Registry of monitored Smart Parcel Boxes.
- `_id`: ObjectId
- `deviceId`: String (unique index, e.g., `BOX-001`)
- `deviceName`: String
- `deviceType`: String (`ESP32-SPB`)
- `firmwareVersion`: String (`1.0.0`)
- `connectionStatus`: String (`ONLINE` | `OFFLINE`)
- `lastSeenAt`: Date
- `wifiRssi`: Number (nullable)
- `uptimeSeconds`: Number
- `capabilities`: Object
  - `supportsRemoteArm`: Boolean
  - `supportsRemoteDisarm`: Boolean (default: `false` for base prototype)
  - `supportsRemoteTare`: Boolean
  - `supportsOtaUpdate`: Boolean
- `settings`: Object
  - `minParcelWeightGrams`: Number (default: `50`)
  - `weightSettlingDurationMs`: Number (default: `3000`)
  - `armingDelaySeconds`: Number (default: `10`)
  - `vibrationWindowMs`: Number (default: `500`)
  - `debounceLidMs`: Number (default: `80`)
  - `magneticSensorInverted`: Boolean (default: `false`)
  - `buzzerActiveHigh`: Boolean (default: `true`)
  - `calibratedScaleFactor`: Number (default: `420.0`)
  - `tareOffset`: Number (default: `0`)

### 1.3 `sensor_readings`
High-frequency sensor telemetry.
- `_id`: ObjectId
- `deviceId`: String (index)
- `weightRaw`: Number
- `weightGrams`: Number
- `weightValid`: Boolean
- `hx711Ready`: Boolean
- `lidClosed`: Boolean
- `magneticRaw`: Number
- `vibrationDetected`: Boolean
- `vibrationRaw`: Number
- `parcelPresent`: Boolean
- `armed`: Boolean
- `alarmActive`: Boolean
- `redLedActive`: Boolean
- `greenLedActive`: Boolean
- `buzzerActive`: Boolean
- `wifiRssi`: Number
- `uptimeSeconds`: Number
- `firmwareVersion`: String
- `deviceTimestamp`: String
- `receivedAt`: Date (index)
- `isSimulated`: Boolean

*Compound Index*: `{ deviceId: 1, receivedAt: -1 }`

### 1.4 `parcel_events`
Audit trail of package deposits and removals.
- `_id`: ObjectId
- `eventId`: String (unique index)
- `deviceId`: String (index)
- `eventType`: String (`PARCEL_DETECTED` | `PARCEL_REMOVED`)
- `weightGrams`: Number
- `description`: String
- `deviceTimestamp`: String
- `receivedAt`: Date (index)
- `isSimulated`: Boolean

*Compound Index*: `{ deviceId: 1, receivedAt: -1 }`

### 1.5 `security_events`
Tamper incidents, alarm activations, and acknowledgements.
- `_id`: ObjectId
- `eventId`: String (unique index)
- `deviceId`: String (index)
- `eventType`: String (e.g. `ALARM_TRIGGERED`, `VIBRATION_DETECTED`, `LID_OPENED`)
- `severity`: String (`CRITICAL` | `WARNING` | `INFO`, indexed)
- `sourceSensor`: String (`REED_SWITCH` | `SW-420` | `LOCAL_SECURITY_FSM` | `PUSH_BUTTON`)
- `description`: String
- `weightGrams`: Number (optional)
- `acknowledged`: Boolean (default: `false`, indexed)
- `acknowledgedBy`: String (nullable)
- `acknowledgedAt`: Date (nullable)
- `deviceTimestamp`: String
- `receivedAt`: Date (index)
- `isSimulated`: Boolean

*Compound Index*: `{ deviceId: 1, severity: 1, receivedAt: -1 }`

### 1.6 `device_commands`
Command dispatch and execution audit log.
- `_id`: ObjectId
- `commandId`: String (unique index)
- `deviceId`: String (index)
- `commandType`: String
- `payload`: Object
- `requestedBy`: String
- `status`: String (`PENDING` | `DISPATCHED` | `ACKNOWLEDGED` | `FAILED` | `REJECTED`)
- `requestedAt`: Date (index)
- `acknowledgedAt`: Date (nullable)
- `result`: String (nullable)

*Compound Index*: `{ deviceId: 1, status: 1, requestedAt: -1 }`

