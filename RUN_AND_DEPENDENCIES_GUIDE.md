# Smart Parcel Box — Complete Dependencies & Execution Guide

This document provides a comprehensive technical breakdown of all software dependencies, hardware libraries, environment configurations, and step-by-step execution instructions across the entire Smart Parcel Box platform.

---

## 1. System Requirements & Prerequisites

| Requirement | Minimum Version | Recommended | Description |
|---|---|---|---|
| **Node.js** | `v18.0.0+` | `v20.x` or `v22.x` (LTS) / `v25.x` | Runtime environment for backend, frontend tooling, and simulator. |
| **npm** | `v9.0.0+` | `v10.x` or `v11.x` | Package manager supporting npm workspaces. |
| **Git** | `v2.30+` | Latest | Version control. |
| **Arduino IDE** | `v2.0+` | Latest | For uploading firmware to the ESP32 DevKit. |
| **Docker (Optional)** | `v24.0+` | Latest | Optional for running containerized MongoDB and Mosquitto broker. |

---

## 2. Comprehensive Dependency Breakdown

The project is structured as an **npm monorepo** with workspaces (`packages/*`, `apps/*`).

```
smart-parcel-box/
├── packages/
│   └── shared/       # Canonical types, schemas, and constants
├── apps/
│   ├── api/          # Express + TypeScript backend & MQTT service
│   └── web/          # React 18 + Vite + Tailwind CSS dashboard
└── firmware/
    └── esp32/        # C++ Arduino sketches for ESP32 DevKit
```

### 2.1 Shared Library (`packages/shared`)

Provides a single source of truth for runtime validation schemas and TypeScript types used by both frontend and backend.

| Package | Version | Purpose |
|---|---|---|
| `zod` | `^3.23.8` | Schema definition and runtime validation for telemetry, events, commands, and settings. |
| `typescript` | `^5.7.3` | Compiles shared types and interfaces to declaration files (`.d.ts`). |

---

### 2.2 Backend Application (`apps/api`)

The Node.js + Express backend acts as the REST API server, MQTT consumer, and real-time Socket.IO gateway.

#### Production Dependencies
| Package | Version | Architectural Role |
|---|---|---|
| `@smart-parcel-box/shared` | `*` | Workspace dependency for canonical types and Zod schemas. |
| `express` | `^4.21.2` | Core HTTP web server framework. |
| `cors` | `^2.8.5` | Cross-Origin Resource Sharing middleware for frontend API access. |
| `helmet` | `^8.0.0` | HTTP security headers protection against web vulnerabilities. |
| `dotenv` | `^16.4.7` | Loads environment configuration variables from `.env`. |
| `express-rate-limit` | `^7.5.0` | Prevents brute-force on authentication and command routes. |
| `jsonwebtoken` | `^9.0.2` | Generates and verifies HMAC-SHA256 signed JWT tokens. |
| `bcryptjs` | `^2.4.3` | Salted password hashing (10 salt rounds) for owner credentials. |
| `mongoose` | `^8.9.5` | Object Data Modeling (ODM) library for MongoDB. |
| `mqtt` | `^5.10.3` | High-performance MQTT client connecting to the broker to subscribe to telemetry and dispatch commands. |
| `aedes` | `^0.51.2` | **Embedded MQTT Broker Fallback**: Allows the backend to run an internal MQTT broker on port 1883 if Mosquitto is not running, providing zero-dependency local execution. |
| `socket.io` | `^4.8.1` | Real-time WebSocket server broadcasting live telemetry (`telemetry:update`), alarms (`alarm:state`), and incidents (`security:event`). |
| `zod` | `^3.23.8` | Validates incoming REST request bodies, query parameters, and MQTT payloads. |

#### Development & Testing Dependencies
| Package | Version | Role |
|---|---|---|
| `tsx` | `^4.19.2` | TypeScript Execute engine for instant hot-reload without ahead-of-time manual compilation. |
| `typescript` | `^5.7.3` | Static type analysis and compilation. |
| `vitest` | `^3.0.4` | Fast unit and integration test runner. |
| `supertest` | `^7.0.0` | HTTP assertion library for integration testing REST endpoints. |
| `@types/*` | Latest | Type declarations for Node, Express, CORS, JWT, Bcrypt, Supertest. |

---

### 2.3 Frontend Dashboard (`apps/web`)

An industrial-grade real-time monitoring interface inspired by modern security systems (Vercel/Linear dark aesthetics).

#### Production Dependencies
| Package | Version | Architectural Role |
|---|---|---|
| `react` & `react-dom` | `^18.3.1` | Component UI framework. |
| `react-router-dom` | `^6.28.2` | Client-side routing with protected route guards. |
| `@smart-parcel-box/shared` | `*` | Workspace import of shared types, enums, and schemas. |
| `zustand` | `^5.0.3` | Lightweight, scalable state management for telemetry, authentication, and UI settings. |
| `@tanstack/react-query` | `^5.64.2` | Server-state synchronization, caching, and background refetching. |
| `socket.io-client` | `^4.8.1` | Client WebSocket library subscribing to real-time events from the backend. |
| `lucide-react` | `^0.473.0` | Comprehensive icon set for hardware status, sensors, alarms, and navigation. |
| `recharts` | `^2.15.0` | SVG charting library rendering real-time weight timelines, delivery distributions, and trigger analytics. |
| `framer-motion` | `^12.0.5` | Smooth UI transitions and status pulse effects. |
| `@radix-ui/*` | `^1.x` / `^2.x` | Accessible, unstyled UI primitives (Dialog, Dropdown Menu, Slider, Switch, Tabs, Tooltip). |
| `clsx` & `tailwind-merge` | Latest | Conditional CSS class merging utility. |
| `react-hook-form` & `@hookform/resolvers` | `^7.54.2` | High-performance form state management with Zod integration. |
| `zod` | `^3.23.8` | Client-side form validation. |

