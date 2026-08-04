const mongoose = require('mongoose');

// MongoDB-backed Mem0 student long-term memory
// Each entry is a memory fact about the student persisted across sessions
const Mem0MemorySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memoryType: {
    type: String,
    enum: ['WEAK_TOPIC', 'STRONG_TOPIC', 'PREFERENCE', 'MISTAKE_PATTERN', 'INTERACTION'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  // Weight: higher means more recent or more reinforced
  relevanceScore: { type: Number, default: 1.0, min: 0, max: 5.0 },
  source: {
    type: String,
    enum: ['AI_FEEDBACK', 'TEACHER_COMMENT', 'SUBMISSION_ANALYSIS', 'MANUAL'],
    default: 'AI_FEEDBACK'
  },
  createdAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date, default: Date.now }
});

Mem0MemorySchema.index({ student: 1, memoryType: 1, relevanceScore: -1 });

module.exports = mongoose.model('Mem0Memory', Mem0MemorySchema);
