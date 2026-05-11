const User = require('../models/User');
const SensorReading = require('../models/SensorReading');
const Alert = require('../models/Alert');
const Device = require('../models/Device');

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getSystemStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalReadings,
      totalAlerts,
      totalDevices,
      onlineDevices,
      criticalAlerts,
      todayReadings,
    ] = await Promise.all([
      User.countDocuments(),
      SensorReading.countDocuments(),
      Alert.countDocuments(),
      Device.countDocuments(),
      Device.countDocuments({ onlineStatus: true }),
      Alert.countDocuments({ level: 'critical', acknowledged: false }),
      SensorReading.countDocuments({
        timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalReadings,
        totalAlerts,
        totalDevices,
        onlineDevices,
        criticalAlerts,
        todayReadings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private (Admin)
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear old sensor data
// @route   DELETE /api/admin/data/cleanup
// @access  Private (Admin)
const cleanupOldData = async (req, res, next) => {
  try {
    const { days = 30 } = req.body;
    const cutoff = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const result = await SensorReading.deleteMany({ timestamp: { $lt: cutoff } });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} readings older than ${days} days`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemStats,
  getAllUsers,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  cleanupOldData,
};
