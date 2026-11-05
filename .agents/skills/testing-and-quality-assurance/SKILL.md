---
name: testing-and-quality-assurance
description: Test strategy, automated suites, unit tests with Vitest, API integration with Supertest, and E2E verification
---

# Testing and Quality Assurance Skill

## Purpose
Guarantees reliability and correctness across frontend UI components, backend controllers, Zod validators, and simulated IoT hardware scenarios.

## Test Boundaries
1. **Unit Tests (Vitest)**:
   - Zod validation schemas against valid and invalid payloads.
   - Sensor data transformation and calibration functions.
   - React state management and store transitions.
2. **Integration Tests (Supertest)**:
   - Authentication flow: registration, login, JWT issuance, protected routes.
   - Telemetry ingestion API and security event recording.
   - Device command dispatch and acknowledgement tracking.
3. **Hardware Simulation Verification**:
   - Verify all 12 simulator scenarios trigger correct state transitions and UI alerts.
   - Test HX711 sensor error handling (`-1` raw reading).

