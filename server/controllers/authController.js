const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PreApprovedStudent = require('../models/PreApprovedStudent');
const { sendOTP } = require('../utils/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// (signup)POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, rollNumber, department, adminSecretKey } = req.body;

    // Student Validation System
    if (!role || role === 'student') {
      const isApproved = await PreApprovedStudent.findOne({ 
        email: email.toLowerCase().trim(),
        rollNumber: rollNumber
      });

      if (!isApproved) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access Denied: Your email and roll number combination is not on the pre-approved student list.' 
        });
      }
    }

    const isAdminRole = ['admin', 'super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin'].includes(role);
    if (isAdminRole && adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ success: false, message: 'Invalid admin secret key' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate OTP for students
    let otpCode, otpExpires;
    if (!isAdminRole) {
      otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    }

    const user = await User.create({ 
      name, email, password, role: role || 'student', rollNumber, department,
      isVerified: isAdminRole ? true : false, // Admins are auto-verified
      otpCode,
      otpExpires
    });

    if (!isAdminRole) {
      await sendOTP(email, otpCode);
      return res.status(201).json({ 
        success: true, 
        message: 'Registration successful! Please check your email for the verification code.',
        needsVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user._id);
    res.status(201).json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber, department: user.department } 
    });
  } catch (error) { next(error); }
};

// POST /api/auth/verify-otp
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      otpCode: otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({ 
      success: true, 
      message: 'Account verified successfully!', 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber, department: user.department } 
    });
  } catch (error) { next(error); }
};

// (login)POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if user is already locked out due to failed attempts
    if (user.failedLoginAttempts > 2) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otpCode;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
      await sendOTP(user.email, otpCode);

      return res.status(401).json({ 
        success: false, 
        needsOTP: true,
        email: user.email,
        message: 'Account locked due to multiple incorrect password attempts. A login verification OTP has been sent to your email.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      await user.save();

      if (user.failedLoginAttempts > 2) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otpCode;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();
        await sendOTP(user.email, otpCode);

        return res.status(401).json({ 
          success: false, 
          needsOTP: true,
          email: user.email,
          message: 'Too many failed password attempts. A login verification OTP has been sent to your email.'
        });
      }

      const attemptsRemaining = 3 - user.failedLoginAttempts;
      return res.status(401).json({ 
        success: false, 
        message: `Incorrect password. You have ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining before email OTP is required.`
      });
    }

    if (!user.isVerified) {
      // Resend OTP if not verified
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otpCode;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
      await sendOTP(user.email, otpCode);

      return res.status(403).json({ 
        success: false, 
        message: 'Account not verified. A new code has been sent to your email.',
        needsVerification: true,
        email: user.email
      });
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    await user.save();

    const token = generateToken(user._id);
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber, department: user.department } 
    });
  } catch (error) { next(error); }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, verifyOTP, login, getMe };
