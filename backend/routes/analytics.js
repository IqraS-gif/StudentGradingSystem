const express = require('express');
const router = express.Router();
const { getStudentAnalytics, getTeacherAnalytics, getAuditLogs } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/student', getStudentAnalytics);
router.get('/teacher', authorize('teacher'), getTeacherAnalytics);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
