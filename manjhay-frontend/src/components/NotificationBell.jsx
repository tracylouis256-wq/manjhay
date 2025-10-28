import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, Trash2, ExternalLink, Wifi, WifiOff, RefreshCw, RotateCcw } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './ui/LoadingSpinner';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    isConnected,
    reconnect,
    fetchNotifications,
    reconnectAttempts
  } = useNotification();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Enhanced debugging
  useEffect(() => {
    console.log('🔔 [BELL] NotificationBell rendered - State:', {
      notificationsCount: notifications.length,
      unreadCount,
      loading,
      isConnected,
      isOpen,
      userRole: user?.role
    });
    
    // Debug notification details when dropdown opens
    if (isOpen && notifications.length > 0) {
      console.log('🔔 [BELL] Detailed notification analysis:');
      notifications.forEach((notification, index) => {
        console.log(`  ${index + 1}.`, {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          actionUrl: notification.action?.url,
          read: notification.read,
          hasAction: !!notification.action
        });
      });
    }
  }, [notifications, unreadCount, loading, isConnected, isOpen, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // FIXED: Better route mapping with fallbacks
  const getNotificationRoute = (notification) => {
    const { type, action } = notification;
    
    console.log('🔔 [BELL] getNotificationRoute called with:', { 
      type, 
      actionUrl: action?.url,
      userRole: user?.role 
    });
    
    // If no action URL, provide sensible defaults based on notification type
    if (!action?.url) {
      console.log('🔔 [BELL] No action URL, using type-based routing');
      
      if (type.includes('order')) {
        return user?.role === 'admin' ? '/admin/orders' : '/profile?tab=orders';
      }
      if (type.includes('payment')) {
        return '/profile?tab=orders';
      }
      if (type.includes('profile') || type.includes('user')) {
        return '/profile';
      }
      if (type.includes('product')) {
        return '/products';
      }
      // Default fallback
      return '/profile';
    }

    let route = action.url;
    
    console.log('🔔 [BELL] Original route from backend:', route);
    
    // Map backend URLs to frontend routes
    if (route.startsWith('/orders/')) {
      // Extract order ID for potential use
      const orderId = route.split('/orders/')[1];
      if (user?.role === 'admin') {
        route = '/admin/orders';
        console.log('🔔 [BELL] Admin order notification ->', route);
      } else {
        route = '/profile?tab=orders';
        console.log('🔔 [BELL] User order notification ->', route);
      }
    }
    else if (route.startsWith('/products/')) {
      route = '/products';
      console.log('🔔 [BELL] Product notification ->', route);
    }
    else if (route.startsWith('/admin/')) {
      if (user?.role !== 'admin') {
        console.log('🔔 [BELL] Non-admin user trying to access admin route, redirecting to profile');
        route = '/profile';
      } else {
        console.log('🔔 [BELL] Admin notification ->', route);
      }
    }
    else if (route.startsWith('/profile') || route.startsWith('/user/')) {
      route = '/profile';
      console.log('🔔 [BELL] Profile notification ->', route);
    }
    else {
      console.log('🔔 [BELL] Unknown route pattern, using as-is:', route);
    }
    
    console.log('🔔 [BELL] Final mapped route:', route);
    return route;
  };

  const handleNotificationClick = (notification) => {
    console.log('🔔 [BELL] === NOTIFICATION CLICK START ===');
    console.log('🔔 [BELL] Clicked notification:', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      actionUrl: notification.action?.url,
      read: notification.read
    });
    
    // Mark as read if unread
    if (!notification.read) {
      console.log('🔔 [BELL] Marking notification as read');
      markAsRead(notification._id);
    }
    
    // Get the mapped route
    const route = getNotificationRoute(notification);
    
    if (route) {
      console.log('🔔 [BELL] ✅ Navigating to:', route);
      navigate(route);
    } else {
      console.log('🔔 [BELL] ⚠️ No route determined, staying on current page');
    }
    
    console.log('🔔 [BELL] === NOTIFICATION CLICK END ===');
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    console.log('🔔 [BELL] Marking all as read');
    markAllAsRead();
  };

  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation();
    console.log('🔔 [BELL] Deleting notification:', notificationId);
    deleteNotification(notificationId);
  };

  const handleRefresh = () => {
    console.log('🔔 [BELL] Manually refreshing notifications');
    fetchNotifications();
  };

  const handleReconnect = () => {
    console.log('🔔 [BELL] Manually reconnecting WebSocket');
    reconnect();
  };

  const handleViewAllNotifications = () => {
    console.log('🔔 [BELL] Navigating to notifications page');
    navigate('/notifications');
    setIsOpen(false);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getNotificationIcon = (type) => {
    const iconClass = "w-4 h-4";
    
    if (type.includes('order')) return <CheckCircle className={`${iconClass} text-green-500`} />;
    if (type.includes('payment')) return <CheckCircle className={`${iconClass} text-blue-500`} />;
    if (type.includes('admin')) return <Bell className={`${iconClass} text-purple-500`} />;
    if (type.includes('welcome')) return <Bell className={`${iconClass} text-green-500`} />;
    if (type.includes('profile')) return <Bell className={`${iconClass} text-blue-500`} />;
    if (type.includes('password')) return <Bell className={`${iconClass} text-red-500`} />;
    if (type.includes('cart')) return <Bell className={`${iconClass} text-orange-500`} />;
    return <Bell className={`${iconClass} text-gray-500`} />;
  };

  if (!isAuthenticated) {
    console.log('🔔 [BELL] User not authenticated, hiding bell');
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          console.log('🔔 [BELL] === BELL CLICK ===');
          console.log('🔔 [BELL] Current state - isOpen:', isOpen, 'notifications:', notifications.length);
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          
          // Refresh notifications when opening
          if (newIsOpen) {
            console.log('🔔 [BELL] Opening dropdown, refreshing notifications');
            fetchNotifications();
          }
          console.log('🔔 [BELL] === BELL CLICK END ===');
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
        title={`${unreadCount} unread notifications - ${isConnected ? 'Connected' : 'Disconnected'}`}
      >
        <Bell size={20} className={isConnected ? 'text-green-600' : 'text-red-600'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {/* Connection Status Dot */}
        <span
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white ${
            isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
          }`}
          title={isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2 mt-1">
                  {isConnected ? (
                    <Wifi size={12} className="text-green-500" />
                  ) : (
                    <WifiOff size={12} className="text-red-500" />
                  )}
                  <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Live updates' : `Disconnected (${reconnectAttempts} attempts)`}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                {!isConnected && (
                  <button
                    onClick={handleReconnect}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Reconnect WebSocket"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                <button
                  onClick={handleRefresh}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                  title="Refresh notifications"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Mark all read
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-500 text-sm mt-2">Loading notifications...</p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  {isConnected ? 'You will see notifications here' : 'Connect to receive live updates'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-l-4 ${getPriorityColor(
                      notification.priority
                    )} ${!notification.read ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                            <div className="flex items-center space-x-2">
                              {notification.action && (
                                <ExternalLink size={12} className="text-gray-400" />
                              )}
                              <button
                                onClick={(e) => handleDeleteNotification(e, notification._id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Delete notification"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleViewAllNotifications}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;