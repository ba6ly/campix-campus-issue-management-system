const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const StatusHistory = require('../models/StatusHistory');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const { broadcastDashboardUpdate } = require('../sockets/index');

// Role to category mapping
const roleCategoryMap = {
  hostel_admin: 'hostel_wifi',
  academic_admin: 'academic',
  sports_admin: 'sports',
  library_admin: 'library',
  placement_admin: 'placement',
  hod_admin: 'department',
};

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const query = { isDeleted: { $ne: true } };
    
    // Scoped category filtering for sub-admins
    if (req.user.role !== 'super_admin' && roleCategoryMap[req.user.role]) {
      query.category = roleCategoryMap[req.user.role];
    }

    const statusStats = await Complaint.aggregate([{ $match: query }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const categoryStats = await Complaint.aggregate([{ $match: query }, { $group: { _id: '$category', count: { $sum: 1 } } }]);
    const priorityStats = await Complaint.aggregate([{ $match: query }, { $group: { _id: '$priority', count: { $sum: 1 } } }]);

    const monthlyStats = await Complaint.aggregate([
      { $match: query },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const total = await Complaint.countDocuments(query);
    const totalStudents = await User.countDocuments({ role: 'student' });
    const statusMap = { pending: 0, assigned: 0, 'in-progress': 0, resolved: 0, rejected: 0, fake: 0 };
    statusStats.forEach((s) => (statusMap[s._id] = s.count));

    res.json({ success: true, stats: { ...statusMap, total, totalStudents, categoryStats, priorityStats, monthlyStats } });
  } catch (error) { next(error); }
};

// GET /api/admin/activity
const getActivity = async (req, res, next) => {
  try {
    const query = { isDeleted: { $ne: true } };
    
    // Scoped category filtering for sub-admins
    if (req.user.role !== 'super_admin' && roleCategoryMap[req.user.role]) {
      query.category = roleCategoryMap[req.user.role];
    }

    const activity = await Complaint.find(query).populate('studentId', 'name rollNumber department').sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, activity });
  } catch (error) { next(error); }
};

