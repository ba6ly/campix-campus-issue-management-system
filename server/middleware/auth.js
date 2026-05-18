const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes verifing JWT
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
       else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Optional protect middleware to allow public access while attaching user if present
const protectOptional = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};

// Admin access only middleware
const adminOnly = (req, res, next) => {
  const adminRoles = ['admin', 'super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin'];
  if (req.user && adminRoles.includes(req.user.role)) return next();
  res.status(403).json({ success: false, message: 'Admin access required' });
};

module.exports = { protect, protectOptional, adminOnly };
