# Smart Parcel Box — REST API Documentation

All endpoints return a standardized JSON envelope:
- **Success**: `{ "success": true, "data": T, "message"?: string }`
- **Error**: `{ "success": false, "error": { "code": string, "message": string, "details"?: any } }`

Base URL: `http://localhost:5000/api/v1`
Authentication: Bearer JWT in the `Authorization` header (`Authorization: Bearer <token>`).

---

## 1. Authentication Endpoints

### 1.1 POST `/auth/login`
Authenticates user credentials and returns a signed JWT.

**Request Body**:
```json
{
  "email": "admin@parcelbox.local",
  "password": "Admin@Secure2026"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "usr_1793668200_a1b2",
      "name": "Chief Security Officer",
      "email": "admin@parcelbox.local",
      "role": "admin"
    }
  }
}
```

### 1.2 GET `/auth/me`
Returns current session profile. Requires Bearer Token.

### 1.3 POST `/auth/change-password`
Updates user password. Requires Bearer Token.

---

## 2. Device Endpoints

### 2.1 GET `/devices`
Lists all registered Smart Parcel Boxes.

### 2.2 GET `/devices/:deviceId`
Returns single box metadata and capabilities.

### 2.3 GET `/devices/:deviceId/health`
Returns connection status, staleness indicator, and sensor health flags:
```json
{
  "success": true,
  "data": {
    "deviceId": "BOX-001",
    "connectionStatus": "ONLINE",
    "isStale": false,
    "lastSeenAt": "2026-11-03T10:30:00.000Z",
    "wifiRssi": -58,
    "uptimeSeconds": 3600,
    "firmwareVersion": "1.0.0",
    "sensorHealth": {
      "hx711": true,
      "weightValid": true,
      "magneticSensor": true,
      "vibrationSensor": true
    }
  }
}
```

### 2.4 GET `/devices/:deviceId/settings`
Returns operational settings (thresholds, debounce windows, arming delays).

### 2.5 PATCH `/devices/:deviceId/settings`
Updates device settings and publishes an `UPDATE_SETTINGS` command via MQTT.

---

## 3. Telemetry & Sensor Endpoints

### 3.1 GET `/telemetry/:deviceId/latest`
Returns the most recent reading received from the load cell, reed switch, and SW-420.

### 3.2 GET `/telemetry/:deviceId?limit=100`
Returns paginated time-series telemetry for charts.

---

## 4. Parcel Endpoints

### 4.1 GET `/parcels/:deviceId/current`
Returns current package presence state and weight.

### 4.2 GET `/parcels/:deviceId/events?limit=50`
Returns historical deposit and retrieval events.

---

## 5. Security & Tamper Endpoints

### 5.1 GET `/security/:deviceId/events?page=1&limit=25&severity=CRITICAL`
Returns filtered incident records.

### 5.2 POST `/security/:deviceId/events/:eventId/acknowledge`
Marks a security incident acknowledged by the authenticated owner.

---

## 6. Remote Command Endpoints

### 6.1 POST `/commands/:deviceId`
Dispatches an authorized command to the ESP32.

**Request Body**:
```json
{
  "commandType": "ARM_SYSTEM",
  "payload": {}
}
```

**Response (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "commandId": "cmd_1793668800_44e",
    "deviceId": "BOX-001",
    "commandType": "ARM_SYSTEM",
    "status": "DISPATCHED",
    "message": "Command published to MQTT broker. Awaiting device execution and ack."
  }
}
```

*Note: If `commandType` is `DISARM_SYSTEM` and device capabilities report `supportsRemoteDisarm: false`, the API rejects the request with HTTP 400 (`CAPABILITY_NOT_SUPPORTED`).*

---

## 7. System Health Endpoint

### 7.1 GET `/api/health`
Public heartbeat endpoint reporting backend status, database connection, and MQTT broker state.
```json
{
  "status": "UP",
  "uptime": 120.4,
  "timestamp": "2026-11-03T10:45:00.000Z",
  "services": {
    "database": {
      "connected": true,
      "mode": "MONGODB_CONNECTED",
      "uri": "mongodb://localhost:27017/smart_parcel_box"
    },
    "mqtt": {
      "connected": true,
      "broker": "mqtt://localhost:1883"
    }
  }
}
```

