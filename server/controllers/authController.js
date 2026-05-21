const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PreApprovedStudent = require('../models/PreApprovedStudent');
const { sendOTP } = require('../utils/emailService');
const SecretKeyAttempt = require('../models/SecretKeyAttempt');
const AdminAuditLog = require('../models/AdminAuditLog');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// (signup)POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, rollNumber, department, adminSecretKey } = req.body;

    const isAdminRole = ['admin', 'super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin', 'library_admin', 'placement_admin'].includes(role);

    // Rate limiting for admin secret key attempts
    if (isAdminRole) {
      const emailLower = email.toLowerCase().trim();
      const ip = req.ip || req.connection.remoteAddress;

      const lockCheck = await SecretKeyAttempt.findOne({
        $or: [{ email: emailLower }, { ip }]
      });

      if (lockCheck && lockCheck.isLocked()) {
        const remainingMinutes = Math.ceil((lockCheck.lockUntil - Date.now()) / 60000);
        return res.status(403).json({
          success: false,
          message: `Too many failed secret key attempts. Admin registration is temporarily locked for ${remainingMinutes} more minutes.`
        });
      }
    }

    // Check if email already registered
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      if (userExists.role !== 'student') {
        if (userExists.approvalStatus === 'pending') {
          return res.status(400).json({ success: false, message: 'Your registration request is pending approval.' });
        }
        if (userExists.approvalStatus === 'rejected') {
          return res.status(400).json({ success: false, message: 'Your admin access request was rejected.' });
        }
      }
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

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

    // Admin Secret Key Validation
    if (isAdminRole) {
      const isKeyMatch = adminSecretKey === process.env.ADMIN_SECRET_KEY;
      const emailLower = email.toLowerCase().trim();
      const ip = req.ip || req.connection.remoteAddress;

      if (!isKeyMatch) {
        // Log suspicious attempt
        await AdminAuditLog.create({
          actionType: 'suspicious_attempt',
          email: emailLower,
          name,
          role,
          ip,
          device: req.headers['user-agent'],
          details: `Failed registration attempt for role: ${role} - Invalid Secret Key: "${adminSecretKey}"`
        });

        // Increment attempts
        let attemptRecord = await SecretKeyAttempt.findOne({ email: emailLower });
        if (!attemptRecord) {
          attemptRecord = new SecretKeyAttempt({ email: emailLower, ip });
        }
        attemptRecord.attempts = (attemptRecord.attempts || 0) + 1;
        attemptRecord.ip = ip; // Update IP

        if (attemptRecord.attempts >= 3) {
          attemptRecord.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
        }
        await attemptRecord.save();

        const remaining = 3 - attemptRecord.attempts;
        const lockMsg = attemptRecord.attempts >= 3
          ? 'Too many failed attempts. Registration locked for 15 minutes.'
          : `Invalid admin secret key. You have ${remaining} attempts remaining before temporary lockout.`;

        return res.status(401).json({ success: false, message: lockMsg });
      }

      // Reset attempts on successful key entry
      await SecretKeyAttempt.deleteOne({ email: emailLower });
    }

    // Generate OTP for students
    let otpCode, otpExpires;
    if (!isAdminRole) {
      otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    }

    const isSuperAdmin = role === 'super_admin';
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: role || 'student', 
      rollNumber, 
      department,
      isVerified: isAdminRole ? true : false, // Admins are auto-verified
      otpCode,
      otpExpires,
      isApproved: (!isAdminRole || isSuperAdmin) ? true : false,
      approvalStatus: (!isAdminRole || isSuperAdmin) ? 'approved' : 'pending',
      secretKeyMatched: isAdminRole ? true : false,
      requestDate: isAdminRole ? new Date() : undefined,
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

    // Log the registration request
    const ip = req.ip || req.connection.remoteAddress;
    await AdminAuditLog.create({
      actionType: isSuperAdmin ? 'approval' : 'registration_request',
      email: user.email,
      name: user.name,
      role: user.role,
      ip,
      device: req.headers['user-agent'],
      details: isSuperAdmin 
        ? 'Main Admin registered and auto-approved.' 
        : 'Sub-admin registration request submitted, pending approval.'
    });

    // Notify Main Admin via Socket.io in real-time
    if (!isSuperAdmin) {
      const io = req.app.get('io');
      if (io) {
        io.to('super_admin').emit('admin_request', {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          requestDate: user.requestDate,
          ip,
          device: req.headers['user-agent']
        });
      }
    }

    if (!isSuperAdmin) {
      return res.status(201).json({
        success: true,
        pendingApproval: true,
        message: 'Registration request submitted! Please wait for the Main Admin to approve your account.'
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

    // Role Approval Validation
    if (user.role !== 'student') {
      if (user.approvalStatus === 'pending') {
        return res.status(403).json({ success: false, message: 'Your admin registration request is pending approval.' });
      }
      if (user.approvalStatus === 'rejected') {
        return res.status(403).json({ success: false, message: 'Your admin access request was rejected.' });
      }
      if (user.isActive === false) {
        return res.status(403).json({ success: false, message: 'Your admin account has been deactivated.' });
      }
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
