const NotificationService = require('../services/notificationService');

class NotificationTriggers {
  
  // User registration
  static async onUserRegister(user) {
    try {
      // Send welcome notification to user
      const welcomeNotification = await NotificationService.createUserNotification(user._id, 'welcome');
      
      // Notify admins
      await NotificationService.createAdminNotification('new_user', user._id, user.name);
      
      // Send real-time update via WebSocket
      if (global.wsService) {
        global.wsService.sendNotification(user._id.toString(), welcomeNotification);
      }
      
      console.log(`✅ Welcome notification sent to user: ${user._id}`);
    } catch (error) {
      console.error('❌ Error in onUserRegister notification:', error);
    }
  }

  // Order placed
  static async onOrderPlaced(order, user) {
    try {
      // Notify admins about new order
      await NotificationService.createAdminNotification('new_order', order._id, user.name);
      
      // Notify user about payment proof requirement
      const userNotification = await NotificationService.createUserNotification(
        user._id, 
        'payment_received', 
        order._id
      );

      // Send real-time update
      if (global.wsService) {
        global.wsService.sendNotification(user._id.toString(), userNotification);
      }

      console.log(`✅ Order placement notifications sent for order: ${order._id}`);
    } catch (error) {
      console.error('❌ Error in onOrderPlaced notification:', error);
    }
  }

  // Payment proof uploaded
  static async onPaymentProofUploaded(order, user) {
    try {
      await NotificationService.createAdminNotification(
        'payment_proof_uploaded', 
        order._id, 
        user.name
      );

      await NotificationService.createAdminNotification(
        'order_verification_required', 
        order._id, 
        user.name
      );

      console.log(`✅ Payment proof notifications sent for order: ${order._id}`);
    } catch (error) {
      console.error('❌ Error in onPaymentProofUploaded notification:', error);
    }
  }

  // Order status updated
  static async onOrderStatusUpdated(order, user, oldStatus, newStatus) {
    try {
      const statusNotifications = {
        'verified': 'order_verified',
        'shipped': 'order_shipped', 
        'delivered': 'order_delivered',
        'cancelled': 'order_cancelled'
      };

      if (statusNotifications[newStatus]) {
        const notification = await NotificationService.createUserNotification(
          user._id,
          statusNotifications[newStatus],
          order._id,
          order.cancellationReason
        );
        
        // Send real-time update
        if (global.wsService) {
          global.wsService.sendNotification(user._id.toString(), notification);
        }

        console.log(`✅ Order status notification sent: ${newStatus} for order: ${order._id}`);
      }

    } catch (error) {
      console.error('❌ Error in onOrderStatusUpdated notification:', error);
    }
  }

  // Profile updated
  static async onProfileUpdated(user) {
    try {
      const notification = await NotificationService.createUserNotification(
        user._id,
        'profile_updated'
      );
      
      // Send real-time update
      if (global.wsService) {
        global.wsService.sendNotification(user._id.toString(), notification);
      }

      console.log(`✅ Profile update notification sent to user: ${user._id}`);
    } catch (error) {
      console.error('❌ Error in onProfileUpdated notification:', error);
    }
  }

  // Cart reminder (only if cart has items)
  static async sendCartReminder(user, cartItems) {
    try {
      if (cartItems && cartItems.length > 0) {
        const notification = await NotificationService.createUserNotification(
          user._id,
          'cart_reminder',
          cartItems.length
        );
        
        // Send real-time update
        if (global.wsService) {
          global.wsService.sendNotification(user._id.toString(), notification);
        }

        console.log(`✅ Cart reminder sent to user: ${user._id} with ${cartItems.length} items`);
      }
    } catch (error) {
      console.error('❌ Error in sendCartReminder:', error);
    }
  }

  // Password changed
  static async onPasswordChanged(user) {
    try {
      const notification = await NotificationService.createUserNotification(
        user._id,
        'password_changed'
      );
      
      // Send real-time update
      if (global.wsService) {
        global.wsService.sendNotification(user._id.toString(), notification);
      }

      console.log(`✅ Password change notification sent to user: ${user._id}`);
    } catch (error) {
      console.error('❌ Error in onPasswordChanged notification:', error);
    }
  }

  // Password reset
  static async onPasswordReset(user) {
    try {
      const notification = await NotificationService.createUserNotification(
        user._id,
        'password_reset'
      );
      
      // Send real-time update
      if (global.wsService) {
        global.wsService.sendNotification(user._id.toString(), notification);
      }

      console.log(`✅ Password reset notification sent to user: ${user._id}`);
    } catch (error) {
      console.error('❌ Error in onPasswordReset notification:', error);
    }
  }
}

module.exports = NotificationTriggers;