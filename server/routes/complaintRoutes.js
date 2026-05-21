const express = require('express');
const router = express.Router();
const { 
  getStudentStats, 
  getComplaints, 
  createComplaint, 
  getComplaintById, 
  deleteComplaint,
  checkDuplicateComplaint,
  supportComplaint,
  confirmComplaint,
  rejectComplaint
} = require('../controllers/complaintController');
const { protect, protectOptional } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fakeComplaintCheck = require('../middleware/fakeComplaintCheck');

// Public read endpoints with optional user context (guest friendly)
router.get('/stats', protectOptional, getStudentStats);
router.get('/', protectOptional, getComplaints);
router.get('/:id', protectOptional, getComplaintById);

// Fully protected write/interaction endpoints requiring login
router.post('/check-duplicate', protect, checkDuplicateComplaint);
router.post('/:id/support', protect, supportComplaint);
router.post('/:id/verify/confirm', protect, confirmComplaint);
router.post('/:id/verify/reject', protect, rejectComplaint);
router.post('/', protect, fakeComplaintCheck, upload.single('image'), createComplaint);
router.delete('/:id', protect, deleteComplaint);

module.exports = router;
