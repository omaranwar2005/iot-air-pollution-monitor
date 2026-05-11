const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res, next) => {
  try {
    const { level, acknowledged, limit = 50, page = 1 } = req.query;

    const query = {};
    if (level) query.level = level;
    if (acknowledged !== undefined) query.acknowledged = acknowledged === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('acknowledgedBy', 'name email')
        .lean(),
      Alert.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: alerts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unacknowledged alert count
// @route   GET /api/alerts/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Alert.countDocuments({ acknowledged: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    next(error);
  }
};

// @desc    Acknowledge alert
// @route   PUT /api/alerts/:id/acknowledge
// @access  Private
const acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        acknowledged: true,
        acknowledgedBy: req.user.id,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

// @desc    Acknowledge all alerts
// @route   PUT /api/alerts/acknowledge-all
// @access  Private
const acknowledgeAllAlerts = async (req, res, next) => {
  try {
    await Alert.updateMany(
      { acknowledged: false },
      {
        acknowledged: true,
        acknowledgedBy: req.user.id,
        acknowledgedAt: new Date(),
      }
    );

    res.status(200).json({ success: true, message: 'All alerts acknowledged' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete alert
// @route   DELETE /api/alerts/:id
// @access  Private (Admin)
const deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.status(200).json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get alert statistics
// @route   GET /api/alerts/stats
// @access  Private
const getAlertStats = async (req, res, next) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
          unacknowledged: {
            $sum: { $cond: [{ $eq: ['$acknowledged', false] }, 1, 0] },
          },
        },
      },
    ]);

    const total = await Alert.countDocuments();
    const unacknowledged = await Alert.countDocuments({ acknowledged: false });

    res.status(200).json({
      success: true,
      total,
      unacknowledged,
      byLevel: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  getUnreadCount,
  acknowledgeAlert,
  acknowledgeAllAlerts,
  deleteAlert,
  getAlertStats,
};
