import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { user, isAuthenticated } = useAuth();

  // Refs to prevent multiple API calls
  const isFetchingNotificationsRef = useRef(false);
  const isFetchingUnreadCountRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 5000;

  // ✅ FIXED FOR RENDER.COM: Use environment variables
  const API_URL = import.meta.env?.VITE_API_URL || 'https://manjhay-backend.onrender.com';
  const WS_URL = import.meta.env?.VITE_WS_URL || 'wss://manjhay-backend.onrender.com';

  // ✅ FIXED: Get WebSocket URL for Render.com
  const getWebSocketUrl = (token) => {
    const wsUrl = `${WS_URL}/ws?token=${token}`;
    console.log('🔌 [WEBSOCKET] Connecting to:', wsUrl);
    return wsUrl;
  };

  // Set up axios base URL
  useEffect(() => {
    if (API_URL) {
      axios.defaults.baseURL = API_URL;
      console.log('🌐 [NOTIFICATION] Axios base URL set to:', API_URL);
    }
  }, [API_URL]);

  // Load notifications from localStorage on initial load
  useEffect(() => {
    const savedNotifications = localStorage.getItem('manjhay_notifications');
    const savedUnreadCount = localStorage.getItem('manjhay_unread_count');
    
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications);
        setNotifications(parsedNotifications);
        console.log('💾 [NOTIFICATION] Loaded notifications from localStorage:', parsedNotifications.length);
      } catch (error) {
        console.error('❌ Error parsing saved notifications:', error);
      }
    }
    if (savedUnreadCount) {
      try {
        const parsedCount = JSON.parse(savedUnreadCount);
        setUnreadCount(parsedCount);
        console.log('💾 [NOTIFICATION] Loaded unread count from localStorage:', parsedCount);
      } catch (error) {
        console.error('❌ Error parsing saved unread count:', error);
      }
    }
  }, []);

  // Save to localStorage when notifications change
  useEffect(() => {
    localStorage.setItem('manjhay_notifications', JSON.stringify(notifications));
    console.log('💾 [NOTIFICATION] Saved notifications to localStorage:', notifications.length);
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('manjhay_unread_count', JSON.stringify(unreadCount));
    console.log('💾 [NOTIFICATION] Saved unread count to localStorage:', unreadCount);
  }, [unreadCount]);

  // WebSocket connection - FIXED FOR RENDER.COM
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔌 [NOTIFICATION] User authenticated, connecting WebSocket to Render.com...');
      connectWebSocket();
    } else {
      console.log('🔌 [NOTIFICATION] User not authenticated, closing WebSocket...');
      if (ws) {
        ws.close();
        setWs(null);
        setIsConnected(false);
        setReconnectAttempts(0);
      }
    }

    return () => {
      if (ws) {
        console.log('🔌 [NOTIFICATION] Cleaning up WebSocket connection');
        ws.close();
      }
    };
  }, [isAuthenticated, user]);

  const connectWebSocket = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ [NOTIFICATION] No token available for WebSocket connection');
        return;
      }

      const wsUrl = getWebSocketUrl(token);
      
      console.log('🔌 [NOTIFICATION] Attempting WebSocket connection to Render.com:', wsUrl);
      
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('✅ [NOTIFICATION] WebSocket connected successfully to Render.com');
        setIsConnected(true);
        setWs(websocket);
        setReconnectAttempts(0);
        
        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        websocket._pingInterval = pingInterval;
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 [NOTIFICATION] WebSocket message received from Render.com:', message);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('❌ [NOTIFICATION] Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = (event) => {
        console.log('❌ [NOTIFICATION] WebSocket disconnected from Render.com:', event.code, event.reason);
        setIsConnected(false);
        setWs(null);
        
        if (websocket._pingInterval) {
          clearInterval(websocket._pingInterval);
        }

        // Attempt reconnection if it wasn't a normal closure
        if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const timeout = Math.min(RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts), 30000);
          console.log(`🔄 [NOTIFICATION] Attempting reconnect in ${timeout}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          setTimeout(() => {
            if (isAuthenticated) {
              setReconnectAttempts(prev => prev + 1);
              connectWebSocket();
            }
          }, timeout);
        }
      };

      websocket.onerror = (error) => {
        console.error('❌ [NOTIFICATION] WebSocket error with Render.com:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ [NOTIFICATION] WebSocket connection failed to Render.com:', error);
      // Fallback to polling if WebSocket fails
      startPolling();
    }
  }, [isAuthenticated, user, reconnectAttempts, API_URL]);

  const handleWebSocketMessage = (message) => {
    console.log('🔍 [NOTIFICATION] WebSocket message received from Render.com:', message);
    
    switch (message.type) {
      case 'new_notification':
        console.log('📢 [NOTIFICATION] New notification received from Render.com:', message.data);
        addNotification(message.data);
        showToastNotification(message.data);
        break;
      case 'connection_established':
        console.log('✅ [NOTIFICATION] WebSocket connection established with Render.com');
        toast.success('🔗 Connected to real-time notifications');
        break;
      case 'pong':
        console.log('🏓 [NOTIFICATION] Pong received - connection healthy with Render.com');
        break;
      case 'new_admin_notification':
        console.log('📢 [NOTIFICATION] New admin notification from Render.com:', message.data);
        break;
      default:
        console.log('❓ [NOTIFICATION] Unknown WebSocket message type from Render.com:', message.type);
    }
  };

  const startPolling = useCallback(() => {
    console.log('🔄 [NOTIFICATION] Starting polling fallback for notifications');
    // Poll for new notifications every 30 seconds if WebSocket fails
    const interval = setInterval(() => {
      if (isAuthenticated) {
        console.log('🔄 [NOTIFICATION] Polling for notifications from Render.com...');
        fetchUnreadCount();
        fetchNotifications(1, 5); // Fetch latest 5 notifications
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Fetch notifications from API with rate limiting protection
  const fetchNotifications = async (page = 1, limit = 20) => {
    if (!isAuthenticated) {
      console.log('⚠️ [NOTIFICATION] Not authenticated, skipping fetch');
      return;
    }

    // Prevent multiple simultaneous fetches
    if (isFetchingNotificationsRef.current) {
      console.log('🔄 [NOTIFICATION] Already fetching notifications, skipping...');
      return;
    }

    try {
      isFetchingNotificationsRef.current = true;
      console.log(`📡 [NOTIFICATION] Fetching notifications page ${page}, limit ${limit}`);
      setLoading(true);
      
      const response = await axios.get(`/api/notifications/user?page=${page}&limit=${limit}`);
      console.log('📡 [NOTIFICATION] Notifications fetched from Render.com:', response.data.data.length);
      
      if (page === 1) {
        setNotifications(response.data.data);
      } else {
        setNotifications(prev => [...prev, ...response.data.data]);
      }
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('⏰ [NOTIFICATION] Rate limited, will retry later');
      } else {
        console.error('❌ [NOTIFICATION] Error fetching notifications from Render.com:', error);
      }
    } finally {
      setLoading(false);
      isFetchingNotificationsRef.current = false;
    }
  };

  // Fetch unread count with rate limiting protection
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;

    // Prevent multiple simultaneous fetches
    if (isFetchingUnreadCountRef.current) {
      console.log('🔄 [NOTIFICATION] Already fetching unread count, skipping...');
      return;
    }

    try {
      isFetchingUnreadCountRef.current = true;
      console.log('📡 [NOTIFICATION] Fetching unread count from Render.com...');
      const response = await axios.get('/api/notifications/user/unread-count');
      console.log('📡 [NOTIFICATION] Unread count from Render.com:', response.data.data.count);
      setUnreadCount(response.data.data.count);
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('⏰ [NOTIFICATION] Rate limited for unread count, will retry later');
      } else {
        console.error('❌ [NOTIFICATION] Error fetching unread count from Render.com:', error);
      }
    } finally {
      isFetchingUnreadCountRef.current = false;
    }
  };

  // Add notification to state
  const addNotification = (notification) => {
    console.log('➕ [NOTIFICATION] Adding notification to state from Render.com:', notification);
    
    // Check if notification already exists to prevent duplicates
    const notificationExists = notifications.some(n => n._id === notification._id);
    if (notificationExists) {
      console.log('🔄 [NOTIFICATION] Notification already exists, skipping duplicate');
      return;
    }
    
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
      console.log('➕ [NOTIFICATION] Increased unread count to:', unreadCount + 1);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      console.log('📝 [NOTIFICATION] Marking notification as read on Render.com:', notificationId);
      await axios.post('/api/notifications/user/mark-read', { notificationId });
      
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      console.log('✅ [NOTIFICATION] Notification marked as read on Render.com');
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('⏰ [NOTIFICATION] Rate limited while marking as read');
        // Still update locally even if API call fails
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('❌ [NOTIFICATION] Error marking notification as read on Render.com:', error);
      }
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      console.log('📝 [NOTIFICATION] Marking all notifications as read on Render.com');
      await axios.post('/api/notifications/user/mark-all-read');
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
      console.log('✅ [NOTIFICATION] All notifications marked as read on Render.com');
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('⏰ [NOTIFICATION] Rate limited while marking all as read');
        // Still update locally even if API call fails
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      } else {
        console.error('❌ [NOTIFICATION] Error marking all notifications as read on Render.com:', error);
      }
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      console.log('🗑️ [NOTIFICATION] Deleting notification on Render.com:', notificationId);
      await axios.delete(`/api/notifications/user/${notificationId}`);
      
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      console.log('✅ [NOTIFICATION] Notification deleted on Render.com');
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('⏰ [NOTIFICATION] Rate limited while deleting notification');
        // Still update locally even if API call fails
        const notification = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        console.error('❌ [NOTIFICATION] Error deleting notification on Render.com:', error);
      }
    }
  };

  // Show toast notification
  const showToastNotification = (notification) => {
    console.log('🍞 [NOTIFICATION] Showing toast notification from Render.com:', notification);
    
    const toastConfig = {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      onClick: () => {
        if (notification.action?.url) {
          window.location.href = notification.action.url;
        }
      }
    };

    switch (notification.priority) {
      case 'high':
        toast.error(`🔴 ${notification.title}: ${notification.message}`, {
          ...toastConfig,
          autoClose: 8000
        });
        break;
      case 'medium':
        toast.warn(`🟡 ${notification.title}: ${notification.message}`, toastConfig);
        break;
      case 'low':
      default:
        toast.info(`🔵 ${notification.title}: ${notification.message}`, toastConfig);
        break;
    }
  };

  // Clear all notifications
  const clearAll = () => {
    console.log('🗑️ [NOTIFICATION] Clearing all notifications');
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('manjhay_notifications');
    localStorage.removeItem('manjhay_unread_count');
  };

  // Load initial data with protection against multiple calls
  useEffect(() => {
    if (isAuthenticated && !hasInitializedRef.current) {
      console.log('🔍 [NOTIFICATION] User authenticated, loading initial data from Render.com...');
      hasInitializedRef.current = true;
      
      // Add a small delay to prevent immediate API calls on app start
      const initializeTimeout = setTimeout(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, 2000);

      return () => clearTimeout(initializeTimeout);
    } else if (!isAuthenticated) {
      console.log('🔍 [NOTIFICATION] User not authenticated, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
      hasInitializedRef.current = false;
    }
  }, [isAuthenticated]);

  // Manual reconnect function
  const reconnect = () => {
    console.log('🔄 [NOTIFICATION] Manual reconnect requested to Render.com');
    setReconnectAttempts(0);
    if (ws) {
      ws.close();
    }
    connectWebSocket();
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    isConnected,
    reconnectAttempts,
    reconnect,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};