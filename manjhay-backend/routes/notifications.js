const express = require('express');
const {
  getUserNotifications,
  getAdminNotifications,
  getUserUnreadCount,
  getAdminUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAdminNotification,
  broadcastNotification
} = require('../controllers/notificationController');
const { protect, adminProtect } = require('../middleware/auth');

const router = express.Router();

// User routes
router.get('/user', protect, getUserNotifications);
router.get('/user/unread-count', protect, getUserUnreadCount);
router.post('/user/mark-read', protect, markAsRead);
router.post('/user/mark-all-read', protect, markAllAsRead);
router.delete('/user/:id', protect, deleteNotification);

// Admin routes
router.get('/admin', adminProtect, getAdminNotifications);
router.get('/admin/unread-count', adminProtect, getAdminUnreadCount);
router.post('/admin', adminProtect, createAdminNotification);
router.post('/admin/broadcast', adminProtect, broadcastNotification);

module.exports = router;