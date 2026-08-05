const express = require('express');
const router = express.Router();
const {
  getStudentAnalytics,
  getTeacherAnalytics,
  getAuditLogs,
  getSettings,
  updateSettings,
  getBlacklistedUsers,
  unblacklistUser
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/student', getStudentAnalytics);
router.get('/teacher', authorize('teacher'), getTeacherAnalytics);
router.get('/audit-logs', getAuditLogs);

// System Settings & Blacklist Management
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/blacklisted-users', getBlacklistedUsers);
router.patch('/unblacklist-user/:id', unblacklistUser);

module.exports = router;
