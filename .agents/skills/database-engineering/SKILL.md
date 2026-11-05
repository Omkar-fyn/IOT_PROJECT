---
name: database-engineering
description: Data modeling, indexing, schema migrations, and persistence strategy using MongoDB and Mongoose
---

# Database Engineering Skill

## Purpose
Establishes data models and indexing strategies for high-frequency IoT sensor telemetry and immutable security audit trails.

## Collections & Indexing
- `users`: Indexed by `email` (unique).
- `devices`: Indexed by `deviceId` (unique).
- `sensor_readings`: Compound index on `(deviceId, receivedAt DESC)` for fast time-series queries.
- `parcel_events`: Compound index on `(deviceId, receivedAt DESC)`.
- `security_events`: Compound index on `(deviceId, severity, receivedAt DESC)`.
- `device_commands`: Compound index on `(deviceId, status, requestedAt DESC)`.

## Retention & Performance
- Telemetry readings use pagination and date-range limits to keep dashboard queries performant.
- Graceful database fallback mechanism to allow local development or testing without a standalone MongoDB server.

