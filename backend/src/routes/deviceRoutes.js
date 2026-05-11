const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getDevices,
  getDevice,
  registerDevice,
  updateDevice,
  deleteDevice,
  sendDeviceCommand,
} = require('../controllers/deviceController');

router.get('/', protect, getDevices);
router.get('/:id', protect, getDevice);
router.post('/', protect, adminOnly, registerDevice);
router.put('/:id', protect, adminOnly, updateDevice);
router.delete('/:id', protect, adminOnly, deleteDevice);
router.post('/:id/command', protect, adminOnly, sendDeviceCommand);

module.exports = router;
