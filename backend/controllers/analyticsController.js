const Submission = require('../models/Submission');
const Doubt = require('../models/Doubt');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// @route   GET /api/analytics/student
// @access  Private/Student
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const submissions = await Submission.find({ student: studentId });
    const totalSubmissions = submissions.length;
    const avgScore = totalSubmissions > 0
      ? (submissions.reduce((acc, s) => acc + (s.score || 0), 0) / totalSubmissions).toFixed(1)
      : 0;

    const myDoubts = await Doubt.find({ student: studentId });

    res.json({
      success: true,
      analytics: {
        totalSubmissions,
        avgScore: parseFloat(avgScore),
        problemsSolved: [...new Set(submissions.map(s => s.problem.toString()))].length,
        totalDoubts: myDoubts.length,
        approvedDoubts: myDoubts.filter(d => d.workflowState === 'APPROVED').length,
        pendingDoubts: myDoubts.filter(d => d.workflowState === 'PENDING_REVIEW').length,
        scoreHistory: submissions.map(s => ({
          date: s.createdAt,
          score: s.score,
          language: s.language
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/analytics/teacher
// @access  Private/Teacher
exports.getTeacherAnalytics = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalSubmissions,
      allDoubts,
      attackLogs,
      recentAudit
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Submission.countDocuments(),
      Doubt.find(),
      AuditLog.countDocuments({ injectionRisk: { $in: ['HIGH', 'CRITICAL_ATTACK'] } }),
      AuditLog.find().sort({ timestamp: -1 }).limit(10)
    ]);

    const pendingCount = allDoubts.filter(d => d.workflowState === 'PENDING_REVIEW').length;
    const approvedCount = allDoubts.filter(d => d.workflowState === 'APPROVED').length;
    const rejectedCount = allDoubts.filter(d => d.workflowState === 'REJECTED').length;
    const approvalRate = allDoubts.length > 0
      ? Math.round((approvedCount / allDoubts.length) * 100)
      : 0;

    const avgConfidence = allDoubts
      .filter(d => d.aiDraft?.confidenceScore)
      .reduce((acc, d, _, arr) => acc + d.aiDraft.confidenceScore / arr.length, 0);

    res.json({
      success: true,
      analytics: {
        totalStudents,
        totalSubmissions,
        totalDoubts: allDoubts.length,
        pendingApprovalCount: pendingCount,
        approvedCount,
        rejectedCount,
        approvalRate,
        attacksBlocked: attackLogs,
        avgAIConfidence: parseFloat((avgConfidence * 100).toFixed(1)),
        recentAuditLogs: recentAudit
      }
    });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/analytics/audit-logs
// @access  Private/Teacher
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.eventType) filter.eventType = req.query.eventType;
    if (req.query.injectionRisk) filter.injectionRisk = req.query.injectionRisk;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email role'),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      logs
    });
  } catch (err) {
    next(err);
  }
};
