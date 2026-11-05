---
name: cybersecurity-review
description: Security auditing, credential defense, token authentication, rate limiting, and IoT attack surface minimization
---

# Cybersecurity Review Skill

## Purpose
Ensures defense-in-depth across the IoT edge device, broker, REST API, WebSocket transport, and dashboard.

## Key Directives
- **Zero Secrets in Frontend**: `VITE_` variables must contain only public base URLs. No private keys, JWT secrets, or broker passwords.
- **Strict Role-Based Access Control**: Require authenticated Bearer JWT tokens for all management and command endpoints.
- **Password Protection**: Passwords hashed with bcrypt (salt rounds >= 10).
- **Rate Limiting**: Protect login endpoints and command routes against brute-force and DoS.
- **Command Sanitization**: Reject unsupported or unvalidated command types; check device capability flags before dispatching commands.
- **Fail-Safe Physical State**: System failure or network disconnection must never physically disarm an active security state or open a secure lock.

