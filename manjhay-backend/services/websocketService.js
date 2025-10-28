const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

class WebSocketService {
  constructor(server) {
    try {
      console.log('🔄 Initializing WebSocket server for Render.com...');
      
      // WebSocket server with PROPER CORS verification for Render.com
      this.wss = new WebSocket.Server({ 
        server,
        path: '/ws',
        verifyClient: (info, callback) => {
          const allowedOrigins = [
            'https://manjhay.vercel.app',
            'https://manjhay-git-main-manjhays-projects.vercel.app',
            'https://manjhay-2b1y0ptnf-manjhays-projects.vercel.app',
            'http://localhost:3000',
            'https://localhost:3000'
          ];
          
          const requestOrigin = info.origin || info.req.headers.origin;
          console.log(`🔌 WebSocket connection attempt from origin: ${requestOrigin}`);
          console.log(`📍 Request URL: ${info.req.url}`);
          
          // Allow connections from allowed origins or if origin is undefined (can happen with some WebSocket clients)
          if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
            console.log('✅ WebSocket CORS allowed for origin:', requestOrigin || 'undefined (direct connection)');
            callback(true);
          } else {
            console.log('❌ WebSocket CORS blocked for origin:', requestOrigin);
            callback(false, 403, 'Origin not allowed');
          }
        }
      });
      
      this.clients = new Map();
      this.userRoles = new Map();
      
      this.wss.on('connection', this.handleConnection.bind(this));
      this.wss.on('error', this.handleServerError.bind(this));
      this.wss.on('listening', () => {
        console.log('✅ WebSocket server listening on path /ws');
      });
      
      console.log('✅ WebSocket server created successfully for Render.com');
    } catch (error) {
      console.error('❌ Failed to create WebSocket server:', error);
      throw error;
    }
  }

  async handleConnection(ws, req) {
    let user = null;
    let userId = null;
    
    try {
      console.log('🔌 New WebSocket connection attempt from Render.com');
      console.log('📍 Request URL:', req.url);
      console.log('🌐 Origin:', req.headers.origin);
      console.log('📡 Remote Address:', req.socket.remoteAddress);

      // Extract token from query string - FIXED FOR RENDER.COM
      const url = new URL(req.url, `https://${req.headers.host}`);
      const token = url.searchParams.get('token');

      console.log('🔑 Token extracted:', token ? 'Yes' : 'No');
      
      if (!token) {
        console.log('❌ No token provided for WebSocket connection');
        ws.close(1008, 'Authentication token required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      
      console.log('👤 User ID from token:', userId);

      // Find user in database
      user = await User.findById(userId);
      if (!user) {
        user = await Admin.findById(userId);
      }

      if (!user) {
        console.log('❌ User not found for ID:', userId);
        ws.close(1008, 'User not found');
        return;
      }

      if (!user.isActive) {
        console.log('❌ Inactive user attempted connection:', userId);
        ws.close(1008, 'User account is inactive');
        return;
      }

      // Close existing connection if user is already connected
      if (this.clients.has(userId.toString())) {
        console.log('🔄 Closing existing connection for user:', userId);
        const existingWs = this.clients.get(userId.toString());
        if (existingWs.readyState === WebSocket.OPEN) {
          existingWs.close(1000, 'New connection established');
        }
        this.clients.delete(userId.toString());
        this.userRoles.delete(userId.toString());
      }

      // Store connection and user info
      this.clients.set(userId.toString(), ws);
      this.userRoles.set(userId.toString(), user.role || 'user');
      
      console.log(`✅ WebSocket connected: ${userId} (${user.role || 'user'})`);
      console.log(`📊 Total connections: ${this.clients.size}`);

      // Send connection confirmation
      this.sendToUser(userId.toString(), {
        type: 'connection_established',
        message: 'WebSocket connection established successfully on Render.com',
        userId: userId.toString(),
        userRole: user.role || 'user',
        timestamp: new Date().toISOString(),
        connectionId: this.generateConnectionId(),
        server: 'render.com'
      });

      // Set up message handler
      ws.on('message', (data) => {
        this.handleMessage(user, data);
      });

      // Set up close handler
      ws.on('close', (code, reason) => {
        this.handleDisconnection(userId, code, reason);
      });

      // Set up error handler
      ws.on('error', (error) => {
        this.handleConnectionError(userId, error);
      });

      // Set up heartbeat for connection health
      this.setupHeartbeat(ws, userId);

    } catch (error) {
      console.error('❌ WebSocket connection error:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        ws.close(1008, 'Invalid authentication token');
      } else if (error.name === 'TokenExpiredError') {
        ws.close(1008, 'Authentication token expired');
      } else {
        console.error('🔧 WebSocket error stack:', error.stack);
        ws.close(1011, 'Internal server error during authentication');
      }
    }
  }

  handleMessage(user, data) {
    try {
      const message = JSON.parse(data);
      console.log(`📨 Message from ${user._id}:`, message.type);

      switch (message.type) {
        case 'ping':
          this.sendToUser(user._id.toString(), { 
            type: 'pong',
            timestamp: new Date().toISOString(),
            server: 'render.com'
          });
          break;
          
        case 'subscribe':
          this.handleSubscription(user, message);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscription(user, message);
          break;
          
        default:
          console.log(`❓ Unknown message type from ${user._id}:`, message.type);
          this.sendToUser(user._id.toString(), {
            type: 'error',
            message: `Unknown message type: ${message.type}`
          });
      }
    } catch (error) {
      console.error(`❌ Error processing message from ${user._id}:`, error);
      this.sendToUser(user._id.toString(), {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  handleSubscription(user, message) {
    const { channel } = message;
    console.log(`📡 User ${user._id} subscribed to: ${channel}`);
    
    this.sendToUser(user._id.toString(), {
      type: 'subscription_confirmed',
      channel: channel,
      message: `Subscribed to ${channel} successfully`,
      server: 'render.com'
    });
  }

  handleUnsubscription(user, message) {
    const { channel } = message;
    console.log(`📡 User ${user._id} unsubscribed from: ${channel}`);
    
    this.sendToUser(user._id.toString(), {
      type: 'unsubscription_confirmed',
      channel: channel,
      message: `Unsubscribed from ${channel} successfully`,
      server: 'render.com'
    });
  }

  handleDisconnection(userId, code, reason) {
    if (userId) {
      this.clients.delete(userId.toString());
      this.userRoles.delete(userId.toString());
      console.log(`❌ WebSocket disconnected: ${userId} (Code: ${code}, Reason: ${reason || 'No reason'})`);
      console.log(`📊 Remaining connections: ${this.clients.size}`);
    } else {
      console.log(`❌ WebSocket disconnected: Unknown user (Code: ${code})`);
    }
  }

  handleConnectionError(userId, error) {
    console.error(`❌ WebSocket error for ${userId || 'unknown user'}:`, error);
    if (userId) {
      this.clients.delete(userId.toString());
      this.userRoles.delete(userId.toString());
    }
  }

  handleServerError(error) {
    console.error('❌ WebSocket server error:', error);
  }

  setupHeartbeat(ws, userId) {
    let isAlive = true;
    let heartbeatInterval = null;
    
    ws.on('pong', () => {
      isAlive = true;
      console.log(`💓 Heartbeat received from user: ${userId}`);
    });

    heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        if (!isAlive) {
          console.log(`💔 Heartbeat failed for user ${userId}, closing connection`);
          ws.terminate();
          clearInterval(heartbeatInterval);
          return;
        }
        
        isAlive = false;
        ws.ping();
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    ws.on('close', () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    });
  }

  // Send message to specific user
  sendToUser(userId, message) {
    const ws = this.clients.get(userId.toString());
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const messageWithTimestamp = {
          ...message,
          timestamp: new Date().toISOString(),
          messageId: this.generateConnectionId(),
          server: 'render.com'
        };
        ws.send(JSON.stringify(messageWithTimestamp));
        console.log(`📤 Message sent to user ${userId}:`, message.type);
        return true;
      } catch (error) {
        console.error(`❌ Error sending message to user ${userId}:`, error);
        this.clients.delete(userId.toString());
        this.userRoles.delete(userId.toString());
        return false;
      }
    } else {
      console.log(`⚠️ User ${userId} not connected or WebSocket not open`);
      return false;
    }
  }

  // Send notification to user
  sendNotification(userId, notification) {
    console.log(`📢 [WEBSOCKET] Sending notification to user ${userId}:`, {
      title: notification.title,
      type: notification.type,
      id: notification._id
    });
    
    const success = this.sendToUser(userId.toString(), {
      type: 'new_notification',
      data: notification,
      server: 'render.com'
    });
    
    if (!success) {
      console.log(`💤 Notification queued for offline user: ${userId}`);
    }
    
    return success;
  }

  // Send notification to all admins
  sendAdminNotification(notification) {
    let adminCount = 0;
    this.userRoles.forEach((role, userId) => {
      if (role === 'admin' || role === 'superadmin') {
        if (this.sendToUser(userId, {
          type: 'new_admin_notification',
          data: notification,
          server: 'render.com'
        })) {
          adminCount++;
        }
      }
    });
    console.log(`📨 Admin notification sent to ${adminCount} admin users`);
    return adminCount;
  }

  // Broadcast to all connected users
  broadcast(message) {
    let sentCount = 0;
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({
            ...message,
            timestamp: new Date().toISOString(),
            broadcast: true,
            server: 'render.com'
          }));
          sentCount++;
        } catch (error) {
          console.error(`❌ Error broadcasting to user ${userId}:`, error);
        }
      }
    });
    console.log(`📢 Broadcast message sent to ${sentCount} users`);
    return sentCount;
  }

  // Get connection count
  getConnectionCount() {
    return this.clients.size;
  }

  // Get connected users
  getConnectedUsers() {
    return Array.from(this.clients.keys());
  }

  // Get connection stats
  getConnectionStats() {
    const roles = {};
    this.userRoles.forEach(role => {
      roles[role] = (roles[role] || 0) + 1;
    });

    return {
      totalConnections: this.clients.size,
      roles: roles,
      connectedUsers: this.getConnectedUsers(),
      serverTime: new Date().toISOString(),
      server: 'render.com'
    };
  }

  // Generate unique connection ID
  generateConnectionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Close all connections gracefully
  closeAllConnections() {
    console.log('🔌 Closing all WebSocket connections...');
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Server shutting down');
      }
    });
    this.clients.clear();
    this.userRoles.clear();
    console.log('✅ All WebSocket connections closed');
  }

  // Close WebSocket server
  close() {
    this.closeAllConnections();
    this.wss.close();
    console.log('✅ WebSocket server closed');
  }
}

module.exports = WebSocketService;