const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  isBlacklisted: {
    type: Boolean,
    default: false
  },
  blacklistedAt: {
    type: Date
  },
  // Mem0 student learning profile
  mem0Profile: {
    level: { type: String, default: 'Beginner' },
    preferredLanguage: { type: String, default: 'Python 3' },
    weakTopics: [{ type: String }],
    strongTopics: [{ type: String }],
    learningStyle: { type: String, default: 'Step-by-step explanations with examples' },
    pastInteractionsCount: { type: Number, default: 0 },
    recentFeedbackHistory: [{ type: String }]
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
