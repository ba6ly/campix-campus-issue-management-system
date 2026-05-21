const mongoose = require('mongoose');

const secretKeyAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  ip: { type: String },
  attempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}, { timestamps: true });

// Check if locked
secretKeyAttemptSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model('SecretKeyAttempt', secretKeyAttemptSchema);
