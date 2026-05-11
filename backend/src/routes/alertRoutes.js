const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAlerts,
  getUnreadCount,
  acknowledgeAlert,
  acknowledgeAllAlerts,
  deleteAlert,
  getAlertStats,
} = require('../controllers/alertController');

router.get('/', protect, getAlerts);
router.get('/unread-count', protect, getUnreadCount);
router.get('/stats', protect, getAlertStats);
router.put('/acknowledge-all', protect, acknowledgeAllAlerts);
router.put('/:id/acknowledge', protect, acknowledgeAlert);
router.delete('/:id', protect, adminOnly, deleteAlert);

module.exports = router;
