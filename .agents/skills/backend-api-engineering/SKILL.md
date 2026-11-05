---
name: backend-api-engineering
description: Standards and guidelines for Node.js, Express, TypeScript, REST API design, middleware, and Socket.IO integration
---

# Backend API Engineering Skill

## Purpose
Governs the creation and maintenance of the Node.js + Express + TypeScript API server powering the Smart Parcel Box platform.

## Key Directives
- **Layered Architecture**: Route handlers delegate immediately to controllers, which call services and repositories. Do not put business or data persistence logic in route definitions or `server.ts`.
- **Validation**: All incoming requests (`req.body`, `req.query`, `req.params`) must pass Zod schema validation before controller execution.
- **Consistent Response Schema**:
  - Success: `{ success: true, data: T, message?: string }`
  - Error: `{ success: false, error: { code: string, message: string, details?: unknown } }`
- **Security Middleware**: Mandate Helmet headers, CORS restrictions, rate limiting on authentication and command routes, and JWT token verification.
- **Real-Time Gateway**: Socket.IO server must broadcast normalized event envelopes (`telemetry:update`, `security:event`, `device:status`).

