const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: function() {
      return this.audience === 'user' || this.audience === 'both';
    }
  },
  adminId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    required: function() {
      return this.audience === 'admin' || this.audience === 'both';
    }
  },
  type: {
    type: String,
    required: true,
    enum: [
      // User notifications
      'order_verified', 'order_shipped', 'order_delivered', 'order_cancelled',
      'payment_received', 'payment_verified', 'payment_rejected',
      'admin_contact', 'admin_contact_failed', 'welcome', 'cart_reminder',
      'new_products', 'profile_updated', 'password_changed', 'password_reset',
      'system', 'security_alert',
      // Admin notifications
      'new_order', 'payment_proof_uploaded', 'order_verification_required',
      'low_stock', 'out_of_stock', 'inventory_updated',
      'new_user', 'high_traffic', 'system_maintenance'
    ]
  },
  audience: {
    type: String,
    required: true,
    enum: ['user', 'admin', 'both'],
    default: 'user'
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  read: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  action: {
    type: {
      type: String,
      enum: ['order', 'product', 'user', 'inventory', 'system', 'profile', 'cart']
    },
    id: mongoose.Schema.ObjectId,
    url: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Notifications expire after 30 days
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ adminId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create user notification
notificationSchema.statics.createUserNotification = function(userId, notificationData) {
  return this.create({
    userId,
    audience: 'user',
    ...notificationData
  });
};

// Static method to create admin notification
notificationSchema.statics.createAdminNotification = function(adminId, notificationData) {
  return this.create({
    adminId,
    audience: 'admin',
    ...notificationData
  });
};

// Static method to create broadcast notification
notificationSchema.statics.createBroadcastNotification = function(notificationData) {
  return this.create({
    audience: 'both',
    ...notificationData
  });
};

module.exports = mongoose.model('Notification', notificationSchema);