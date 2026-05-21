const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Auto-migrate/authorize existing admin accounts who don't have approval fields set
    try {
      const User = require('../models/User');
      const adminRoles = ['admin', 'super_admin', 'academic_admin', 'hostel_admin', 'hod_admin', 'sports_admin', 'library_admin', 'placement_admin'];
      const result = await User.updateMany(
        { 
          role: { $in: adminRoles }, 
          approvalStatus: { $exists: false } 
        },
        { 
          $set: { 
            approvalStatus: 'approved', 
            isApproved: true,
            isActive: true
          } 
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`🔒 Auto-migrated: Authorized ${result.modifiedCount} existing admin accounts.`);
      }
    } catch (migErr) {
      console.error(`⚠️ Admin auto-migration error: ${migErr.message}`);
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
