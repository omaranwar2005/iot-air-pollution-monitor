const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getLatestReadings,
  getSensorHistory,
  getHourlyAnalytics,
  getDailyAnalytics,
  getAQISummary,
  simulateSensorData,
  exportSensorData,
} = require('../controllers/sensorController');

router.get('/latest', protect, getLatestReadings);
router.get('/history', protect, getSensorHistory);
router.get('/analytics/hourly', protect, getHourlyAnalytics);
router.get('/analytics/daily', protect, getDailyAnalytics);
router.get('/aqi', protect, getAQISummary);
router.get('/export', protect, exportSensorData);
router.post('/simulate', protect, adminOnly, simulateSensorData);

module.exports = router;
