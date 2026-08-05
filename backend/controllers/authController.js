const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mem0Profile: user.mem0Profile
    }
  });
};

// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'teacher' ? 'teacher' : 'student'
    });

    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.isBlacklisted) {
      return res.status(403).json({
        success: false,
        accountBlocked: true,
        message: '⛔ Account permanently blacklisted due to prompt injection security violations.'
      });
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user });
};

// @route   PATCH /api/auth/me/mem0
// @access  Private (student)
exports.updateMem0Profile = async (req, res, next) => {
  try {
    const { weakTopics, strongTopics, level, preferredLanguage, learningStyle } = req.body;
    const updateFields = {};
    if (weakTopics !== undefined) updateFields['mem0Profile.weakTopics'] = weakTopics;
    if (strongTopics !== undefined) updateFields['mem0Profile.strongTopics'] = strongTopics;
    if (level) updateFields['mem0Profile.level'] = level;
    if (preferredLanguage) updateFields['mem0Profile.preferredLanguage'] = preferredLanguage;
    if (learningStyle) updateFields['mem0Profile.learningStyle'] = learningStyle;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true, runValidators: true });
    res.json({ success: true, mem0Profile: user.mem0Profile });
  } catch (err) {
    next(err);
  }
};
