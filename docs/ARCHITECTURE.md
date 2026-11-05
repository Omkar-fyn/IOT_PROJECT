# Smart Parcel Box with Tamper Detection — System Architecture

## 1. Architectural Philosophy: Edge Autonomy & Decoupled Defense

The Smart Parcel Box IoT platform is engineered around a critical security principle:
> **The physical security of the parcel box must never depend on the internet, cloud availability, MQTT broker uptime, or dashboard responsiveness.**

The edge device (ESP32 DevKit) is programmed with an **autonomous local security finite state machine (FSM)**. If armed and a tamper event occurs (such as an unauthorized lid opening or physical vibration shock), the local siren (active buzzer on GPIO 18) and visual alarm strobe (red LED on GPIO 21) activate **immediately and locally**. Disconnection of Wi-Fi or MQTT will not disable or silence physical tamper detection.

```
                      +-----------------------------+
                      |      SMART PARCEL BOX       |
                      |   (Physical Enclosure)      |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |        ESP32 DEVKIT         |
                      | (Autonomous Security FSM)   |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
      +-----------------+                         +-----------------+
      |     SENSORS     |                         |     OUTPUTS     |
      | - Load Cell     |                         | - Red Alarm LED |
      |   (HX711)       |                         | - Green Status  |
      | - Reed Switch   |                         | - Active Buzzer |
      | - SW-420 Shock  |                         |   (Local Siren) |
      | - Push Button   |                         +-----------------+
      +--------+--------+
               |
               v (Wi-Fi 802.11 b/g/n)
      +-----------------+
      |   MQTT BROKER   |
      | Eclipse Mosq.   |
      | Port 1883       |
      +--------+--------+
               |
               v (QoS 1, LWT)
      +---------------------------------------------+
      |               NODE.JS BACKEND               |
      | Express • TypeScript • Mongoose • Socket.IO |
      +----------------------+----------------------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
     +-----------------+           +-----------------+
     |     MONGODB     |           |    SOCKET.IO    |
     | Time-Series &   |           | Real-Time Event |
     | Audit Log DB    |           | Broadcast Gate  |
     +-----------------+           +--------+--------+
                                            |
                                            v (WebSockets)
                                   +-----------------+
                                   | REACT DASHBOARD |
                                   | (Vite/Tailwind) |
                                   +--------+--------+
                                            |
                                            v
                                   +-----------------+
                                   |      OWNER      |
                                   +-----------------+
```

---

## 2. Core Subsystems

### Edge Microcontroller (ESP32 DevKit)
- **Local Security FSM**: States include `READY`, `PARCEL_PRESENT`, `ARMING`, `ARMED`, and `ALARM`.
- **Sensor Drivers**: HX711 load cell amplifier (24-bit ADC), magnetic reed switch for lid closure, SW-420 vibration sensor with sliding-window pulse integrator, physical push button.
- **Fail-Safe Disconnects**: Configured with MQTT Last Will and Testament (LWT) on `parcelbox/{deviceId}/status` to immediately signal `OFFLINE` if power or network drops.

### Message Transport (MQTT Broker)
- **Eclipse Mosquitto (v2.0)**: Low-latency publish/subscribe transport.
- **Embedded In-Process Broker Fallback (Aedes)**: Integrated into the backend server to enable zero-dependency local development and automated testing if Mosquitto is not running.

### Application Server (Node.js + Express + TypeScript)
- **MQTT Consumer**: Subscribes to telemetry, security events, and command acknowledgements with payload schema validation (Zod) and deduplication.
- **Database Abstraction**: Persists readings into MongoDB collections (with memory cache fallback for standalone testing).
- **Socket.IO Gateway**: Pushes live telemetry and events to authenticated web clients.
- **REST API**: Provides endpoints for authentication, device health, historical telemetry, and authorized remote command dispatch.

### Frontend Monitoring Dashboard (React + TypeScript + Vite)
- **Industrial Dark-Theme UI**: Built with Tailwind CSS, Lucide React, and Recharts.
- **10 Core Views**: Overview, Live Monitoring, Parcel Monitoring, Security Center, Activity History, Analytics, Device Management, Settings, Profile, and Login.
- **Data Staleness Engine**: Alerts users if telemetry is older than 15 seconds.
- **Hardware Simulator Dock**: Integrated test panel enabling immediate validation of all 12 edge scenarios without physical hardware attached.

