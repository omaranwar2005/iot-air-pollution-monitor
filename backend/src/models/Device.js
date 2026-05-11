const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    deviceName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: 'Unknown',
    },
    onlineStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    firmware: {
      type: String,
      default: '1.0.0',
    },
    sensors: {
      mq135: { type: Boolean, default: true },
      mq2: { type: Boolean, default: true },
      dht11: { type: Boolean, default: true },
    },
    ipAddress: {
      type: String,
      default: null,
    },
    macAddress: {
      type: String,
      default: null,
    },
    wifiSSID: {
      type: String,
      default: null,
    },
    signalStrength: {
      type: Number,
      default: null,
    },
    batteryLevel: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-mark device offline if not seen for 2 minutes
deviceSchema.methods.isOnline = function () {
  if (!this.lastSeen) return false;
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  return this.lastSeen > twoMinutesAgo;
};

module.exports = mongoose.model('Device', deviceSchema);
