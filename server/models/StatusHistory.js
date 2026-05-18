const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  oldStatus: { type: String },
  newStatus: { type: String, required: true },
  remark: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('StatusHistory', statusHistorySchema);
