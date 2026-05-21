const mongoose = require('mongoose');

const preApprovedStudentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  rollNumber: { type: String, required: true, unique: true, trim: true },
  department: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('PreApprovedStudent', preApprovedStudentSchema);
