const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema(
  {
    gasType: {
      type: String,
      required: true,
      enum: ['co2', 'smoke', 'nh3', 'benzene', 'alcohol', 'temperature', 'humidity', 'mq135_raw', 'mq2_raw'],
      index: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: 'ppm',
    },
    status: {
      type: String,
      enum: ['safe', 'warning', 'critical'],
      default: 'safe',
      index: true,
    },
    deviceId: {
      type: String,
      default: 'ESP32_001',
      index: true,
    },
    location: {
      type: String,
      default: 'Lab Room 1',
    },
    rawValue: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    // TTL index: auto-delete readings older than 90 days
    expireAfterSeconds: 7776000,
  }
);

// Compound index for efficient queries
sensorReadingSchema.index({ gasType: 1, timestamp: -1 });
sensorReadingSchema.index({ deviceId: 1, timestamp: -1 });
sensorReadingSchema.index({ timestamp: -1 });

// Static method: get latest readings for all gas types
sensorReadingSchema.statics.getLatestReadings = async function () {
  const gasTypes = ['co2', 'smoke', 'nh3', 'benzene', 'alcohol', 'mq135_raw', 'mq2_raw'];
  const results = {};

  for (const gasType of gasTypes) {
    const latest = await this.findOne({ gasType }).sort({ timestamp: -1 });
    results[gasType] = latest;
  }

  return results;
};

// Static method: get hourly averages
sensorReadingSchema.statics.getHourlyAverages = async function (gasType, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return await this.aggregate([
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
          hour: { $hour: '$timestamp' },
        },
        avgValue: { $avg: '$value' },
        maxValue: { $max: '$value' },
        minValue: { $min: '$value' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
  ]);
};

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
