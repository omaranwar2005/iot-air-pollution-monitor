const Device = require('../models/Device');
const SensorReading = require('../models/SensorReading');
const { publishMessage, getTOPICS } = require('../config/mqtt');
const logger = require('../utils/logger');

// @desc    Get all devices
// @route   GET /api/devices
// @access  Private
const getDevices = async (req, res, next) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });

    // Check online status based on lastSeen
    const devicesWithStatus = devices.map((d) => {
      const obj = d.toObject();
      obj.isOnline = d.isOnline();
      return obj;
    });

    res.status(200).json({ success: true, data: devicesWithStatus });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single device
// @route   GET /api/devices/:id
// @access  Private
const getDevice = async (req, res, next) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.id });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // Get latest readings for this device
    const latestReadings = await SensorReading.find({ deviceId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(7)
      .lean();

    res.status(200).json({
      success: true,
      data: { ...device.toObject(), isOnline: device.isOnline(), latestReadings },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register new device
// @route   POST /api/devices
// @access  Private (Admin)
const registerDevice = async (req, res, next) => {
  try {
    const device = await Device.create(req.body);
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private (Admin)
const updateDevice = async (req, res, next) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    res.status(200).json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private (Admin)
const deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findOneAndDelete({ deviceId: req.params.id });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.status(200).json({ success: true, message: 'Device deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Send command to device via MQTT
// @route   POST /api/devices/:id/command
// @access  Private (Admin)
const sendDeviceCommand = async (req, res, next) => {
  try {
    const { command, params } = req.body;
    const TOPICS = getTOPICS();

    const published = publishMessage(`airpollution/devices/${req.params.id}/command`, {
      command,
      params,
      timestamp: new Date().toISOString(),
    });

    if (!published) {
      return res.status(503).json({
        success: false,
        message: 'MQTT broker not connected',
      });
    }

    res.status(200).json({ success: true, message: `Command '${command}' sent to device` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDevices,
  getDevice,
  registerDevice,
  updateDevice,
  deleteDevice,
  sendDeviceCommand,
};
