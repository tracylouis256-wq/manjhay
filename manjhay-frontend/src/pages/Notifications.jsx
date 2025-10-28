import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCircle, Trash2, ExternalLink, Filter, Search, Wifi, WifiOff, RotateCcw, ChevronLeft, MoreVertical } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Notifications = () => {
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  // Use localStorage to persist fetch state across refreshes
  const [hasFetched, setHasFetched] = useState(() => {
    return localStorage.getItem('notifications_fetched') === 'true';
  });

  const fetchTimeoutRef = useRef(null);

  // Stable fetch function using useCallback
  const stableFetchNotifications = useCallback(() => {
    console.log('🔔 [NOTIFICATIONS PAGE] Fetching notifications...');
    return fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    // Only fetch if we haven't fetched yet OR if notifications array is empty
    if (!hasFetched || notifications.length === 0) {
      console.log('🔔 [NOTIFICATIONS PAGE] Initial fetch - hasFetched:', hasFetched, 'notifications count:', notifications.length);
      
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Use timeout to prevent multiple rapid calls
      fetchTimeoutRef.current = setTimeout(() => {
        stableFetchNotifications().then(() => {
          // Mark as fetched only after successful fetch
          setHasFetched(true);
          localStorage.setItem('notifications_fetched', 'true');
          console.log('🔔 [NOTIFICATIONS PAGE] Marked as fetched');
        });
      }, 300);
    } else {
      console.log('🔔 [NOTIFICATIONS PAGE] Skipping fetch - already loaded', notifications.length, 'notifications');
    }

    // Cleanup function
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [hasFetched, notifications.length, stableFetchNotifications]);

  // Reset fetch state when user changes or component unmounts
  useEffect(() => {
    return () => {
      // Don't clear localStorage here as it persists across refreshes
      // We'll clear it when the user logs out or when explicitly needed
    };
  }, []);

  // Reset fetch state when user changes
  useEffect(() => {
    if (user?.id) {
      // Reset fetch state for new user
      setHasFetched(false);
      localStorage.removeItem('notifications_fetched');
    }
  }, [user?.id]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.type.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.type.includes('order')) {
      if (user?.role === 'admin') {
        navigate('/admin/order-management');
      } else {
        navigate('/profile', { state: { activeTab: 'orders' } });
      }
    } else if (notification.type.includes('profile')) {
      navigate('/profile');
    } else {
      navigate('/');
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setSelectedNotifications(new Set());
    setShowActions(false);
  };

  const handleDeleteSelected = () => {
    selectedNotifications.forEach(id => {
      deleteNotification(id);
    });
    setSelectedNotifications(new Set());
    setShowActions(false);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      const allIds = new Set(filteredNotifications.map(n => n._id));
      setSelectedNotifications(allIds);
    }
  };

  const handleSelectNotification = (notificationId, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleRefresh = () => {
    console.log('🔔 [NOTIFICATIONS PAGE] Manual refresh requested');
    // Clear the fetch state to force a fresh fetch
    setHasFetched(false);
    localStorage.removeItem('notifications_fetched');
    stableFetchNotifications().then(() => {
      setHasFetched(true);
      localStorage.setItem('notifications_fetched', 'true');
    });
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notificationTime.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const getNotificationIcon = (type) => {
    const iconClass = "w-5 h-5";
    
    if (type.includes('order')) return <CheckCircle className={`${iconClass} text-green-500`} />;
    if (type.includes('payment')) return <CheckCircle className={`${iconClass} text-blue-500`} />;
    if (type.includes('admin')) return <Bell className={`${iconClass} text-purple-500`} />;
    if (type.includes('welcome')) return <Bell className={`${iconClass} text-green-500`} />;
    if (type.includes('profile')) return <Bell className={`${iconClass} text-blue-500`} />;
    return <Bell className={`${iconClass} text-gray-500`} />;
  };

  // Mobile-optimized header
  const MobileHeader = () => (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <Bell size={20} className="text-primary-600" />
            <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-6 text-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi size={14} className="text-green-500" />
          ) : (
            <WifiOff size={14} className="text-red-500" />
          )}
          <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Live updates' : `Offline (${reconnectAttempts})`}
          </span>
          {!isConnected && (
            <button
              onClick={reconnect}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1"
            >
              <RotateCcw size={12} />
              <span>Retry</span>
            </button>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Quick Actions Dropdown */}
      {showActions && (
        <div className="absolute top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-20">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark all as read
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {showFilters ? 'Hide filters' : 'Show filters'}
          </button>
        </div>
      )}
    </div>
  );

  // Mobile Search and Filters
  const MobileSearchFilters = () => (
    <div className="bg-white border-b border-gray-200 p-4 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-shrink-0 px-4 py-2 text-sm rounded-full transition-colors ${
              filter === 'all' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-shrink-0 px-4 py-2 text-sm rounded-full transition-colors ${
              filter === 'unread' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`flex-shrink-0 px-4 py-2 text-sm rounded-full transition-colors ${
              filter === 'read' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Read
          </button>
        </div>
      )}
    </div>
  );

  // Mobile Notification Item
  const MobileNotificationItem = ({ notification }) => (
    <div
      className={`bg-white border-b border-gray-100 p-4 cursor-pointer transition-all duration-200 border-l-4 ${getPriorityColor(
        notification.priority
      )} ${!notification.read ? 'bg-blue-50' : ''}`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start space-x-3">
        {/* Notification Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900 flex-1">
                  {notification.title}
                </h4>
                {!notification.read && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {notification.message}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatTime(notification.createdAt)}
                </span>
                {notification.action && (
                  <ExternalLink size={12} className="text-gray-400" />
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 ml-2">
              <input
                type="checkbox"
                checked={selectedNotifications.has(notification._id)}
                onChange={(e) => handleSelectNotification(notification._id, e)}
                onClick={(e) => e.stopPropagation()}
                className="text-primary-600 focus:ring-primary-500"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification._id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Delete notification"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Bulk Actions Bar
  const BulkActionsBar = () => (
    selectedNotifications.size > 0 && (
      <div className="fixed bottom-0 left-0 right-0 bg-primary-600 text-white p-4 z-20">
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {selectedNotifications.size} selected
          </span>
          <div className="flex space-x-3">
            <button
              onClick={handleSelectAll}
              className="text-sm hover:text-primary-200"
            >
              {selectedNotifications.size === filteredNotifications.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleDeleteSelected}
              className="text-sm hover:text-red-200 flex items-center space-x-1"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Mobile Search and Filters */}
      <MobileSearchFilters />

      {/* Notifications List */}
      <div className="pb-20">
        {loading && !hasFetched ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-500 text-sm mt-2">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'No matches' : 'No notifications yet'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {searchTerm || filter !== 'all' 
                ? 'Try changing your search or filters'
                : "You'll see important updates about your orders and account here."
              }
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Clear filters
              </button>
            )}
            {!isConnected && notifications.length === 0 && (
              <button
                onClick={reconnect}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm mt-2"
              >
                <RotateCcw size={16} className="mr-2" />
                Reconnect
              </button>
            )}
          </div>
        ) : (
          <div>
            {filteredNotifications.map((notification) => (
              <MobileNotificationItem 
                key={notification._id} 
                notification={notification} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar />
    </div>
  );
};

export default Notifications;