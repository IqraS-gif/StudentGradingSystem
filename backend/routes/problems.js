const express = require('express');
const router = express.Router();
const { getProblems, getProblem, createProblem, updateProblem, deleteProblem } = require('../controllers/problemController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getProblems)
  .post(authorize('teacher'), createProblem);

router.route('/:id')
  .get(getProblem)
  .put(authorize('teacher'), updateProblem)
  .delete(authorize('teacher'), deleteProblem);

module.exports = router;
