const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect - Requires valid JWT token in Authorization: Bearer header
 */
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User account no longer exists.' });
    }
    if (req.user.isBlacklisted) {
      return res.status(403).json({
        success: false,
        accountBlocked: true,
        message: '⛔ Account permanently blacklisted due to prompt injection security violations.'
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * authorize - Role-based access control (RBAC)
 * Usage: authorize('teacher'), authorize('student', 'teacher')
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};
