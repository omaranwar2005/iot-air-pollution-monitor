# MQTT Documentation
## IoT Air Pollution Monitor System

---

## Why MQTT Was Chosen

MQTT (Message Queuing Telemetry Transport) was selected as the primary IoT communication protocol for this project because:

| Feature | MQTT | HTTP |
|---------|------|------|
| Protocol overhead | Very low (2-byte header) | High (headers ~200-800 bytes) |
| Connection type | Persistent | Request/Response |
| Real-time | Yes (push) | No (polling required) |
| Battery efficiency | Excellent | Poor |
| IoT suitability | Designed for IoT | General purpose |
| Bandwidth | Minimal | High |
| Scalability | Excellent (pub/sub) | Limited |

---

## Broker Configuration

**Mosquitto MQTT Broker** is used as it is:
- Open source and widely used
- Supports MQTT 3.1.1 and 5.0
- Supports MQTT over WebSockets (for browser clients)
- Lightweight and production-ready

### Ports
- `1883` — Standard MQTT (TCP) — used by ESP32
- `9001` — MQTT over WebSockets — used by browser/frontend

---

## Topic Structure

```
airpollution/
├── sensors/
│   ├── mq135          # CO2, NH3, Benzene, Alcohol readings
│   ├── mq2            # Smoke readings
│   └── dht11          # Temperature & Humidity
├── alerts             # Alert notifications
├── status             # Device status updates
└── devices/
    └── {deviceId}/
        └── command    # Remote commands to device
```

---

## Message Payloads

### MQ-135 Sensor (`airpollution/sensors/mq135`)
```json
{
  "deviceId": "ESP32_001",
  "co2": 850.5,
  "nh3": 12.3,
  "benzene": 2.1,
  "alcohol": 45.0,
  "timestamp": 1703123456789
}
```

### MQ-2 Sensor (`airpollution/sensors/mq2`)
```json
{
  "deviceId": "ESP32_001",
  "smoke": 125.0,
  "timestamp": 1703123456789
}
```

### DHT11 Sensor (`airpollution/sensors/dht11`)
```json
{
  "deviceId": "ESP32_001",
  "temperature": 25.5,
  "humidity": 65.0,
  "timestamp": 1703123456789
}
```

### Device Status (`airpollution/status`)
```json
{
  "deviceId": "ESP32_001",
  "online": true,
  "ipAddress": "192.168.1.100",
  "rssi": -65,
  "freeHeap": 245000,
  "uptime": 3600,
  "firmware": "1.0.0",
  "alertLevel": "safe"
}
```

### Alert (`airpollution/alerts`)
```json
{
  "alerts": [
    {
      "level": "critical",
      "gasType": "co2",
      "value": 2500,
      "message": "CO2 level is critical: 2500 ppm",
      "deviceId": "ESP32_001"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Device Command (`airpollution/devices/ESP32_001/command`)
```json
{
  "command": "restart",
  "params": {},
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## QoS Levels Used

| Topic | QoS | Reason |
|-------|-----|--------|
| Sensor readings | 1 (At least once) | Data must arrive, duplicates acceptable |
| Alerts | 1 (At least once) | Critical to receive |
| Status | 0 (At most once) | Frequent updates, loss acceptable |
| Commands | 1 (At least once) | Commands must be received |

---

## Testing MQTT with CLI

```bash
# Subscribe to all sensor topics
mosquitto_sub -h localhost -p 1883 -u iotuser -P iotpassword -t "airpollution/#" -v

# Publish test MQ-135 data
mosquitto_pub -h localhost -p 1883 -u iotuser -P iotpassword \
  -t "airpollution/sensors/mq135" \
  -m '{"deviceId":"ESP32_001","co2":850,"nh3":12,"benzene":2,"alcohol":45}'

# Publish test DHT11 data
mosquitto_pub -h localhost -p 1883 -u iotuser -P iotpassword \
  -t "airpollution/sensors/dht11" \
  -m '{"deviceId":"ESP32_001","temperature":25.5,"humidity":65}'

# Publish test smoke data
mosquitto_pub -h localhost -p 1883 -u iotuser -P iotpassword \
  -t "airpollution/sensors/mq2" \
  -m '{"deviceId":"ESP32_001","smoke":150}'
```