// GET /api/admin/complaints
const getAllComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const query = { isDeleted: { $ne: true } };

    // Scoped category filtering for sub-admins (overrides requested category filter if necessary)
    if (req.user.role !== 'super_admin' && roleCategoryMap[req.user.role]) {
      query.category = roleCategoryMap[req.user.role];
    } else if (category && category !== 'all') {
      query.category = category;
    }

    // Moderation-specific filters
    if (status && status !== 'all') {
      if (status === 'pending_review') {
        query.moderationStatus = 'pending';
      } else if (status === 'verified') {
        query.moderationStatus = 'verified';
      } else if (status === 'fake') {
        query.moderationStatus = 'fake';
      } else if (status === 'high_support') {
        // Handled via sorting
      } else {
        query.status = status;
      }
    }

    if (priority && priority !== 'all') query.priority = priority;
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];

    let finalSort = sort;
    if (status === 'high_support') {
      finalSort = '-supportCount';
    }

    const complaints = await Complaint.find(query)
      .populate('studentId', 'name email rollNumber department fakeComplaintCount warningStatus accountRestricted')
      .populate('assignedTo', 'name role')
      .sort(finalSort).skip((page - 1) * limit).limit(Number(limit));
    const total = await Complaint.countDocuments(query);
    res.json({ success: true, complaints, total, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

// PATCH /api/admin/complaints/:id/status
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Restriction: sub-admins can only update complaints within their department
    if (req.user.role !== 'super_admin') {
      const allowedCategory = roleCategoryMap[req.user.role];
      if (allowedCategory && complaint.category !== allowedCategory) {
        return res.status(403).json({ success: false, message: 'Access Denied: You cannot modify complaints outside your department.' });
      }
      
      // Also restrict: specialized admins can only update complaints assigned to them (unless they are super_admin or department heads)
      if (req.user.role !== 'hod_admin' && (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString())) {
        return res.status(403).json({ success: false, message: 'You can only update complaints assigned to you' });
      }
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    if (adminRemarks !== undefined) complaint.adminRemarks = adminRemarks;

    if (status === 'resolved' && oldStatus !== 'resolved') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    await StatusHistory.create({ complaintId: complaint._id, changedBy: req.user._id, oldStatus, newStatus: status, remark: adminRemarks || `Status updated to ${status}` });

    const notification = await Notification.create({
      userId: complaint.studentId,
      message: `Your complaint "${complaint.title}" status has been updated to "${status}"`,
      type: 'status_update',
      complaintId: complaint._id,
    });

    const io = req.app.get('io');
    if (io) io.to(`user_${complaint.studentId}`).emit('notification', { message: notification.message, complaintId: complaint._id, status });
    broadcastDashboardUpdate(io);

    res.json({ success: true, complaint });
  } catch (error) { next(error); }
};

// PATCH /api/admin/complaints/:id/reassign
const reassignComplaint = async (req, res, next) => {
  try {
    const { adminId, remark } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Restriction: sub-admins can only reassign complaints within their department
    if (req.user.role !== 'super_admin') {
      const allowedCategory = roleCategoryMap[req.user.role];
      if (allowedCategory && complaint.category !== allowedCategory) {
        return res.status(403).json({ success: false, message: 'Access Denied: You cannot modify complaints outside your department.' });
      }
    }

    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    complaint.assignedTo = adminId;
    complaint.assignedAt = new Date();
    complaint.status = 'assigned';
    await complaint.save();

    await StatusHistory.create({
      complaintId: complaint._id,
      changedBy: req.user._id,
      oldStatus: complaint.status,
      newStatus: 'assigned',
      remark: remark || `Reassigned to ${admin.name}`
    });

    // Notify the newly assigned admin
    const notification = await Notification.create({
      userId: adminId,
      message: `A new complaint "${complaint.title}" has been assigned to you.`,
      type: 'assignment',
      complaintId: complaint._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${adminId}`).emit('notification', { message: notification.message, complaintId: complaint._id });
      broadcastDashboardUpdate(io);
    }
    res.json({ success: true, complaint });
  } catch (error) { next(error); }
};

// GET /api/admin/users/admins
const getAdmins = async (req, res, next) => {
  try {
    const allowedRoles = [
      'super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 
      'sports_admin', 'library_admin', 'placement_admin'
    ];
    const admins = await User.find({
      role: { $in: allowedRoles },
      approvalStatus: 'approved',
      isActive: true
    }).select('name role email');
    res.json({ success: true, admins });
  } catch (error) { next(error); }
};

// POST /api/admin/complaints/:id/moderate
const moderateComplaint = async (req, res, next) => {
  try {
    const { moderationStatus, adminRemarks } = req.body;
    if (!['verified', 'fake', 'resolved', 'rejected'].includes(moderationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid moderation status' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Restriction: sub-admins can only moderate complaints within their department
    if (req.user.role !== 'super_admin') {
      const allowedCategory = roleCategoryMap[req.user.role];
      if (allowedCategory && complaint.category !== allowedCategory) {
        return res.status(403).json({ success: false, message: 'Access Denied: You cannot modify complaints outside your department.' });
      }
    }

    const oldModerationStatus = complaint.moderationStatus;
    complaint.moderationStatus = moderationStatus;
    if (adminRemarks !== undefined) complaint.adminRemarks = adminRemarks;

    // Map moderation status to standard status
    if (moderationStatus === 'resolved') {
      complaint.status = 'resolved';
      complaint.resolvedAt = new Date();
    } else if (moderationStatus === 'rejected' || moderationStatus === 'fake') {
      complaint.status = moderationStatus === 'fake' ? 'fake' : 'rejected';
    } else if (moderationStatus === 'verified') {
      complaint.status = complaint.status === 'pending' ? 'assigned' : complaint.status;
    }

    if (moderationStatus === 'fake') {
      complaint.isFake = true;
      // Increment complainant's fakeComplaintCount
      const student = await User.findById(complaint.studentId);
      if (student) {
        student.fakeComplaintCount = (student.fakeComplaintCount || 0) + 1;
        if (student.fakeComplaintCount >= 1) {
          student.warningStatus = true;
        }
        if (student.fakeComplaintCount >= 3) {
          student.accountRestricted = true;
        }
        await student.save();

        await Notification.create({
          userId: student._id,
          message: student.fakeComplaintCount >= 3 
            ? `WARNING: Your account has been temporarily restricted from posting complaints due to receiving ${student.fakeComplaintCount} fake complaint strikes.`
            : `WARNING: You have received a warning strike because your complaint "${complaint.title}" was marked as FAKE. Please post genuine issues.`,
          type: 'status_update',
          complaintId: complaint._id,
        });
      }
    } else {
      complaint.isFake = false;
    }

    complaint.moderationHistory.push({
      status: moderationStatus,
      actionBy: req.user._id,
      remarks: adminRemarks || `Complaint marked as ${moderationStatus}`,
      timestamp: new Date()
    });

    await complaint.save();

    await StatusHistory.create({
      complaintId: complaint._id,
      changedBy: req.user._id,
      oldStatus: oldModerationStatus,
      newStatus: moderationStatus,
      remark: adminRemarks || `Complaint moderated to ${moderationStatus}`
    });

    const notification = await Notification.create({
      userId: complaint.studentId,
      message: `Your complaint "${complaint.title}" has been moderated and marked as "${moderationStatus}"`,
      type: 'status_update',
      complaintId: complaint._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${complaint.studentId}`).emit('notification', { 
        message: notification.message, 
        complaintId: complaint._id, 
        status: complaint.status,
        moderationStatus 
      });
      broadcastDashboardUpdate(io);
    }

    res.json({ success: true, complaint });
  } catch (error) { next(error); }
};

// GET /api/admin/requests (super_admin only)
const getPendingRequests = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Main Admin access required.' });
    }
    const adminRoles = ['admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin', 'library_admin', 'placement_admin'];
    const requests = await User.find({
      role: { $in: adminRoles },
      approvalStatus: 'pending'
    }).select('-password').sort({ requestDate: -1 });

    res.json({ success: true, requests });
  } catch (error) { next(error); }
};