#### Development & Build Dependencies
| Package | Version | Role |
|---|---|---|
| `vite` | `^6.0.9` | High-speed frontend build tool and dev server with HMR. |
| `@vitejs/plugin-react` | `^4.3.4` | Fast Refresh Babel/SWC React plugin for Vite. |
| `tailwindcss` | `^3.4.17` | Utility-first CSS framework customized with industrial dark theme tokens. |
| `postcss` & `autoprefixer` | Latest | CSS post-processing and vendor prefixing. |
| `vitest` & `jsdom` | Latest | Frontend testing environment. |
| `@testing-library/react` | `^16.2.0` | DOM testing utilities for React components. |

---

### 2.4 ESP32 Firmware Libraries (Arduino C++)

To compile and flash the firmware sketches in `firmware/esp32/` onto the ESP32 DevKit, install these libraries in the Arduino IDE (**Tools -> Manage Libraries...**):

| Library Name | Author | Purpose |
|---|---|---|
| **PubSubClient** | Nick O'Leary | Lightweight MQTT client for publishing telemetry and receiving commands. |
| **ArduinoJson** | Benoit Blanchon (v6 or v7) | Fast JSON serialization and deserialization for MQTT payloads. |
| **HX711 Arduino Library** | Bogdan Necula (bogde) | Interface library for the 24-bit HX711 ADC connected to the load cell. |
| **WiFi** | Built-in | ESP32 native Wi-Fi 802.11 b/g/n station stack. |

---

## 3. How to Run the Code (Step-by-Step)

### Step 1: Open Terminal in the Project Root
Open PowerShell (on Windows) or Terminal (on macOS/Linux):
```powershell
cd "c:\Users\OMKAR BHARATH PUKALE\OneDrive\Desktop\IOT Project"
```

### Step 2: Install All Dependencies
Install monorepo dependencies across all packages and applications:
```powershell
npm install
```

### Step 3: Build Monorepo Workspaces
Build the shared library, backend, and frontend production bundles:
```powershell
npm run build
```

---

### Step 4: Run the Application Services

You can run the platform in two ways:

#### Option A: Running Development Servers (Recommended)

Open separate terminal windows:

**Terminal 1 — Backend Server (API + WebSocket + In-Memory DB + Embedded MQTT Broker):**
```powershell
npm run dev:api
```
- REST API: `http://localhost:5000/api/v1`
- Health check: `http://localhost:5000/api/health`
- WebSocket Server: `ws://localhost:5000`
- MQTT Broker: `mqtt://0.0.0.0:1883`

**Terminal 2 — Frontend Monitoring Dashboard:**
```powershell
npm run dev:web
```
- Web Dashboard: `http://localhost:5173`
- Open your browser to `http://localhost:5173`.
- Log in with the default admin credentials:
  - **Email:** `admin@parcelbox.local`
  - **Password:** `Admin@Secure2026`
  *(Or click **"⚡ Fill Default Admin Credentials"** on the login screen).*

**Terminal 3 (Optional) — Hardware Device Simulator:**
```powershell
npm run dev:simulator
```
*(Note: You can also use the interactive **Simulator Controls** floating dock directly in the bottom-right corner of the web browser!)*

---

#### Option B: Running with Docker (Optional Standalone Infrastructure)

If you have Docker Desktop installed and want to run dedicated MongoDB and Mosquitto broker containers:
```powershell
# Start MongoDB (port 27017) and Eclipse Mosquitto (port 1883)
docker-compose up -d

# Start backend and web apps
npm run dev:api
npm run dev:web
```

---

## 4. Running Automated Tests

Run the test suite verifying Zod schema validation, authentication, role authorization, and REST endpoints:
```powershell
npm run test --workspace=@smart-parcel-box/api
```

---

## 5. Connecting Real ESP32 Hardware to the Dashboard

When connecting your physical ESP32 to stream live sensor readings:

1. **Find your Computer's Local IP Address**:
   In PowerShell, run:
   ```powershell
   ipconfig
   ```
   Look for your **IPv4 Address** under `Wireless LAN adapter Wi-Fi` (for example, `10.197.118.157` or `192.168.1.x`).

2. **Configure the Firmware**:
   Open [`firmware/esp32/mqtt-integration/mqtt-integration.ino`](file:///c:/Users/OMKAR%20BHARATH%20PUKALE/OneDrive/Desktop/IOT%20Project/firmware/esp32/mqtt-integration/mqtt-integration.ino) in Arduino IDE.
   Update lines 31-35:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_NETWORK_NAME";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* MQTT_BROKER   = "10.197.118.157"; // Put YOUR computer's IPv4 address here
   const int   MQTT_PORT     = 1883;
   ```

3. **Allow MQTT in Windows Firewall**:
   Ensure Windows Firewall allows inbound connections on port 1883 so the ESP32 can communicate with the backend broker. In an Administrator PowerShell terminal:
   ```powershell
   New-NetFirewallRule -DisplayName "MQTT Broker Port 1883" -Direction Inbound -LocalPort 1883 -Protocol TCP -Action Allow
   ```

4. **Upload Firmware**:
   Connect your ESP32 DevKit via USB, select your board and COM port in Arduino IDE, and click **Upload**.
   Open the Serial Monitor at **115200 baud**. Once it prints `[MQTT] connected!`, your dashboard at `http://localhost:5173` will automatically switch from `OFFLINE` to **ONLINE** and stream real-time weight, lid state, and vibration data!
