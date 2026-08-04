const express = require('express');
const router = express.Router();
const { submitCode, getSubmissions, getSubmission, updateSubmissionGrade } = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getSubmissions)
  .post(authorize('student'), submitCode);

router.route('/:id')
  .get(getSubmission);

router.route('/:id/grade')
  .patch(authorize('teacher'), updateSubmissionGrade);

module.exports = router;
