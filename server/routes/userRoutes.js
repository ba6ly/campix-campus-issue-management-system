const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/password', changePassword);

module.exports = router;
