const Notification = require('../models/Notification');
const User = require('../models/User');
const Admin = require('../models/Admin');

class NotificationService {
  // User notification templates
  static userTemplates = {
    order_verified: (orderId) => ({
      type: 'order_verified',
      title: 'Order Verified',
      message: `Your order #${this.formatOrderId(orderId)} has been verified and is being processed.`,
      priority: 'medium',
      action: { type: 'order', id: orderId, url: `/orders/${orderId}` }
    }),

    order_shipped: (orderId) => ({
      type: 'order_shipped',
      title: 'Order Shipped',
      message: `Your order #${this.formatOrderId(orderId)} has been shipped and is on its way to you.`,
      priority: 'medium',
      action: { type: 'order', id: orderId, url: `/orders/${orderId}` }
    }),

    order_delivered: (orderId) => ({
      type: 'order_delivered',
      title: 'Order Delivered',
      message: `Your order #${this.formatOrderId(orderId)} has been delivered. Thank you for shopping with us!`,
      priority: 'medium',
      action: { type: 'order', id: orderId, url: `/orders/${orderId}` }
    }),

    order_cancelled: (orderId, reason) => ({
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Your order #${this.formatOrderId(orderId)} has been cancelled. ${reason || ''}`,
      priority: 'high',
      action: { type: 'order', id: orderId, url: `/orders/${orderId}` }
    }),

    payment_received: (orderId) => ({
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment received for order #${this.formatOrderId(orderId)}. We're verifying your payment.`,
      priority: 'medium',
      action: { type: 'order', id: orderId, url: `/orders/${orderId}` }
    }),

    payment_verified: (orderId) => ({
      type: 'payment_verified',
      title: 'Payment Verified',
      message: `Payment for order #${this.formatOrderId(orderId)} has been verified successfully.`,
      priority: 'medium',
      action: { type: 'order', id: orderId, url: `/orders/${orderId}` }
    }),

    payment_rejected: (orderId, reason) => ({
      type: 'payment_rejected',
      title: 'Payment Rejected',
      message: `Payment for order #${this.formatOrderId(orderId)} was rejected. ${reason || 'Please contact support.'}`,
      priority: 'high',
      action: { type: 'order', id: orderId, url: `/orders/${orderId}` }
    }),

    admin_contact: (orderId) => ({
      type: 'admin_contact',
      title: 'Delivery Discussion',
      message: `Admin will contact you shortly to discuss delivery arrangements for order #${this.formatOrderId(orderId)}.`,
      priority: 'high',
      action: { type: 'order', id: orderId, url: `/orders/${orderId}` }
    }),

    admin_contact_failed: (orderId) => ({
      type: 'admin_contact_failed',
      title: 'Contact Attempt Failed',
      message: `We tried to reach you regarding order #${this.formatOrderId(orderId)}. Please check your messages.`,
      priority: 'high',
      action: { type: 'order', id: orderId, url: `/orders/${orderId}` }
    }),

    welcome: () => ({
      type: 'welcome',
      title: 'Welcome to ManJhay!',
      message: 'Thank you for joining ManJhay. Start exploring our collection of quality slippers.',
      priority: 'low',
      action: { type: 'system', url: '/products' }
    }),

    cart_reminder: (itemCount) => ({
      type: 'cart_reminder',
      title: 'Cart Reminder',
      message: `You have ${itemCount} item${itemCount > 1 ? 's' : ''} waiting in your cart. Complete your purchase now!`,
      priority: 'low',
      action: { type: 'cart', url: '/cart' }
    }),

    new_products: (category) => ({
      type: 'new_products',
      title: 'New Products Available',
      message: `Check out new ${category} slippers just added to our collection.`,
      priority: 'low',
      action: { type: 'product', url: `/products?category=${category}` }
    }),

    profile_updated: () => ({
      type: 'profile_updated',
      title: 'Profile Updated',
      message: 'Your profile information has been updated successfully.',
      priority: 'low',
      action: { type: 'profile', url: '/profile' }
    }),

    password_changed: () => ({
      type: 'password_changed',
      title: 'Password Changed',
      message: 'Your password has been changed successfully for security reasons.',
      priority: 'high',
      action: { type: 'system', url: '/profile' }
    }),

    password_reset: () => ({
      type: 'password_reset',
      title: 'Password Reset',
      message: 'Your password has been reset successfully.',
      priority: 'high',
      action: { type: 'system', url: '/profile' }
    }),

    system: (title, message) => ({
      type: 'system',
      title: title,
      message: message,
      priority: 'medium',
      action: { type: 'system', url: '/' }
    }),

    security_alert: (action) => ({
      type: 'security_alert',
      title: 'Security Alert',
      message: `Security action performed: ${action}`,
      priority: 'high',
      action: { type: 'system', url: '/profile' }
    })
  };