// PATCH /api/admin/requests/:id/status (super_admin only)
const updateRequestStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Main Admin access required.' });
    }
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be approved or rejected.' });
    }

    const subAdmin = await User.findById(req.params.id);
    if (!subAdmin) return res.status(404).json({ success: false, message: 'Sub-admin request not found.' });

    subAdmin.approvalStatus = status;
    subAdmin.isApproved = status === 'approved';
    subAdmin.approvedBy = req.user._id;
    if (status === 'rejected') {
      subAdmin.rejectionReason = rejectionReason || 'No reason provided';
    } else {
      subAdmin.rejectionReason = undefined;
    }
    await subAdmin.save();

    // Log the audit action
    const ip = req.ip || req.connection.remoteAddress;
    await AdminAuditLog.create({
      actionType: status === 'approved' ? 'approval' : 'rejection',
      email: subAdmin.email,
      name: subAdmin.name,
      role: subAdmin.role,
      performedBy: req.user._id,
      ip,
      device: req.headers['user-agent'],
      details: status === 'approved' 
        ? `Request approved by ${req.user.name}` 
        : `Request rejected by ${req.user.name}. Reason: ${rejectionReason || 'No reason provided'}`
    });

    // Notify the user in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${subAdmin._id}`).emit('notification', {
        message: status === 'approved' 
          ? 'Your admin registration request has been approved! You can now log in.' 
          : `Your admin registration request was rejected. Reason: ${rejectionReason || 'No reason provided'}`,
        status
      });
      broadcastDashboardUpdate(io);
    }

    res.json({ success: true, message: `Sub-admin request ${status} successfully.`, user: subAdmin });
  } catch (error) { next(error); }
};

// GET /api/admin/roles (super_admin only)
const getSubAdmins = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Main Admin access required.' });
    }
    const adminRoles = ['admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin', 'library_admin', 'placement_admin'];
    const subAdmins = await User.find({
      role: { $in: adminRoles }
    }).select('-password').sort({ createdAt: -1 });

    res.json({ success: true, subAdmins });
  } catch (error) { next(error); }
};

// PATCH /api/admin/roles/:id/toggle (super_admin only)
const toggleSubAdminStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Main Admin access required.' });
    }
    const subAdmin = await User.findById(req.params.id);
    if (!subAdmin) return res.status(404).json({ success: false, message: 'Sub-admin not found.' });

    subAdmin.isActive = !subAdmin.isActive;
    await subAdmin.save();

    // Log the audit action
    const ip = req.ip || req.connection.remoteAddress;
    await AdminAuditLog.create({
      actionType: subAdmin.isActive ? 'reactivation' : 'deactivation',
      email: subAdmin.email,
      name: subAdmin.name,
      role: subAdmin.role,
      performedBy: req.user._id,
      ip,
      device: req.headers['user-agent'],
      details: subAdmin.isActive 
        ? `Sub-admin account reactivated by ${req.user.name}` 
        : `Sub-admin account deactivated by ${req.user.name}`
    });

    // Notify the user in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${subAdmin._id}`).emit('notification', {
        message: subAdmin.isActive 
          ? 'Your admin account has been reactivated. You can now log in.' 
          : 'Your admin account has been deactivated by the Main Admin.',
        isActive: subAdmin.isActive
      });
      if (!subAdmin.isActive) {
        io.to(`user_${subAdmin._id}`).disconnectSockets();
      }
      broadcastDashboardUpdate(io);
    }

    res.json({ success: true, message: `Sub-admin account status toggled. Active: ${subAdmin.isActive}`, user: subAdmin });
  } catch (error) { next(error); }
};

// GET /api/admin/logs (super_admin only)
const getAuditLogs = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Main Admin access required.' });
    }
    const logs = await AdminAuditLog.find()
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ success: true, logs });
  } catch (error) { next(error); }
};

module.exports = { 
  getStats, 
  getActivity, 
  getAllComplaints, 
  updateComplaintStatus, 
  reassignComplaint, 
  getAdmins, 
  moderateComplaint,
  getPendingRequests,
  updateRequestStatus,
  getSubAdmins,
  toggleSubAdminStatus,
  getAuditLogs
};
