const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true },
  description: { type: String, required: [true, 'Description is required'] },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['hostel_wifi', 'academic', 'sports', 'department', 'general', 'library', 'placement'],
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'resolved', 'rejected', 'fake'],
    default: 'pending',
  },
  image: { type: String },
  evidenceImages: [{ type: String }],
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date },
  resolvedAt: { type: Date },
  isAnonymous: { type: Boolean, default: false },
  adminRemarks: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  location: { type: String, trim: true },
  supportCount: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  confirmCount: { type: Number, default: 0 },
  rejectCount: { type: Number, default: 0 },
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  moderationStatus: {
    type: String,
    enum: ['pending', 'verified', 'fake', 'resolved', 'rejected'],
    default: 'pending',
  },
  isFake: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  moderationHistory: [{
    status: String,
    actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: String,
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
