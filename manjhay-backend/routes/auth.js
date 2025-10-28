const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  adminLogin
} = require('../controllers/authController');
const { protect, adminProtect } = require('../middleware/auth');

const router = express.Router();

// Handle preflight OPTIONS requests for all auth routes
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-auth-token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

// Phone validation helper
const validatePhone = (phone) => {
  const validPrefixes = ['024', '053', '054', '059', '025', '055', '026', '027', '057', '056', '020', '050'];
  return phone.length === 10 && validPrefixes.includes(phone.substring(0, 3));
};

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .custom((value) => {
      if (!validatePhone(value)) {
        throw new Error('Please provide a valid Ghana phone number');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected user routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;