/**
 * MongoDB Database Schemas Documentation
 * IoT Air Pollution Monitor System
 */

// ============================================================
// USERS COLLECTION
// ============================================================
const UserSchema = {
  _id: "ObjectId",
  name: "String (required, 2-50 chars)",
  email: "String (required, unique, lowercase)",
  password: "String (required, hashed with bcrypt, min 6 chars)",
  role: "String (enum: user|admin|viewer, default: user)",
  avatar: "String (URL, nullable)",
  isActive: "Boolean (default: true)",
  lastLogin: "Date (nullable)",
  emailNotifications: "Boolean (default: true)",
  alertThresholds: {
    co2: "Number (default: 1000)",
    smoke: "Number (default: 200)",
    nh3: "Number (default: 25)",
    benzene: "Number (default: 5)",
    alcohol: "Number (default: 200)",
    temperature: "Number (default: 35)",
    humidity: "Number (default: 70)"
  },
  createdAt: "Date (auto)",
  updatedAt: "Date (auto)"
};

// ============================================================
// SENSOR_READINGS COLLECTION
// ============================================================
const SensorReadingSchema = {
  _id: "ObjectId",
  gasType: "String (enum: co2|smoke|nh3|benzene|alcohol|temperature|humidity)",
  value: "Number (required)",
  unit: "String (default: ppm)",
  status: "String (enum: safe|warning|critical, default: safe)",
  deviceId: "String (default: ESP32_001)",
  location: "String (default: Lab Room 1)",
  rawValue: "Number (nullable)",
  timestamp: "Date (default: now, TTL: 90 days)"
};

// Indexes:
// - { gasType: 1, timestamp: -1 }
// - { deviceId: 1, timestamp: -1 }
// - { timestamp: -1 }
// - TTL index: expireAfterSeconds: 7776000 (90 days)

// ============================================================
// ALERTS COLLECTION
// ============================================================
const AlertSchema = {
  _id: "ObjectId",
  level: "String (enum: safe|warning|critical, required)",
  gasType: "String (enum: co2|smoke|nh3|benzene|alcohol|temperature|humidity)",
  value: "Number (required)",
  message: "String (required)",
  deviceId: "String (default: ESP32_001)",
  acknowledged: "Boolean (default: false)",
  acknowledgedBy: "ObjectId (ref: User, nullable)",
  acknowledgedAt: "Date (nullable)",
  emailSent: "Boolean (default: false)",
  timestamp: "Date (default: now)"
};

// ============================================================
// DEVICES COLLECTION
// ============================================================
const DeviceSchema = {
  _id: "ObjectId",
  deviceId: "String (required, unique)",
  deviceName: "String (required)",
  description: "String",
  location: "String (default: Unknown)",
  onlineStatus: "Boolean (default: false)",
  lastSeen: "Date (nullable)",
  firmware: "String (default: 1.0.0)",
  sensors: {
    mq135: "Boolean (default: true)",
    mq2: "Boolean (default: true)",
    dht11: "Boolean (default: true)"
  },
  ipAddress: "String (nullable)",
  macAddress: "String (nullable)",
  wifiSSID: "String (nullable)",
  signalStrength: "Number (nullable)",
  batteryLevel: "Number (nullable)",
  isActive: "Boolean (default: true)",
  createdAt: "Date (auto)",
  updatedAt: "Date (auto)"
};

module.exports = { UserSchema, SensorReadingSchema, AlertSchema, DeviceSchema };
