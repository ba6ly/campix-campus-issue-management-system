// Middleware to block restricted users from posting complaints
const fakeComplaintCheck = (req, res, next) => {
  if (req.user && req.user.accountRestricted) {
    return res.status(403).json({
      success: false,
      message: 'Submission blocked. Your account is temporarily restricted from submitting complaints due to multiple fake complaint strikes.'
    });
  }
  next();
};

module.exports = fakeComplaintCheck;
