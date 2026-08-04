const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userRole: String,
  eventType: {
    type: String,
    enum: [
      'DOUBT_SUBMISSION',
      'PROMPT_INJECTION_ATTACK',
      'PROMPT_INJECTION_BLOCKED',
      'AI_DRAFT_GENERATED',
      'TEACHER_APPROVED',
      'TEACHER_REJECTED',
      'TEACHER_EDITED',
      'AI_REGENERATED',
      'CODE_SUBMITTED',
      'SANDBOX_VIOLATION',
      'SANDBOX_TLE'
    ],
    required: true
  },
  inputPreview: { type: String, maxlength: 500 },
  sanitizerStatus: String,
  injectionRiskScore: { type: Number, default: 0 },
  injectionRisk: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL_ATTACK'], default: 'LOW' },
  injectionPatterns: [String],
  mem0Augmented: { type: Boolean, default: false },
  langchainPromptUsed: String,
  llmConfidence: { type: Number, default: 0 },
  outputGuardrailStatus: String,
  workflowState: String,
  relatedDoubtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doubt' },
  relatedSubmissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ eventType: 1 });
AuditLogSchema.index({ injectionRisk: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
