const User = require('../models/User');

// GET /api/users/profile
const getProfile = async (req, res) => res.json({ success: true, user: req.user });

// PATCH /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, rollNumber, department, notificationPrefs } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, rollNumber, department, notificationPrefs }, { returnDocument: 'after', runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

// PATCH /api/users/password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) { next(error); }
};

module.exports = { getProfile, updateProfile, changePassword };
