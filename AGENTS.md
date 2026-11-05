# Smart Parcel Box Workspace Agent Rules

These rules govern all engineering operations across the Smart Parcel Box project:

1. **TypeScript Throughout**: Strictly use TypeScript across frontend, backend, shared packages, and automation scripts.
2. **Schema Validation**: Validate all incoming REST requests, WebSocket messages, and MQTT payloads at runtime using Zod.
3. **No Secret Leaks**: Never expose private credentials, API keys, or JWT secrets in client-side code or `VITE_` variables.
4. **Environment Hygiene**: Never commit actual `.env` files; always supply `.env.example`.
5. **Local Security Decoupling**: The ESP32 must make security and alarm decisions autonomously. Never allow the web dashboard or cloud backend to be a single point of failure for physical tamper protection.
6. **No Fabricated Readings**: Never display fake or simulated sensor telemetry as live hardware data without explicitly labeling it `DEMO / SIMULATED`.
7. **Modular UI Architecture**: Build modular, reusable components using Tailwind CSS and Radix UI rather than giant monolithic view components.
8. **Separation of Schemas**: Maintain canonical types and schemas in `@smart-parcel-box/shared` and import them cleanly into both `apps/web` and `apps/api`.
9. **Rigorous Testing**: Provide automated unit and integration tests for critical business logic, security event flows, and validation rules.
10. **Hardware & Protocol Integrity**: Never silently alter GPIO assignments. All pinouts, electrical logic levels, and MQTT topics must match `docs/HARDWARE_CONNECTIONS.md` and `docs/MQTT_PROTOCOL.md`.

