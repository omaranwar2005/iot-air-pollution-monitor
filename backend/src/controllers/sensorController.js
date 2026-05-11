const SensorReading = require('../models/SensorReading');
const { publishMessage, getTOPICS } = require('../config/mqtt');
const logger = require('../utils/logger');

// @desc    Get latest sensor readings
// @route   GET /api/sensors/latest
// @access  Private
const getLatestReadings = async (req, res, next) => {
  try {
    const readings = await SensorReading.getLatestReadings();
    res.status(200).json({ success: true, data: readings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sensor history
// @route   GET /api/sensors/history
// @access  Private
const getSensorHistory = async (req, res, next) => {
  try {
    const { gasType, hours = 24, limit = 100 } = req.query;

    const query = {};
    if (gasType) query.gasType = gasType;

    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
    query.timestamp = { $gte: since };

    const readings = await SensorReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get hourly analytics
// @route   GET /api/sensors/analytics/hourly
// @access  Private
const getHourlyAnalytics = async (req, res, next) => {
  try {
    const { gasType = 'co2', hours = 24 } = req.query;

    const data = await SensorReading.getHourlyAverages(gasType, parseInt(hours));

    res.status(200).json({
      success: true,
      gasType,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily analytics
// @route   GET /api/sensors/analytics/daily
// @access  Private
const getDailyAnalytics = async (req, res, next) => {
  try {
    const { gasType = 'co2', days = 7 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const data = await SensorReading.aggregate([
      {
        $match: {
          gasType,
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
          },
          avgValue: { $avg: '$value' },
          maxValue: { $max: '$value' },
          minValue: { $min: '$value' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.status(200).json({ success: true, gasType, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AQI summary
// @route   GET /api/sensors/aqi
// @access  Private
const getAQISummary = async (req, res, next) => {
  try {
    const latest = await SensorReading.getLatestReadings();

    // Simple AQI calculation based on CO2 and smoke
    const co2Value = latest.co2?.value || 0;
    const smokeValue = latest.smoke?.value || 0;

    let aqi = 0;
    let aqiLevel = 'Good';
    let aqiColor = 'green';

    // Weighted AQI formula
    aqi = Math.round((co2Value / 5000) * 100 + (smokeValue / 500) * 100) / 2;
    aqi = Math.min(aqi, 500);

    if (aqi <= 50) { aqiLevel = 'Good'; aqiColor = '#00e400'; }
    else if (aqi <= 100) { aqiLevel = 'Moderate'; aqiColor = '#ffff00'; }
    else if (aqi <= 150) { aqiLevel = 'Unhealthy for Sensitive Groups'; aqiColor = '#ff7e00'; }
    else if (aqi <= 200) { aqiLevel = 'Unhealthy'; aqiColor = '#ff0000'; }
    else if (aqi <= 300) { aqiLevel = 'Very Unhealthy'; aqiColor = '#8f3f97'; }
    else { aqiLevel = 'Hazardous'; aqiColor = '#7e0023'; }

    res.status(200).json({
      success: true,
      aqi: Math.round(aqi),
      level: aqiLevel,
      color: aqiColor,
      readings: latest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate sensor data (for testing without hardware)
// @route   POST /api/sensors/simulate
// @access  Private (Admin)
const simulateSensorData = async (req, res, next) => {
  try {
    const TOPICS = getTOPICS();

    const mq135Data = {
      deviceId: 'ESP32_001',
      co2: Math.floor(Math.random() * 2000) + 400,
      nh3: Math.floor(Math.random() * 60),
      benzene: Math.floor(Math.random() * 15),
      alcohol: Math.floor(Math.random() * 600),
      timestamp: new Date().toISOString(),
    };

    const mq2Data = {
      deviceId: 'ESP32_001',
      smoke: Math.floor(Math.random() * 500),
      timestamp: new Date().toISOString(),
    };

    const dht11Data = {
      deviceId: 'ESP32_001',
      temperature: Math.floor(Math.random() * 20) + 20,
      humidity: Math.floor(Math.random() * 40) + 40,
      timestamp: new Date().toISOString(),
    };

    publishMessage(TOPICS.MQ135, mq135Data);
    publishMessage(TOPICS.MQ2, mq2Data);
    publishMessage(TOPICS.DHT11, dht11Data);

    logger.info('Simulated sensor data published to MQTT');

    res.status(200).json({
      success: true,
      message: 'Simulated data published',
      data: { mq135: mq135Data, mq2: mq2Data, dht11: dht11Data },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export sensor data as CSV
// @route   GET /api/sensors/export
// @access  Private
const exportSensorData = async (req, res, next) => {
  try {
    const { gasType, hours = 24 } = req.query;
    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    const query = { timestamp: { $gte: since } };
    if (gasType) query.gasType = gasType;

    const readings = await SensorReading.find(query).sort({ timestamp: -1 }).lean();

    // Build CSV
    const headers = 'Timestamp,Gas Type,Value,Unit,Status,Device ID\n';
    const rows = readings
      .map(
        (r) =>
          `${new Date(r.timestamp).toISOString()},${r.gasType},${r.value},${r.unit},${r.status},${r.deviceId}`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=sensor_data_${Date.now()}.csv`
    );
    res.send(headers + rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLatestReadings,
  getSensorHistory,
  getHourlyAnalytics,
  getDailyAnalytics,
  getAQISummary,
  simulateSensorData,
  exportSensorData,
};
