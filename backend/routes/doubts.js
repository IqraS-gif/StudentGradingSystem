const express = require('express');
const router = express.Router();
const {
  createDoubt, getDoubts, getDoubt,
  approveDoubt, rejectDoubt, regenerateAIDraft
} = require('../controllers/doubtController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getDoubts)
  .post(authorize('student', 'admin'), createDoubt);

router.route('/:id')
  .get(getDoubt);

router.patch('/:id/approve', authorize('teacher'), approveDoubt);
router.patch('/:id/reject', authorize('teacher'), rejectDoubt);
router.patch('/:id/regenerate', authorize('teacher'), regenerateAIDraft);

module.exports = router;
