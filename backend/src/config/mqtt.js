const mqtt = require('mqtt');
const logger = require('../utils/logger');

let client = null;
let io = null;

// MQTT Topics
const TOPICS = {
  MQ135: 'airpollution/sensors/mq135',
  MQ2: 'airpollution/sensors/mq2',
  DHT11: 'airpollution/sensors/dht11',
  ALERTS: 'airpollution/alerts',
  STATUS: 'airpollution/status',
  ALL_SENSORS: 'airpollution/sensors/#',
};

// Alert thresholds from environment
const THRESHOLDS = {
  co2: {
    warning: parseInt(process.env.CO2_WARNING) || 1000,
    danger: parseInt(process.env.CO2_DANGER) || 2000,
  },
  smoke: {
    warning: parseInt(process.env.SMOKE_WARNING) || 200,
    danger: parseInt(process.env.SMOKE_DANGER) || 400,
  },
  nh3: {
    warning: parseInt(process.env.NH3_WARNING) || 25,
    danger: parseInt(process.env.NH3_DANGER) || 50,
  },
  benzene: {
    warning: parseInt(process.env.BENZENE_WARNING) || 5,
    danger: parseInt(process.env.BENZENE_DANGER) || 10,
  },
  alcohol: {
    warning: parseInt(process.env.ALCOHOL_WARNING) || 200,
    danger: parseInt(process.env.ALCOHOL_DANGER) || 500,
  },
  temperature: {
    warning: parseInt(process.env.TEMP_WARNING) || 35,
    danger: parseInt(process.env.TEMP_DANGER) || 45,
  },
  humidity: {
    warning: parseInt(process.env.HUMIDITY_WARNING) || 70,
    danger: parseInt(process.env.HUMIDITY_DANGER) || 90,
  },
};

const getAlertLevel = (gasType, value) => {
  const threshold = THRESHOLDS[gasType];
  if (!threshold) return 'safe';
  if (value >= threshold.danger) return 'critical';
  if (value >= threshold.warning) return 'warning';
  return 'safe';
};

const initMQTT = (socketIO) => {
  io = socketIO;

  const options = {
    clientId: process.env.MQTT_CLIENT_ID || `backend_${Date.now()}`,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    keepalive: 60,
    clean: true,
    rejectUnauthorized: false, // required for HiveMQ Cloud free tier
  };

  // Only add credentials if they are set
  if (process.env.MQTT_USERNAME && process.env.MQTT_USERNAME.trim() !== '') {
    options.username = process.env.MQTT_USERNAME;
    options.password = process.env.MQTT_PASSWORD;
  }

  logger.info(`Connecting to MQTT broker: ${process.env.MQTT_BROKER_URL}`);
  client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

  client.on('connect', () => {
    logger.info('MQTT Broker connected successfully');

    // Subscribe to all sensor topics
    client.subscribe(TOPICS.ALL_SENSORS, { qos: 1 }, (err) => {
      if (err) {
        logger.error(`MQTT subscription error: ${err.message}`);
      } else {
        logger.info('Subscribed to all sensor topics');
      }
    });

    client.subscribe(TOPICS.STATUS, { qos: 1 }, (err) => {
      if (!err) logger.info('Subscribed to status topic');
    });

    // Notify frontend of MQTT connection
    if (io) {
      io.emit('mqtt_status', { connected: true, timestamp: new Date() });
    }
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      logger.debug(`MQTT message received on ${topic}: ${message.toString()}`);

      await handleMQTTMessage(topic, payload);
    } catch (error) {
      logger.error(`Error processing MQTT message: ${error.message}`);
    }
  });

  client.on('error', (error) => {
    logger.error(`MQTT error: ${error.message}`);
    if (io) {
      io.emit('mqtt_status', { connected: false, error: error.message });
    }
  });

  client.on('reconnect', () => {
    logger.info('MQTT reconnecting...');
    if (io) {
      io.emit('mqtt_status', { connected: false, reconnecting: true });
    }
  });

  client.on('offline', () => {
    logger.warn('MQTT client offline');
    if (io) {
      io.emit('mqtt_status', { connected: false, offline: true });
    }
  });

  client.on('close', () => {
    logger.warn('MQTT connection closed');
  });

  return client;
};

