const mongoose = require('mongoose');

const TestResultSchema = new mongoose.Schema({
  caseId: Number,
  input: String,
  expectedOutput: String,
  actualOutput: String,
  status: { type: String, enum: ['PASSED', 'FAILED', 'ERROR'] },
  durationMs: Number,
  isHidden: Boolean
}, { _id: false });

const AIReviewSchema = new mongoose.Schema({
  overallScore: { type: Number, default: null },
  complexity: {
    time: String,
    space: String
  },
  difficultyEstimate: String,
  strengths: [String],
  weaknesses: [String],
  suggestions: [String],
  generatedBy: { type: String, default: 'gemini-2.5-flash' }
}, { _id: false });

const SubmissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mode: {
    type: String,
    enum: ['assessment', 'practice'],
    default: 'assessment'
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: false
  },
  language: {
    type: String,
    enum: ['python', 'java', 'cpp'],
    required: true
  },
  sourceCode: {
    type: String,
    required: true
  },
  sandboxStatus: {
    type: String,
    enum: ['ALL_PASSED', 'PARTIAL_PASSED', 'SECURITY_VIOLATION', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILE_ERROR', 'PRACTICE_REVIEWED'],
    required: true
  },
  executionTime: String,
  memoryUsed: String,
  passRate: String,
  score: { type: Number, default: null },
  testCaseResults: [TestResultSchema],
  aiReview: AIReviewSchema,
  createdAt: { type: Date, default: Date.now }
});

// Index for fast student history queries
SubmissionSchema.index({ student: 1, mode: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', SubmissionSchema);
