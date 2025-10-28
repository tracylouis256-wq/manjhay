const express = require('express');
const {
  getUsers,
  getUser,
  updateUserStatus,
  updateUserRole,
  getUserStats,
  deleteUser,
  getUserOrders,
  getUserActivity,
  bulkUpdateUserStatus,
  exportUsers
} = require('../controllers/userController');
const { adminProtect } = require('../middleware/auth');

const router = express.Router();

// Handle preflight OPTIONS requests for all user routes
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-auth-token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

// Admin user management routes
router.get('/admin/users', adminProtect, getUsers);
router.get('/admin/users/stats', adminProtect, getUserStats);
router.get('/admin/users/export', adminProtect, exportUsers);
router.get('/admin/users/:id', adminProtect, getUser);
router.get('/admin/users/:id/orders', adminProtect, getUserOrders);
router.get('/admin/users/:id/activity', adminProtect, getUserActivity);
router.patch('/admin/users/:id/status', adminProtect, updateUserStatus);
router.patch('/admin/users/:id/role', adminProtect, updateUserRole);
router.patch('/admin/users/bulk/status', adminProtect, bulkUpdateUserStatus);
router.delete('/admin/users/:id', adminProtect, deleteUser);

module.exports = router;