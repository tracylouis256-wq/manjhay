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

  // Create user notification
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
      
      return notification;
    } catch (error) {
      console.error('❌ Error creating user notification:', error);
      throw error;
    }
  }

  // Create admin notification (for all admins)
  static async createAdminNotification(templateType, ...args) {
    try {
      const template = this.adminTemplates[templateType];
      if (!template) {
        throw new Error(`Unknown notification template: ${templateType}`);
      }

      const admins = await Admin.find({ isActive: true });
      const notifications = admins.map(admin => ({
        adminId: admin._id,
        audience: 'admin',
        ...template(...args)
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`✅ Admin notification created: ${templateType} for ${notifications.length} admins`);
      }

      return notifications;
    } catch (error) {
      console.error('❌ Error creating admin notification:', error);
      throw error;
    }
  }

  // Create notification for specific admin
  static async createAdminNotificationForUser(adminId, templateType, ...args) {
    try {
      const template = this.adminTemplates[templateType];
      if (!template) {
        throw new Error(`Unknown notification template: ${templateType}`);
      }

      const notificationData = template(...args);
      const notification = await Notification.createAdminNotification(adminId, notificationData);
      
      console.log(`✅ Admin notification created: ${templateType} for admin ${adminId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating admin notification:', error);
      throw error;
    }
  }

  // Broadcast to all users
  static async broadcastToUsers(templateType, ...args) {
    try {
      const template = this.userTemplates[templateType];
      if (!template) {
        throw new Error(`Unknown notification template: ${templateType}`);
      }

      const users = await User.find({ isActive: true });
      const notifications = users.map(user => ({
        userId: user._id,
        audience: 'user',
        ...template(...args)
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`✅ Broadcast notification sent: ${templateType} to ${notifications.length} users`);
      }

      return notifications;
    } catch (error) {
      console.error('❌ Error broadcasting notification:', error);
      throw error;
    }
  }

  // Create custom notification
  static async createCustomUserNotification(userId, notificationData) {
    try {
      const notification = await Notification.create({
        userId,
        audience: 'user',
        ...notificationData
      });
      
      console.log(`✅ Custom notification created for user ${userId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating custom notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;