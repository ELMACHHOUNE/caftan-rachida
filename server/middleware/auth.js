const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token. User not found.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Your account has been deactivated.'
        });
      }

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error in authentication'
    });
  }
};

// Check if user is admin (role) or in email whitelist
const admin = (req, res, next) => {
  const whitelist = new Set(
    (process.env.ADMIN_WHITELIST || '')
      .split(',')
      .map((e) => e && e.trim().toLowerCase())
      .filter(Boolean)
  );
  // Always include the primary owner email in whitelist
  whitelist.add('business.aguizoul@gmail.com');

  const isAdminRole = !!(req.user && req.user.role === 'admin');
  const isWhitelisted = !!(req.user && req.user.email && whitelist.has(req.user.email.toLowerCase()));

  if (isAdminRole || isWhitelisted) {
    return next();
  }

  return res.status(403).json({
    status: 'error',
    message: 'Access denied. Admin privileges required.'
  });
};

// Generic role guard for extensibility
const requireRole = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) {
    return next();
  }
  return res.status(403).json({
    status: 'error',
    message: `Access denied. ${role} role required.`
  });
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = { auth, admin, optionalAuth, requireRole };