const Complaint = require('../models/Complaint');
const User = require('../models/User');
const StatusHistory = require('../models/StatusHistory');
const Notification = require('../models/Notification');
const { broadcastDashboardUpdate } = require('../sockets/index');

const categoryToRole = {
  hostel_wifi: 'hostel_admin',
  academic: 'academic_admin',
  sports: 'sports_admin',
  department: 'hod_admin',
  general: 'super_admin',
};

// GET /api/complaints/stats
const getStudentStats = async (req, res, next) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const result = { pending: 0, assigned: 0, 'in-progress': 0, resolved: 0, total: 0 };
    stats.forEach((s) => { 
      if (result[s._id] !== undefined) {
        result[s._id] = s.count;
      }
      result.total += s.count; 
    });
    res.json({ success: true, stats: result });
  } catch (error) { next(error); }
};

// GET /api/complaints
const getComplaints = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const query = { isDeleted: { $ne: true } }; // Restore global feed & ignore deleted
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;

    const complaints = await Complaint.find(query)
      .populate('studentId', 'name rollNumber department')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Complaint.countDocuments(query);
    res.json({ success: true, complaints, total, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

// POST /api/complaints
const createComplaint = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const { title, description, category, priority, location, isAnonymous, assignedTo } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    let admin;
    if (assignedTo && assignedTo !== '' && assignedTo !== 'null' && assignedTo !== 'undefined') {
      admin = await User.findById(assignedTo);
    } else {
      // Auto-assignment logic
      const requiredRole = categoryToRole[category] || 'super_admin';
      admin = await User.findOne({ role: requiredRole });
    }

    const complaintData = {
      title, description, category, priority, location,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      image, studentId: req.user._id,
      status: admin ? 'assigned' : 'pending',
      assignedTo: admin ? admin._id : null,
      assignedAt: admin ? new Date() : null,
    };

    const complaint = await Complaint.create(complaintData);

    // Notify assigned admin if any
    if (admin) {
      const adminNotification = await Notification.create({
        userId: admin._id,
        message: `A new ${category} complaint has been automatically assigned to you.`,
        type: 'assignment',
        complaintId: complaint._id,
      });
      if (io) io.to(`user_${admin._id}`).emit('notification', { message: adminNotification.message, complaintId: complaint._id });
    }

    await StatusHistory.create({
      complaintId: complaint._id,
      changedBy: req.user._id,
      oldStatus: null,
      newStatus: complaint.status,
      remark: admin ? `Automatically assigned to ${admin.name}` : 'Complaint submitted'
    });

    // Global real-time dashboard update
    broadcastDashboardUpdate(req.app.get('io'));

    res.status(201).json({ success: true, complaint });
  } catch (error) { next(error); }
};
// GET /api/complaints/:id
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('studentId', 'name email rollNumber department')
      .populate('assignedTo', 'name role');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const history = await StatusHistory.find({ complaintId: complaint._id }).populate('changedBy', 'name role').sort({ createdAt: 1 });
    res.json({ success: true, complaint, history });
  } catch (error) { next(error); }
};

// DELETE /api/complaints/:id
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Permission check: Student can only delete their own. Admin can delete any.
    const isAdmin = ['super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin'].includes(req.user.role);
    if (!isAdmin && complaint.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this complaint' });
    }

    // Soft delete instead of hard delete
    complaint.isDeleted = true;
    await complaint.save();

    broadcastDashboardUpdate(req.app.get('io'));
    res.json({ success: true, message: 'Complaint deleted successfully' });
  } catch (error) { next(error); }
};

