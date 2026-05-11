# 🌬️ IoT Air Pollution Monitor System

> **University Project — Advanced Networks**  
> A full-stack IoT web application for real-time air quality monitoring using ESP32, MQTT, Node.js, React, and MongoDB.

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Docker Setup](#docker-setup)
- [ESP32 Firmware](#esp32-firmware)
- [MQTT Topics](#mqtt-topics)
- [API Documentation](#api-documentation)
- [Alert Thresholds](#alert-thresholds)
- [Screenshots](#screenshots)

---

## 🎯 Overview

This system monitors harmful gases and air quality in real time using an ESP32 microcontroller with gas sensors. Data is transmitted via MQTT protocol to a Node.js backend, stored in MongoDB, and displayed on a modern React dashboard with live charts, alerts, and analytics.

**Why MQTT?**
- Lightweight protocol with minimal bandwidth usage
- Publish/Subscribe architecture ideal for IoT
- Works over WAN/global internet
- Real-time communication with low latency
- Better scalability than HTTP polling

---

## 🏗️ System Architecture

```
ESP32 + Sensors
    ↓ MQTT Publish (QoS 1)
Mosquitto MQTT Broker (port 1883 / WS: 9001)
    ↓ Subscribe
Node.js Backend Server (port 5000)
    ↓ Store
MongoDB Database (port 27017)
    ↓ WebSocket (Socket.IO)
React Web Dashboard (port 3000)
```

**Communication Flow:**
1. ESP32 reads sensors every 5 seconds
2. ESP32 publishes JSON data to MQTT topics
3. Backend subscribes to all `airpollution/sensors/#` topics
4. Backend processes data, checks thresholds, saves to MongoDB
5. Backend emits real-time updates to frontend via Socket.IO
6. Frontend displays live charts, gauges, and alerts

---

## ✨ Features

### Dashboard
- 🔴 Live sensor cards with status indicators (Safe/Warning/Critical)
- 📊 Air Quality Index (AQI) gauge
- 📈 Real-time area charts with live updates
- 🚨 Critical alert banners with acknowledge functionality
- 📡 MQTT & WebSocket connection status

### Analytics
- 📉 Hourly trend charts (Area + Line)
- 📊 Daily bar charts
- 🔍 Filter by gas type and time range (6H/24H/7D/30D)
- 📥 Export data to CSV

### Alerts
- ⚡ Real-time browser notifications
- 🔔 Toast notifications for critical/warning events
- ✅ Acknowledge individual or all alerts
- 📋 Alert history with pagination and filtering

### Devices
- 💻 Device registration and management
- 🟢 Online/offline status detection
- 📡 Remote commands (restart, calibrate) via MQTT
- 🔧 Sensor configuration per device

### Admin Panel
- 👥 User management (roles, activate/deactivate, delete)
- 📊 System statistics
- 🗑️ Database cleanup tools

### Security
- 🔐 JWT authentication
- 🔒 Password hashing (bcrypt, 12 rounds)
- 🛡️ Rate limiting (200 req/15min)
- 🪖 Helmet.js security headers
- 🔑 Role-based access control (admin/user/viewer)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB, Mongoose |
| IoT Protocol | MQTT (Mosquitto broker) |
| Authentication | JWT, bcryptjs |
| Hardware | ESP32, MQ-135, MQ-2, DHT11 |
| DevOps | Docker, Docker Compose |

---

## 📁 Project Structure

```
iot-air-pollution-monitor/
├── frontend/                    # React.js web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header, Layout
│   │   │   ├── dashboard/       # SensorCard, AQIGauge
│   │   │   ├── charts/          # LiveChart
│   │   │   └── alerts/          # AlertBanner
│   │   ├── pages/               # All page components
│   │   ├── context/             # AuthContext, SensorContext
│   │   ├── services/            # API service layer (axios)
│   │   └── index.css            # Tailwind + custom styles
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── backend/                     # Node.js Express server
│   ├── src/
│   │   ├── config/              # database.js, mqtt.js
│   │   ├── controllers/         # auth, sensor, alert, device, admin
│   │   ├── middleware/          # auth.js, errorHandler.js
│   │   ├── models/              # User, SensorReading, Alert, Device
│   │   ├── routes/              # All API routes
│   │   ├── utils/               # logger.js
│   │   └── server.js            # Main entry point
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── firmware/                    # ESP32 Arduino code
│   └── esp32_air_monitor/
│       └── esp32_air_monitor.ino
│
├── database/
│   └── schemas/                 # MongoDB schema documentation
│
├── docker/                      # Docker configuration
│   ├── docker-compose.yml
│   └── mosquitto/
│       └── mosquitto.conf
│
└── README.md
```

---

## 🚀 Quick Start (Docker)

The fastest way to run the entire system:

```bash
# 1. Clone the project
cd iot-air-pollution-monitor

# 2. Create MQTT password file
cd docker/mosquitto
echo "iotuser:$(mosquitto_passwd -c -b /dev/stdout iotuser iotpassword 2>/dev/null | tail -1)" > passwd
# OR manually create: iotuser:$7$...hashed_password...
cd ../..

# 3. Start all services
cd docker
docker-compose up -d

# 4. Open browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MQTT: localhost:1883 (TCP) / localhost:9001 (WebSocket)
```

---

## 🔧 Manual Setup

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Mosquitto MQTT Broker
- npm or yarn

### 1. Install Mosquitto

**macOS:**
```bash
brew install mosquitto
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mosquitto mosquitto-clients
```

**Windows:** Download from https://mosquitto.org/download/

### 2. Configure Mosquitto

Create `/etc/mosquitto/conf.d/iot.conf`:
```
listener 1883
listener 9001
protocol websockets
allow_anonymous false
password_file /etc/mosquitto/passwd
```

Create MQTT user:
```bash
sudo mosquitto_passwd -c /etc/mosquitto/passwd iotuser
# Enter password: iotpassword
sudo systemctl restart mosquitto
```

### 3. Setup Backend

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

### 4. Setup Frontend

```bash
cd frontend
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
echo "REACT_APP_SOCKET_URL=http://localhost:5000" >> .env
echo "REACT_APP_MQTT_URL=ws://localhost:9001" >> .env

# Start development server
npm start
```

### 5. Start MongoDB

```bash
# Local MongoDB
mongod --dbpath /data/db

# Or with MongoDB Atlas (cloud) - update MONGODB_URI in .env
```

---

## 🐳 Docker Setup

```bash
cd docker

# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f backend
docker-compose logs -f mosquitto

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 🔌 ESP32 Firmware

### Required Libraries (Arduino IDE)
Install via Library Manager:
- `PubSubClient` by Nick O'Leary
- `DHT sensor library` by Adafruit
- `ArduinoJson` by Benoit Blanchon
- `LiquidCrystal_I2C` by Frank de Brabander

### Hardware Wiring

| Component | ESP32 Pin |
|-----------|-----------|
| MQ-135 AOUT | GPIO 34 |
| MQ-2 AOUT | GPIO 35 |
| DHT11 DATA | GPIO 4 |
| Buzzer (+) | GPIO 25 |
| RGB LED Red | GPIO 26 |
| RGB LED Green | GPIO 27 |
| RGB LED Blue | GPIO 14 |
| LCD SDA | GPIO 21 |
| LCD SCL | GPIO 22 |

### Configuration

Edit `esp32_air_monitor.ino`:
```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER   = "YOUR_SERVER_IP";  // Public IP or domain
const char* MQTT_USER     = "iotuser";
const char* MQTT_PASS     = "iotpassword";
const char* DEVICE_ID     = "ESP32_001";
```

### Upload
1. Open `firmware/esp32_air_monitor/esp32_air_monitor.ino` in Arduino IDE
2. Select board: `ESP32 Dev Module`
3. Select correct COM port
4. Click Upload

---

## 📡 MQTT Topics

| Topic | Publisher | Subscriber | Description |
|-------|-----------|------------|-------------|
| `airpollution/sensors/mq135` | ESP32 | Backend | CO2, NH3, Benzene, Alcohol |
| `airpollution/sensors/mq2` | ESP32 | Backend | Smoke levels |
| `airpollution/sensors/dht11` | ESP32 | Backend | Temperature, Humidity |
| `airpollution/alerts` | Backend | Frontend | Alert notifications |
| `airpollution/status` | ESP32 | Backend | Device status |
| `airpollution/devices/{id}/command` | Backend | ESP32 | Remote commands |

### Message Format Examples

**MQ-135 Reading:**
```json
{
  "deviceId": "ESP32_001",
  "co2": 850.5,
  "nh3": 12.3,
  "benzene": 2.1,
  "alcohol": 45.0,
  "timestamp": 1234567890
}
```

**DHT11 Reading:**
```json
{
  "deviceId": "ESP32_001",
  "temperature": 25.5,
  "humidity": 65.0,
  "timestamp": 1234567890
}
```

---

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Sensors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sensors/latest` | Latest readings for all gases |
| GET | `/api/sensors/history` | Historical readings (query: gasType, hours, limit) |
| GET | `/api/sensors/analytics/hourly` | Hourly averages |
| GET | `/api/sensors/analytics/daily` | Daily averages |
| GET | `/api/sensors/aqi` | Air Quality Index |
| GET | `/api/sensors/export` | Export CSV |
| POST | `/api/sensors/simulate` | Simulate data (admin) |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Get alerts (query: level, acknowledged, page) |
| GET | `/api/alerts/unread-count` | Unread alert count |
| GET | `/api/alerts/stats` | Alert statistics |
| PUT | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| PUT | `/api/alerts/acknowledge-all` | Acknowledge all |
| DELETE | `/api/alerts/:id` | Delete alert (admin) |

### Devices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices` | List all devices |
| GET | `/api/devices/:id` | Get device details |
| POST | `/api/devices` | Register device (admin) |
| PUT | `/api/devices/:id` | Update device (admin) |
| DELETE | `/api/devices/:id` | Delete device (admin) |
| POST | `/api/devices/:id/command` | Send MQTT command (admin) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | System statistics |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/role` | Update user role |
| PUT | `/api/admin/users/:id/toggle-active` | Toggle user status |
| DELETE | `/api/admin/users/:id` | Delete user |
| DELETE | `/api/admin/data/cleanup` | Clean old data |

---

## ⚠️ Alert Thresholds

| Gas | Warning | Danger | Unit |
|-----|---------|--------|------|
| CO₂ | 1000 | 2000 | ppm |
| Smoke | 200 | 400 | ppm |
| NH₃ | 25 | 50 | ppm |
| Benzene | 5 | 10 | ppm |
| Alcohol | 200 | 500 | ppm |
| Temperature | 35 | 45 | °C |
| Humidity | 70 | 90 | % |

Configure via backend `.env` file.

---

## 🌐 WAN/Global Internet Access

To access the system over the internet:

1. **Port forwarding** on your router:
   - Port 5000 → Backend server
   - Port 1883 → MQTT broker
   - Port 9001 → MQTT WebSocket
   - Port 3000 → Frontend (or use Nginx on port 80)

2. **Update ESP32 firmware** with your public IP:
   ```cpp
   const char* MQTT_BROKER = "YOUR_PUBLIC_IP";
   ```

3. **Update frontend .env** with your public IP:
   ```
   REACT_APP_API_URL=http://YOUR_PUBLIC_IP:5000/api
   REACT_APP_SOCKET_URL=http://YOUR_PUBLIC_IP:5000
   ```

4. **For production**, use a domain name with SSL/TLS certificates.

---

## 👥 Default Accounts

- **First registered user** automatically becomes **Admin**
- Subsequent users get **User** role by default

---

## 📄 License

This project is created for educational purposes as part of an Advanced Networks university course.

---

*Built with ❤️ using React, Node.js, MQTT, MongoDB & ESP32*
