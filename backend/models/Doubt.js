const mongoose = require('mongoose');

const AIDraftSchema = new mongoose.Schema({
  possibleCause: String,
  suggestedFix: String,
  codeFix: String,
  whyWorks: String,
  complexity: {
    naiveName: { type: String, default: 'Naive Approach' },
    naiveTime: { type: String, default: 'O(N^2)' },
    naiveSpace: { type: String, default: 'O(N)' },
    optName: { type: String, default: 'Optimized' },
    optTime: { type: String, default: 'O(N)' },
    optSpace: { type: String, default: 'O(1)' }
  },
  confidenceScore: { type: Number, min: 0, max: 1 },
  promptInjectionRisk: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  resources: [String],
  langchainPromptUsed: String,   // Stores the actual LangChain prompt template sent to LLM
  mem0ContextUsed: mongoose.Schema.Types.Mixed,
  generatedBy: { type: String, default: 'gemini-2.5-flash' }
}, { _id: false });

const TeacherReviewSchema = new mongoose.Schema({
  status: { type: String, enum: ['APPROVED', 'REJECTED'] },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  teacherComment: String,
  pinned: { type: Boolean, default: false }
}, { _id: false });

const DoubtSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 300
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 5000
  },
  language: {
    type: String,
    enum: ['Python', 'Java', 'C++', 'General'],
    default: 'General'
  },
  tags: [{ type: String, trim: true }],
  codeSnippet: { type: String, default: '' },

  // LangGraph Workflow State
  workflowState: {
    type: String,
    enum: ['DRAFT', 'INJECTION_BLOCKED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'DRAFT'
  },

  // 6-Layer Security Pipeline Results
  injectionRiskScore: { type: Number, default: 0 },
  injectionDetectedPatterns: [String],

  aiDraft: AIDraftSchema,
  teacherReview: TeacherReviewSchema,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

DoubtSchema.index({ workflowState: 1, createdAt: -1 });
DoubtSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Doubt', DoubtSchema);
