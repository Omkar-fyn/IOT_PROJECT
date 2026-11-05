---
description: Core architectural and security rules for the Smart Parcel Box project
---

# Project Operational Rules

- Ensure strict TypeScript compile flags (`noImplicitAny`, `strictNullChecks`).
- Handle all sensor invalid states explicitly (e.g., HX711 reporting raw `-1` or disconnect flag sets `weightValid: false`).
- Remote disarm capabilities must verify device capability flags before rendering active controls on the dashboard.
- Every MQTT command must generate an acknowledgement event with correlation ID.

