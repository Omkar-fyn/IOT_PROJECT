# Smart Parcel Box with Tamper Detection

A production full-stack IoT platform for parcel presence detection, physical tamper alerting, and real-time security monitoring. Powered by an **ESP32 DevKit** edge controller, **Mosquitto MQTT broker**, **Node.js + Express + TypeScript** backend, **MongoDB**, and a **React + Vite + Tailwind CSS** monitoring dashboard.

```
                    SMART PARCEL BOX
                          |
                          v
                     ESP32 DEVKIT
                          |
                 +--------+--------+
                 |                 |
                 v                 v
              SENSORS           OUTPUTS
             Load Cell        Red LED / Green LED
             Reed Switch         Buzzer
             SW-420
                 |
                 v
               Wi-Fi
                 |
                 v
           MQTT BROKER
            Mosquitto
                 |
                 v
           NODE.JS BACKEND
                 |
          +------+------+
          |             |
          v             v
       MongoDB       Socket.IO
          |             |
          +------+------+
                 |
                 v
           REACT DASHBOARD
                 |
                 v
              OWNER
```

---

## 1. Key Engineering Principles

1. **Edge-First Local Security Decoupling**:
   The ESP32 makes all physical tamper and alarm decisions **autonomously**. If the box is armed and the lid opens or vibration is detected, the local buzzer siren (GPIO 18) and red strobe (GPIO 21) trigger instantly without requiring Wi-Fi, MQTT, or backend connectivity.
2. **Strict Schema & Hardware Protection**:
   Incoming telemetry and events are validated at runtime via Zod schemas. Invalid raw readings (such as HX711 `-1`) are trapped and marked `weightValid: false` to prevent falsified weights.
3. **Zero-Dependency Local Fallback**:
   The backend includes an automatic fallback to an in-memory repository and an embedded MQTT broker (Aedes) if MongoDB or Mosquitto are not actively running, allowing development and testing out-of-the-box.

---

## 2. Hardware Pin Map (ESP32 DevKit)

| Component | ESP32 GPIO | Direction | Electrical Logic & Function |
|---|---|---|---|
| **Magnetic Sensor DO** | **GPIO 27** | Input (`INPUT_PULLUP`) | Reed switch monitoring box lid. LOW = Closed. |
| **SW-420 DO** | **GPIO 25** | Input | Shock/vibration module. Filtered via 200ms multi-pulse window. |
| **Push Button** | **GPIO 26** | Input (`INPUT_PULLUP`) | Physical alarm silence & arming toggle switch. |
| **Active Buzzer** | **GPIO 18** | Output | Audible tamper siren. Clamped LOW on boot. |
| **Red LED** | **GPIO 21** | Output | Visual tamper strobe indicator. |
| **Green LED** | **GPIO 19** | Output | System ready / armed indicator. |
| **HX711 DT (DOUT)** | **GPIO 32** | Input | Load cell amplifier 24-bit serial data line. |
| **HX711 SCK (CLK)** | **GPIO 33** | Output | Load cell amplifier serial clock line. |

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS (Dark Vercel/Linear theme) |
| **Icons & Visuals** | Lucide React |
| **Charts** | Recharts |
| **Motion** | Framer Motion |
| **State Management** | Zustand |
| **Real-Time Client** | Socket.IO Client |
| **Validation** | Zod |
| **Backend** | Node.js + Express.js + TypeScript |
| **Database** | MongoDB + Mongoose (with in-memory fallback) |
| **MQTT Broker** | Eclipse Mosquitto (with embedded Aedes fallback) |
| **Real-Time Engine** | Socket.IO |
| **Authentication** | JWT + bcrypt |
| **Testing** | Vitest + Supertest |
| **Containerisation** | Docker + Docker Compose |

---

## 4. Quickstart Guide (Windows PowerShell)

### Step 1: Install Dependencies
Open PowerShell in the project directory:
```powershell
npm install
```

### Step 2: Build All Monorepo Workspaces
```powershell
npm run build
```

### Step 3: Start Development Servers
Run the backend API and frontend dashboard concurrently:

**Terminal 1 (Backend API & In-Memory / MQTT Broker):**
```powershell
npm run dev:api
```
- API Server: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- Initial Admin: `admin@parcelbox.local` / `Admin@Secure2026`

**Terminal 2 (Frontend Dashboard):**
```powershell
npm run dev:web
```
- Dashboard: `http://localhost:5173`

**Terminal 3 (Device Simulator - Optional for testing without physical ESP32):**
```powershell
npm run dev:simulator
```

---

## 5. Docker Infrastructure (Optional)

To run standalone MongoDB and Mosquitto MQTT broker containers:
```powershell
docker-compose up -d
```
To stop the services:
```powershell
docker-compose down
```

---

## 6. Running Test Suites

Execute the automated unit and API integration tests:
```powershell
npm run test --workspace=@smart-parcel-box/api
```

---

## 7. Interactive Hardware Simulator Dock

The web dashboard features an interactive **Hardware Simulator Dock** in the lower-right corner. It allows testing all 12 edge scenarios right in your browser:
- 📦 **Deposit Parcel (1450g)**
- 🚪 **Open Lid** (triggers instant alarm if armed)
- 🔒 **Close Lid**
- ⚡ **Tamper Shock** (SW-420 trigger)
- 🔘 **Push Button (Ack)** (physically silences buzzer and resets alarm)
- 📦 **Remove Parcel**
- ⚠️ **Simulate HX711 Fault** (tests raw reading `-1` error handling)
- 🔄 **Reset State**

---

## 8. Documentation Index

- [System Architecture](docs/ARCHITECTURE.md)
- [Hardware Connections & Wiring Guide](docs/HARDWARE_CONNECTIONS.md)
- [MQTT Protocol Specification](docs/MQTT_PROTOCOL.md)
- [REST API Documentation](docs/API_DOCUMENTATION.md)
- [Database Schema Specification](docs/DATABASE_SCHEMA.md)
- [ESP32 Firmware Documentation](firmware/esp32/README.md)
- [Troubleshooting Runbook](docs/TROUBLESHOOTING.md)

