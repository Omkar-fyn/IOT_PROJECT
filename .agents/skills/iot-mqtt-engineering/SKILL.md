---
name: iot-mqtt-engineering
description: Guidelines for MQTT broker integration, topic topology, QoS guarantees, LWT, and event deduplication
---

# IoT MQTT Engineering Skill

## Purpose
Defines protocols and patterns for reliable, secure asynchronous telemetry and command messaging between ESP32 devices and the backend.

## Key Directives
- **Topic Hierarchy**:
  - Telemetry: `parcelbox/{deviceId}/telemetry` (QoS 0 or 1 periodic)
  - Events: `parcelbox/{deviceId}/events` (QoS 1, idempotent event IDs)
  - Device Status: `parcelbox/{deviceId}/status` (QoS 1, Retained with LWT)
  - Commands: `parcelbox/{deviceId}/commands` (QoS 1, non-retained)
  - Acks: `parcelbox/{deviceId}/command-acks` (QoS 1)
- **Validation**: Reject payloads where topic `{deviceId}` does not match JSON payload `deviceId`.
- **Deduplication**: Store and check `eventId` cache to prevent replay or duplicate alert processing.
- **Fail-Safe Disconnects**: Configure Last Will and Testament (`status: "OFFLINE"`) on broker connection.