  // Admin notification templates
  static adminTemplates = {
    new_order: (orderId, userName) => ({
      type: 'new_order',
      title: 'New Order Received',
      message: `New order #${this.formatOrderId(orderId)} from ${userName}. Payment proof uploaded.`,
      priority: 'high',
      action: { type: 'order', id: orderId, url: `/admin/orders/${orderId}` }
    }),

    payment_proof_uploaded: (orderId, userName) => ({
      type: 'payment_proof_uploaded',
      title: 'Payment Proof Uploaded',
      message: `Payment proof uploaded for order #${this.formatOrderId(orderId)} by ${userName}.`,
      priority: 'medium',
      action: { type: 'order', id: orderId, url: `/admin/orders/${orderId}` }
    }),

    order_verification_required: (orderId, userName) => ({
      type: 'order_verification_required',
      title: 'Order Verification Required',
      message: `Order #${this.formatOrderId(orderId)} by ${userName} requires payment verification.`,
      priority: 'high',
      action: { type: 'order', id: orderId, url: `/admin/orders/${orderId}` }
    }),

    low_stock: (productId, productName, quantity) => ({
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `Product "${productName}" has only ${quantity} units left. Consider restocking.`,
      priority: 'medium',
      action: { type: 'product', id: productId, url: `/admin/inventory` }
    }),

    out_of_stock: (productId, productName) => ({
      type: 'out_of_stock',
      title: 'Out of Stock',
      message: `Product "${productName}" is out of stock. Urgent restocking required.`,
      priority: 'high',
      action: { type: 'product', id: productId, url: `/admin/inventory` }
    }),

    inventory_updated: (productName) => ({
      type: 'inventory_updated',
      title: 'Inventory Updated',
      message: `Inventory levels for "${productName}" have been updated successfully.`,
      priority: 'low',
      action: { type: 'inventory', url: '/admin/inventory' }
    }),

    new_user: (userId, userName) => ({
      type: 'new_user',
      title: 'New User Registered',
      message: `New user ${userName} has registered on the platform.`,
      priority: 'low',
      action: { type: 'user', id: userId, url: '/admin/users' }
    }),

    high_traffic: (userCount) => ({
      type: 'high_traffic',
      title: 'High Traffic Alert',
      message: `High traffic detected: ${userCount}+ active users on the platform.`,
      priority: 'medium',
      action: { type: 'system', url: '/admin/dashboard' }
    }),

    system_maintenance: (schedule) => ({
      type: 'system_maintenance',
      title: 'System Maintenance',
      message: `System maintenance scheduled for ${schedule}.`,
      priority: 'medium',
      action: { type: 'system', url: '/admin/dashboard' }
    })
  };

  // Helper method to format order ID safely
  static formatOrderId(orderId) {
    try {
      if (!orderId) return 'UNKNOWN';
      
      // If it's a MongoDB ObjectId, convert to string
      const idString = orderId.toString ? orderId.toString() : String(orderId);
      
      // Return last 8 characters for display
      return idString.slice(-8);
    } catch (error) {
      console.error('❌ Error formatting order ID:', error);
      return 'UNKNOWN';
    }
  }

