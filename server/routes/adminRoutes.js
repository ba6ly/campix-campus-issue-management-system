const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats', protect, adminOnly, getStats);
router.get('/activity', protect, adminOnly, getActivity);
router.get('/complaints', protect, adminOnly, getAllComplaints);
router.patch('/complaints/:id/status', protect, adminOnly, updateComplaintStatus);
router.post('/complaints/:id/moderate', protect, adminOnly, moderateComplaint);
router.patch('/complaints/:id/reassign', protect, adminOnly, reassignComplaint);
router.get('/users/admins', protect, getAdmins); // Accessible to students for assignment selection

// Main Admin Management Routes
router.get('/requests', protect, adminOnly, getPendingRequests);
router.patch('/requests/:id/status', protect, adminOnly, updateRequestStatus);
router.get('/roles', protect, adminOnly, getSubAdmins);
router.patch('/roles/:id/toggle', protect, adminOnly, toggleSubAdminStatus);
router.get('/logs', protect, adminOnly, getAuditLogs);

module.exports = router;