// POST /api/complaints/check-duplicate
const checkDuplicateComplaint = async (req, res, next) => {
  try {
    const { title, description, category, location } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Missing title, description, or category' });
    }

    // Find all active complaints in the same category
    const complaints = await Complaint.find({
      category,
      isDeleted: { $ne: true }
    });

    const similar = [];
    
    // Stopwords for simple keyword filtering
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'is', 'are', 'was', 'were', 'it', 'this', 'that', 'my', 'your', 'from', 'by', 'about']);
    
    const getKeywords = (text) => {
      if (!text) return [];
      return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));
    };

    const targetKeywords = getKeywords(`${title} ${description}`);

    for (const c of complaints) {
      // 1. Compare location if available
      let locationMatch = false;
      if (location && c.location) {
        const locA = location.toLowerCase().trim();
        const locB = c.location.toLowerCase().trim();
        if (locA === locB || locA.includes(locB) || locB.includes(locA)) {
          locationMatch = true;
        }
      }

      // 2. Keyword similarity comparison
      const currentKeywords = getKeywords(`${c.title} ${c.description}`);
      const matches = targetKeywords.filter(k => currentKeywords.includes(k));
      
      // Calculate overlap similarity
      const unionSize = new Set([...targetKeywords, ...currentKeywords]).size;
      const jaccard = unionSize > 0 ? matches.length / unionSize : 0;
      
      // Title overlap
      const targetTitleWords = getKeywords(title);
      const currentTitleWords = getKeywords(c.title);
      const titleMatches = targetTitleWords.filter(w => currentTitleWords.includes(w));
      const titleOverlap = targetTitleWords.length > 0 ? titleMatches.length / targetTitleWords.length : 0;

      // Duplicate threshold: title similarity high OR (location matches AND some description similarity)
      if (titleOverlap >= 0.5 || jaccard >= 0.25 || (locationMatch && matches.length >= 2)) {
        similar.push({
          complaint: c,
          similarity: Math.round(Math.max(titleOverlap, jaccard) * 100)
        });
      }
    }

    // Sort by highest similarity
    similar.sort((a, b) => b.similarity - a.similarity);

    // Return top 3 similar complaints
    res.json({
      success: true,
      similarComplaints: similar.slice(0, 3).map(s => s.complaint)
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/complaints/:id/support
const supportComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.isDeleted) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Prevent multiple upvotes
    if (complaint.upvotedBy.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You have already supported this complaint' });
    }

    complaint.upvotedBy.push(req.user._id);
    complaint.supportCount = complaint.upvotedBy.length;
    await complaint.save();

    broadcastDashboardUpdate(req.app.get('io'));

    res.json({
      success: true,
      message: 'Complaint supported successfully!',
      supportCount: complaint.supportCount
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/complaints/:id/verify/confirm
const confirmComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.isDeleted) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Enforce verified students only
    if (!req.user.isVerified) {
      return res.status(403).json({ success: false, message: 'Only verified students can verify complaints' });
    }

    // Enforce users cannot verify their own complaints
    if (complaint.studentId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot verify your own complaint' });
    }

    // Prevent multiple voting
    if (complaint.verifiedBy.includes(req.user._id) || complaint.rejectedBy.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You have already verified this complaint' });
    }

    complaint.verifiedBy.push(req.user._id);
    complaint.confirmCount = complaint.verifiedBy.length;
    await complaint.save();

    broadcastDashboardUpdate(req.app.get('io'));

    res.json({
      success: true,
      message: 'Issue confirmed successfully!',
      confirmCount: complaint.confirmCount
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/complaints/:id/verify/reject
const rejectComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.isDeleted) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Enforce verified students only
    if (!req.user.isVerified) {
      return res.status(403).json({ success: false, message: 'Only verified students can verify complaints' });
    }

    // Enforce users cannot verify their own complaints
    if (complaint.studentId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot verify your own complaint' });
    }

    // Prevent multiple voting
    if (complaint.verifiedBy.includes(req.user._id) || complaint.rejectedBy.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You have already verified this complaint' });
    }

    complaint.rejectedBy.push(req.user._id);
    complaint.rejectCount = complaint.rejectedBy.length;
    await complaint.save();

    broadcastDashboardUpdate(req.app.get('io'));

    res.json({
      success: true,
      message: 'Reported as issue not found successfully!',
      rejectCount: complaint.rejectCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getStudentStats, 
  getComplaints, 
  createComplaint, 
  getComplaintById, 
  deleteComplaint,
  checkDuplicateComplaint,
  supportComplaint,
  confirmComplaint,
  rejectComplaint
};
