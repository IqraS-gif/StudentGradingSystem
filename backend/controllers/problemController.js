const Problem = require('../models/Problem');

// @route   GET /api/problems
// @access  Private
exports.getProblems = async (req, res, next) => {
  try {
    const problems = await Problem.find().select('-testCases').sort({ createdAt: 1 });
    res.json({ success: true, count: problems.length, problems });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/problems/:id
// @access  Private
exports.getProblem = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });
    
    // For students, hide expected outputs of hidden test cases
    if (req.user.role === 'student') {
      const sanitized = problem.toObject();
      sanitized.testCases = sanitized.testCases.map(tc => ({
        ...tc,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput
      }));
      return res.json({ success: true, problem: sanitized });
    }

    res.json({ success: true, problem });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/problems
// @access  Private/Teacher
exports.createProblem = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const problem = await Problem.create(req.body);
    res.status(201).json({ success: true, problem });
  } catch (err) {
    next(err);
  }
};

// @route   PUT /api/problems/:id
// @access  Private/Teacher
exports.updateProblem = async (req, res, next) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });
    res.json({ success: true, problem });
  } catch (err) {
    next(err);
  }
};

// @route   DELETE /api/problems/:id
// @access  Private/Teacher
exports.deleteProblem = async (req, res, next) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });
    res.json({ success: true, message: 'Problem deleted.' });
  } catch (err) {
    next(err);
  }
};
