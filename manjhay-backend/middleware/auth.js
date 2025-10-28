const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const NotificationService = require('../services/notificationService');
const Cart = require('../models/Cart');

// Protect user routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      req.user = user;

      // ✅ Send cart reminder notification if user has items in cart
      try {
        const cartItems = await Cart.find({ user: user._id });
        if (cartItems && cartItems.length > 0) {
          const cartNotification = await NotificationService.createUserNotification(
            user._id, 
            'cart_reminder', 
            cartItems.length
          );
          
          if (global.wsService) {
            global.wsService.sendNotification(user._id.toString(), cartNotification);
          }
        }
      } catch (notificationError) {
        console.error('Cart notification error in middleware:', notificationError);
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Protect admin routes - UPDATED to accept both Admin model and User with admin role
exports.adminProtect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // First try to find user with admin role
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive && user.role === 'admin') {
        req.user = user;
        req.admin = user; // Also set as admin for compatibility
        return next();
      }

      // If no user with admin role, try to find Admin model record
      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin && admin.isActive) {
        req.admin = admin;
        return next();
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized to access admin routes'
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};