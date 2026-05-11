const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getSystemStats,
  getAllUsers,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  cleanupOldData,
} = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-active', toggleUserActive);
router.delete('/users/:id', deleteUser);
router.delete('/data/cleanup', cleanupOldData);

module.exports = router;
