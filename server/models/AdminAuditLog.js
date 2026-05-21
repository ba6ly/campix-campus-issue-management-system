const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  actionType: { 
    type: String, 
    enum: ['registration_request', 'registration_failed', 'approval', 'rejection', 'deactivation', 'reactivation', 'suspicious_attempt'], 
    required: true 
  },
  email: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String },
  role: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ip: { type: String },
  device: { type: String },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