const handleMQTTMessage = async (topic, payload) => {
  const SensorReading = require('../models/SensorReading');
  const Alert = require('../models/Alert');
  const Device = require('../models/Device');

  // Update device last seen
  if (payload.deviceId) {
    await Device.findOneAndUpdate(
      { deviceId: payload.deviceId },
      { lastSeen: new Date(), onlineStatus: true },
      { upsert: true, new: true }
    );
  }

  // Process sensor data based on topic
  if (topic.startsWith('airpollution/sensors/')) {
    const readings = [];
    const alerts = [];

    // MQ-135: CO2, NH3, Benzene, Alcohol
    if (topic === TOPICS.MQ135) {
      const gasTypes = ['co2', 'nh3', 'benzene', 'alcohol'];
      for (const gasType of gasTypes) {
        if (payload[gasType] !== undefined) {
          const level = getAlertLevel(gasType, payload[gasType]);
          readings.push({
            gasType,
            value: payload[gasType],
            unit: 'ppm',
            status: level,
            deviceId: payload.deviceId || 'ESP32_001',
            rawValue: payload.raw || null,
            timestamp: new Date(),
          });
        }
      }

      // Save raw MQ135 reading
      if (payload.raw !== undefined) {
        const rawLevel = payload.raw >= 2800 ? 'critical' : payload.raw >= 1800 ? 'warning' : 'safe';
        readings.push({
          gasType: 'mq135_raw',
          value: payload.raw,
          unit: 'raw',
          status: rawLevel,
          deviceId: payload.deviceId || 'ESP32_001',
          rawValue: payload.raw,
          timestamp: new Date(),
        });

        // Alert based on raw value with sensor name
        if (rawLevel === 'warning' || rawLevel === 'critical') {
          alerts.push({
            level: rawLevel,
            gasType: 'mq135_raw',
            value: payload.raw,
            message: `MQ-135 sensor is ${rawLevel}: raw value ${payload.raw}`,
            deviceId: payload.deviceId || 'ESP32_001',
          });
        }
      }
    }

    // MQ-2: Smoke
    if (topic === TOPICS.MQ2) {
      if (payload.smoke !== undefined) {
        const level = getAlertLevel('smoke', payload.smoke);
        readings.push({
          gasType: 'smoke',
          value: payload.smoke,
          unit: 'ppm',
          status: level,
          deviceId: payload.deviceId || 'ESP32_001',
          rawValue: payload.raw || null,
          timestamp: new Date(),
        });
      }

      // Save raw MQ2 reading
      if (payload.raw !== undefined) {
        const rawLevel = payload.raw >= 2500 ? 'critical' : payload.raw >= 1500 ? 'warning' : 'safe';
        readings.push({
          gasType: 'mq2_raw',
          value: payload.raw,
          unit: 'raw',
          status: rawLevel,
          deviceId: payload.deviceId || 'ESP32_001',
          rawValue: payload.raw,
          timestamp: new Date(),
        });

        // Alert based on raw value with sensor name
        if (rawLevel === 'warning' || rawLevel === 'critical') {
          alerts.push({
            level: rawLevel,
            gasType: 'mq2_raw',
            value: payload.raw,
            message: `MQ-2 sensor is ${rawLevel}: raw value ${payload.raw}`,
            deviceId: payload.deviceId || 'ESP32_001',
          });
        }
      }
    }

    // DHT11: Temperature & Humidity
    if (topic === TOPICS.DHT11) {
      if (payload.temperature !== undefined) {
        const level = getAlertLevel('temperature', payload.temperature);
        readings.push({
          gasType: 'temperature',
          value: payload.temperature,
          unit: '°C',
          status: level,
          deviceId: payload.deviceId || 'ESP32_001',
          timestamp: new Date(),
        });
      }
      if (payload.humidity !== undefined) {
        const level = getAlertLevel('humidity', payload.humidity);
        readings.push({
          gasType: 'humidity',
          value: payload.humidity,
          unit: '%',
          status: level,
          deviceId: payload.deviceId || 'ESP32_001',
          timestamp: new Date(),
        });
      }
    }

    // Save readings to DB
    if (readings.length > 0) {
      await SensorReading.insertMany(readings);

      // Emit to frontend via WebSocket
      if (io) {
        io.emit('sensor_data', {
          topic,
          readings,
          timestamp: new Date(),
        });
      }
    }

    // Save and emit alerts
    if (alerts.length > 0) {
      const savedAlerts = await Alert.insertMany(alerts);
      if (io) {
        io.emit('new_alert', { alerts: savedAlerts });
      }

      // Publish alert back to MQTT
      if (client && client.connected) {
        client.publish(
          TOPICS.ALERTS,
          JSON.stringify({ alerts, timestamp: new Date() }),
          { qos: 1 }
        );
      }
    }
  }

  // Device status updates
  if (topic === TOPICS.STATUS) {
    if (io) {
      io.emit('device_status', payload);
    }
  }
};

const publishMessage = (topic, message) => {
  if (client && client.connected) {
    client.publish(topic, JSON.stringify(message), { qos: 1 });
    return true;
  }
  logger.warn('MQTT client not connected, cannot publish');
  return false;
};

const getMQTTClient = () => client;
const getTOPICS = () => TOPICS;
const getTHRESHOLDS = () => THRESHOLDS;

module.exports = { initMQTT, publishMessage, getMQTTClient, getTOPICS, getTHRESHOLDS };
