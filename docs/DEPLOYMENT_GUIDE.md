# Deployment Guide
## IoT Air Pollution Monitor System

---

## Local Development Setup

### Step 1: Install Prerequisites

```bash
# macOS
brew install node mongodb-community mosquitto

# Ubuntu/Debian
sudo apt-get install nodejs npm mongodb mosquitto mosquitto-clients
```

### Step 2: Configure Mosquitto

```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd iotuser
# Enter: iotpassword

# Create config file /etc/mosquitto/conf.d/iot.conf
listener 1883
listener 9001
protocol websockets
allow_anonymous false
password_file /etc/mosquitto/passwd

# Restart
sudo systemctl restart mosquitto
```

### Step 3: Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod
```

### Step 4: Start Backend

```bash
cd iot-air-pollution-monitor/backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
# Server starts on http://localhost:5000
```

### Step 5: Start Frontend

```bash
cd iot-air-pollution-monitor/frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## Docker Deployment

```bash
cd iot-air-pollution-monitor/docker

# Create MQTT password file first
docker run --rm eclipse-mosquitto:2.0 \
  mosquitto_passwd -c -b /dev/stdout iotuser iotpassword > mosquitto/passwd

# Start everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Production Deployment (VPS/Cloud)

### 1. Server Requirements
- Ubuntu 22.04 LTS
- 2GB RAM minimum
- 20GB storage
- Open ports: 80, 443, 1883, 9001, 5000

### 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 3. Clone and Configure

```bash
git clone <your-repo>
cd iot-air-pollution-monitor

# Update docker-compose.yml with your domain/IP
# Update JWT_SECRET with a strong random string
# Update MQTT passwords
```

### 4. Deploy

```bash
cd docker
docker-compose up -d --build
```

### 5. Setup Nginx Reverse Proxy (optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:5000;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## ESP32 WAN Configuration

For the ESP32 to connect over the internet:

1. Get your server's public IP address
2. Set up port forwarding on your router:
   - External 1883 → Internal server:1883
   - External 9001 → Internal server:9001

3. Update ESP32 firmware:
```cpp
const char* MQTT_BROKER = "YOUR_PUBLIC_IP_OR_DOMAIN";
```

4. For security, use MQTT over TLS (port 8883) in production.

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/iot_air_pollution |
| JWT_SECRET | JWT signing secret | (required) |
| JWT_EXPIRE | Token expiry | 7d |
| MQTT_BROKER_URL | MQTT broker URL | mqtt://localhost:1883 |
| MQTT_USERNAME | MQTT username | iotuser |
| MQTT_PASSWORD | MQTT password | iotpassword |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |
| CO2_WARNING | CO2 warning threshold (ppm) | 1000 |
| CO2_DANGER | CO2 danger threshold (ppm) | 2000 |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:5000/api |
| REACT_APP_SOCKET_URL | Socket.IO URL | http://localhost:5000 |
| REACT_APP_MQTT_URL | MQTT WebSocket URL | ws://localhost:9001 |