  // ✅ NEW: Send real-time notification via WebSocket
  static async sendRealTimeNotification(userId, notification) {
    try {
      if (!global.wsService) {
        console.log('⚠️ WebSocket service not available for real-time notification');
        return false;
      }

      console.log(`📡 [WEBSOCKET] Sending real-time notification to user ${userId}:`, {
        title: notification.title,
        type: notification.type,
        id: notification._id
      });

      const success = global.wsService.sendNotification(userId.toString(), notification);
      
      if (success) {
        console.log(`✅ Real-time notification sent successfully to user ${userId}`);
      } else {
        console.log(`⚠️ User ${userId} not connected, notification saved to database only`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error sending real-time notification:', error);
      return false;
    }
  }

  // ✅ UPDATED: Create user notification with WebSocket
  static async createUserNotification(userId, templateType, ...args) {
    try {
      console.log(`🔔 [NOTIFICATION] Creating user notification: ${templateType} for user ${userId}`);
      
      const template = this.userTemplates[templateType];
      if (!template) {
        throw new Error(`Unknown notification template: ${templateType}`);
      }

      const notificationData = template(...args);
      const notification = await Notification.createUserNotification(userId, notificationData);
      
      console.log(`✅ User notification created: ${templateType} for user ${userId}`);
      console.log(`📝 Notification details:`, {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type
      });

      // ✅ Send real-time notification via WebSocket
      await this.sendRealTimeNotification(userId, notification);
      
      return notification;
    } catch (error) {
      console.error('❌ Error creating user notification:', error);
      throw error;
    }
  }

  // ✅ UPDATED: Create admin notification with WebSocket
  static async createAdminNotification(templateType, ...args) {
    try {
      const template = this.adminTemplates[templateType];
      if (!template) {
        throw new Error(`Unknown notification template: ${templateType}`);
      }

      const admins = await Admin.find({ isActive: true });
      const notifications = [];

      for (const admin of admins) {
        const notificationData = template(...args);
        const notification = await Notification.create({
          adminId: admin._id,
          audience: 'admin',
          ...notificationData
        });
        
        notifications.push(notification);
        
        // ✅ Send real-time notification via WebSocket
        await this.sendRealTimeNotification(admin._id, notification);
      }

      console.log(`✅ Admin notification created: ${templateType} for ${notifications.length} admins`);
      return notifications;
    } catch (error) {
      console.error('❌ Error creating admin notification:', error);
      throw error;
    }
  }

  // ✅ UPDATED: Create notification for specific admin with WebSocket
  static async createAdminNotificationForUser(adminId, templateType, ...args) {
    try {
      const template = this.adminTemplates[templateType];
      if (!template) {
        throw new Error(`Unknown notification template: ${templateType}`);
      }

      const notificationData = template(...args);
      const notification = await Notification.createAdminNotification(adminId, notificationData);
      
      console.log(`✅ Admin notification created: ${templateType} for admin ${adminId}`);
      
      // ✅ Send real-time notification via WebSocket
      await this.sendRealTimeNotification(adminId, notification);
      
      return notification;
    } catch (error) {
      console.error('❌ Error creating admin notification:', error);
      throw error;
    }
  }

  // ✅ UPDATED: Broadcast to all users with WebSocket
  static async broadcastToUsers(templateType, ...args) {
    try {
      const template = this.userTemplates[templateType];
      if (!template) {
        throw new Error(`Unknown notification template: ${templateType}`);
      }

      const users = await User.find({ isActive: true });
      const notifications = [];

      for (const user of users) {
        const notificationData = template(...args);
        const notification = await Notification.create({
          userId: user._id,
          audience: 'user',
          ...notificationData
        });
        
        notifications.push(notification);
        
        // ✅ Send real-time notification via WebSocket
        await this.sendRealTimeNotification(user._id, notification);
      }

      console.log(`✅ Broadcast notification sent: ${templateType} to ${notifications.length} users`);
      return notifications;
    } catch (error) {
      console.error('❌ Error broadcasting notification:', error);
      throw error;
    }
  }

  // ✅ UPDATED: Create custom notification with WebSocket
  static async createCustomUserNotification(userId, notificationData) {
    try {
      const notification = await Notification.create({
        userId,
        audience: 'user',
        ...notificationData
      });
      
      console.log(`✅ Custom notification created for user ${userId}`);
      
      // ✅ Send real-time notification via WebSocket
      await this.sendRealTimeNotification(userId, notification);
      
      return notification;
    } catch (error) {
      console.error('❌ Error creating custom notification:', error);
      throw error;
    }
  }

  // ✅ NEW: Send notification to multiple users
  static async sendToMultipleUsers(userIds, templateType, ...args) {
    try {
      const template = this.userTemplates[templateType];
      if (!template) {
        throw new Error(`Unknown notification template: ${templateType}`);
      }

      const notifications = [];

      for (const userId of userIds) {
        const notificationData = template(...args);
        const notification = await Notification.create({
          userId,
          audience: 'user',
          ...notificationData
        });
        
        notifications.push(notification);
        
        // ✅ Send real-time notification via WebSocket
        await this.sendRealTimeNotification(userId, notification);
      }

      console.log(`✅ Notification sent to ${notifications.length} users: ${templateType}`);
      return notifications;
    } catch (error) {
      console.error('❌ Error sending notification to multiple users:', error);
      throw error;
    }
  }

  // ✅ NEW: Get user notifications with enhanced logging
  static async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const startIndex = (page - 1) * limit;

      const notifications = await Notification.find({
        $or: [
          { userId: userId },
          { audience: 'both' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .lean();

      const total = await Notification.countDocuments({
        $or: [
          { userId: userId },
          { audience: 'both' }
        ]
      });

      console.log(`📋 Retrieved ${notifications.length} notifications for user ${userId}`);
      
      return {
        notifications,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      console.error('❌ Error getting user notifications:', error);
      throw error;
    }
  }

  // ✅ NEW: Get unread count for user
  static async getUserUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        $or: [
          { userId: userId },
          { audience: 'both' }
        ],
        read: false
      });

      console.log(`📊 User ${userId} has ${count} unread notifications`);
      
      return count;
    } catch (error) {
      console.error('❌ Error getting user unread count:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;