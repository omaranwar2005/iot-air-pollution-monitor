const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['safe', 'warning', 'critical'],
      required: true,
      index: true,
    },
    gasType: {
      type: String,
      enum: ['co2', 'smoke', 'nh3', 'benzene', 'alcohol', 'temperature', 'humidity', 'mq135_raw', 'mq2_raw'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      default: 'ESP32_001',
    },
    acknowledged: {
      type: Boolean,
      default: false,
      index: true,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

alertSchema.index({ timestamp: -1 });
alertSchema.index({ level: 1, acknowledged: 1 });

module.exports = mongoose.model('Alert', alertSchema);
