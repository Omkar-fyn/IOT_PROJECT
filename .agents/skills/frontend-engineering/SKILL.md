---
name: frontend-engineering
description: Standards and guidelines for React, TypeScript, Vite, Tailwind CSS, shadcn/ui, and Zustand frontend architecture
---

# Frontend Engineering Skill

## Purpose
Establishes the design standards, component architecture, state management patterns, and real-time Socket.IO synchronization for the Smart Parcel Box dashboard.

## Key Directives
- **Visual Aesthetic**: Deep dark theme (slate/charcoal background `#090d16` and `#0f172a`), subtle 1px border lines (`#1e293b`), crisp typography, cyan/blue accents (`#06b6d4`, `#3b82f6`), semantic status tokens (Green for Ready/Armed, Amber for Warning/Arming, Red for Tamper/Alarm).
- **Component Modularity**: Compose views out of small, self-contained components in `components/ui`, `components/dashboard`, `components/sensors`, and `components/security`.
- **State Separation**:
  - Global authentication and UI preferences in Zustand store.
  - Live device telemetry, connection status, and real-time feeds in a dedicated real-time store.
  - Server-state cached and revalidated using TanStack Query.
- **Stale Data Handling**: If no telemetry heartbeat arrives within 15 seconds, switch status indicator to `CONNECTION LOST / DATA STALE`.
- **Simulator Labeling**: Always render a badge or indicator when operating in simulated mode.

