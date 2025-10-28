const express = require('express');

// Debug: Check imports first
console.log('🔍 Loading orderController...');
const orderController = require('../controllers/orderController');
console.log('✅ orderController loaded');

// Check middleware imports
console.log('🔍 Loading middleware...');
const authMiddleware = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
console.log('✅ Middleware loaded');

// Destructure after confirming they exist
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  addContactHistory,
  contactCustomerShipping,
  finalizeShippingCost,
  verifyPayment,
  getUserOrders,
  getUserOrder,
  cancelOrder,
  getOrderStats
} = orderController;

const { protect, adminProtect } = authMiddleware;
const { upload, handleUploadError } = uploadMiddleware;

const router = express.Router();

console.log('✅ All imports successful, setting up routes...');

// User routes
router.route('/user/my-orders')
  .get(protect, getUserOrders);

router.route('/user/:id')
  .get(protect, getUserOrder);

// User order cancellation
router.patch('/:id/cancel', protect, cancelOrder);

// Order creation (user route but needs file upload)
router.route('/')
  .post(protect, upload.single('paymentProof'), handleUploadError, createOrder)
  .get(adminProtect, getOrders);

// Admin order management routes
router.route('/:id')
  .get(adminProtect, getOrder);

// Order status and management routes
router.patch('/:id/status', adminProtect, updateOrderStatus);
router.patch('/:id/verify-payment', adminProtect, verifyPayment);
router.post('/:id/contact', adminProtect, addContactHistory);

// Shipping management routes
router.post('/:id/contact-shipping', adminProtect, contactCustomerShipping);
router.patch('/:id/finalize-shipping', adminProtect, finalizeShippingCost);

// Admin statistics
router.get('/admin/stats', adminProtect, getOrderStats);

console.log('✅ All routes configured successfully');

module.exports = router;