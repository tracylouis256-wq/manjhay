const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');
const NotificationService = require('../services/notificationService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    console.log('Registration request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password
    });

    if (user) {
      // NOTIFICATION INTEGRATION
      try {
        const welcomeNotification = await NotificationService.createUserNotification(user._id, 'welcome');
        await NotificationService.createAdminNotification('new_user', user._id, user.name);

        if (global.wsService) {
          global.wsService.sendNotification(user._id.toString(), welcomeNotification);
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
      }

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(', ')}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    console.log('Login request:', req.body);
    
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // NOTIFICATION INTEGRATION
    try {
      const hasCartItems = false; // Update based on your cart logic
      
      if (hasCartItems) {
        const cartNotification = await NotificationService.createUserNotification(user._id, 'cart_reminder', 3);
        
        if (global.wsService) {
          global.wsService.sendNotification(user._id.toString(), cartNotification);
        }
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    // NOTIFICATION INTEGRATION: Profile update confirmation
    try {
      const profileNotification = await NotificationService.createUserNotification(
        user._id,
        'profile_updated'
      );

      if (global.wsService) {
        global.wsService.sendNotification(user._id.toString(), profileNotification);
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(req.body.currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    // NOTIFICATION INTEGRATION: Password change confirmation
    try {
      const passwordNotification = await NotificationService.createUserNotification(
        user._id,
        'password_changed'
      );

      if (global.wsService) {
        global.wsService.sendNotification(user._id.toString(), passwordNotification);
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    // Generate reset token (simplified - in production, use proper token generation)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Save reset token to user (you'd want to hash this and set expiry in production)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // NOTIFICATION INTEGRATION: Password reset initiated
    try {
      const resetNotification = await NotificationService.createUserNotification(
        user._id,
        'system',
        'Password Reset Request',
        'A password reset has been requested for your account. If you did not request this, please ignore this notification.'
      );

      if (global.wsService) {
        global.wsService.sendNotification(user._id.toString(), resetNotification);
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // NOTIFICATION INTEGRATION: Password reset confirmation
    try {
      const resetSuccessNotification = await NotificationService.createUserNotification(
        user._id,
        'password_reset'
      );

      if (global.wsService) {
        global.wsService.sendNotification(user._id.toString(), resetSuccessNotification);
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate username & password
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check for admin
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne({ username }).select('+password');

    if (admin && (await admin.matchPassword(password))) {
      if (!admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Admin account is deactivated'
        });
      }

      res.json({
        success: true,
        data: {
          _id: admin._id,
          username: admin.username,
          role: admin.role,
          token: generateToken(admin._id)
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics (admin)
// @route   GET /api/auth/admin/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        newUsersToday,
        inactiveUsers: totalUsers - activeUsers
      }
    });
  } catch (error) {
    next(error);
  }
};