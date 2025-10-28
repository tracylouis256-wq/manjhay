const Notification = require('../models/Notification');
const User = require('../models/User');
const Admin = require('../models/Admin');

// @desc    Get user notifications
// @route   GET /api/notifications/user
// @access  Private
exports.getUserNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const notifications = await Notification.find({
      $or: [
        { userId: req.user.id },
        { audience: 'both' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);

    const total = await Notification.countDocuments({
      $or: [
        { userId: req.user.id },
        { audience: 'both' }
      ]
    });

    res.json({
      success: true,
      count: notifications.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin notifications
// @route   GET /api/notifications/admin
// @access  Private/Admin
exports.getAdminNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const notifications = await Notification.find({
      $or: [
        { adminId: req.admin.id },
        { audience: 'admin' },
        { audience: 'both' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);

    const total = await Notification.countDocuments({
      $or: [
        { adminId: req.admin.id },
        { audience: 'admin' },
        { audience: 'both' }
      ]
    });

    res.json({
      success: true,
      count: notifications.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count for user
// @route   GET /api/notifications/user/unread-count
// @access  Private
exports.getUserUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      $or: [
        { userId: req.user.id },
        { audience: 'both' }
      ],
      read: false
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count for admin
// @route   GET /api/notifications/admin/unread-count
// @access  Private/Admin
exports.getAdminUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      $or: [
        { adminId: req.admin.id },
        { audience: 'admin' },
        { audience: 'both' }
      ],
      read: false
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   POST /api/notifications/user/mark-read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.body;

    const notification = await Notification.findOne({
      _id: notificationId,
      $or: [
        { userId: req.user.id },
        { audience: 'both' }
      ]
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   POST /api/notifications/user/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { userId: req.user.id },
          { audience: 'both' }
        ],
        read: false
      },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/user/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user.id },
        { audience: 'both' }
      ]
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create admin notification
// @route   POST /api/notifications/admin
// @access  Private/Admin
exports.createAdminNotification = async (req, res, next) => {
  try {
    const notification = await Notification.createAdminNotification(
      req.admin.id,
      req.body
    );

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Broadcast notification to all users
// @route   POST /api/notifications/admin/broadcast
// @access  Private/Admin
exports.broadcastNotification = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true });
    
    const notifications = users.map(user => ({
      userId: user._id,
      audience: 'user',
      ...req.body
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Notification broadcast to ${users.length} users`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Debug endpoint to check user notifications
// @route   GET /api/notifications/user/debug/:userId
// @access  Private/Admin
exports.getUserNotificationsDebug = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.params.userId 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};