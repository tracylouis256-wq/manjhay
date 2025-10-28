const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

class WebSocketService {
  constructor(server) {
    try {
      this.wss = new WebSocket.Server({ 
        server,
        path: '/ws',
        // Enhanced client verification
        verifyClient: (info, callback) => {
          console.log(`🔌 WebSocket connection attempt from: ${info.origin}`);
          callback(true); // Accept all connections for now
        }
      });
      
      this.clients = new Map(); // userId -> WebSocket connection
      this.userRoles = new Map(); // userId -> role
      
      this.wss.on('connection', this.handleConnection.bind(this));
      this.wss.on('error', this.handleServerError.bind(this));
      
      console.log('✅ WebSocket server created successfully');
    } catch (error) {
      console.error('❌ Failed to create WebSocket server:', error);
      throw error;
    }
  }

  async handleConnection(ws, req) {
    let user = null;
    
    try {
      console.log('🔌 New WebSocket connection attempt from:', req.socket.remoteAddress);

      // Extract token from query string
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        console.log('❌ No token provided for WebSocket connection');
        ws.close(1008, 'Authentication token required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user in database
      user = await User.findById(decoded.id);
      if (!user) {
        user = await Admin.findById(decoded.id);
      }

      if (!user) {
        console.log('❌ User not found for WebSocket connection');
        ws.close(1008, 'User not found');
        return;
      }

      if (!user.isActive) {
        console.log('❌ Inactive user attempted WebSocket connection:', user._id);
        ws.close(1008, 'User account is inactive');
        return;
      }

      // Store connection and user info
      this.clients.set(user._id.toString(), ws);
      this.userRoles.set(user._id.toString(), user.role || 'user');
      
      console.log(`✅ WebSocket connected: ${user._id} (${user.role || 'user'}) - Total connections: ${this.clients.size}`);

      // Send connection confirmation
      this.sendToUser(user._id.toString(), {
        type: 'connection_established',
        message: 'WebSocket connection established successfully',
        userId: user._id.toString(),
        userRole: user.role || 'user',
        timestamp: new Date().toISOString(),
        connectionId: this.generateConnectionId()
      });

      // Set up message handler
      ws.on('message', (data) => {
        this.handleMessage(user, data);
      });

      // Set up close handler
      ws.on('close', (code, reason) => {
        this.handleDisconnection(user, code, reason);
      });

      // Set up error handler
      ws.on('error', (error) => {
        this.handleConnectionError(user, error);
      });

      // Set up heartbeat for connection health
      this.setupHeartbeat(ws, user);

    } catch (error) {
      console.error('❌ WebSocket connection error:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        ws.close(1008, 'Invalid authentication token');
      } else if (error.name === 'TokenExpiredError') {
        ws.close(1008, 'Authentication token expired');
      } else {
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
            timestamp: new Date().toISOString()
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
      message: `Subscribed to ${channel} successfully`
    });
  }

  handleUnsubscription(user, message) {
    const { channel } = message;
    console.log(`📡 User ${user._id} unsubscribed from: ${channel}`);
    
    this.sendToUser(user._id.toString(), {
      type: 'unsubscription_confirmed',
      channel: channel,
      message: `Unsubscribed from ${channel} successfully`
    });
  }

  handleDisconnection(user, code, reason) {
    if (user) {
      this.clients.delete(user._id.toString());
      this.userRoles.delete(user._id.toString());
      console.log(`❌ WebSocket disconnected: ${user._id} (Code: ${code}, Reason: ${reason || 'No reason'}) - Remaining connections: ${this.clients.size}`);
    } else {
      console.log(`❌ WebSocket disconnected: Unknown user (Code: ${code})`);
    }
  }

  handleConnectionError(user, error) {
    console.error(`❌ WebSocket error for ${user ? user._id : 'unknown user'}:`, error);
    if (user) {
      this.clients.delete(user._id.toString());
      this.userRoles.delete(user._id.toString());
    }
  }

  handleServerError(error) {
    console.error('❌ WebSocket server error:', error);
  }

  setupHeartbeat(ws, user) {
    let isAlive = true;
    
    ws.on('pong', () => {
      isAlive = true;
    });

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        if (!isAlive) {
          console.log(`💔 Heartbeat failed for user ${user._id}, closing connection`);
          ws.terminate();
          return;
        }
        
        isAlive = false;
        ws.ping();
      } else {
        clearInterval(interval);
      }
    }, 30000); // Check every 30 seconds

    ws.on('close', () => {
      clearInterval(interval);
    });
  }

  // Send message to specific user
  sendToUser(userId, message) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const messageWithTimestamp = {
          ...message,
          timestamp: new Date().toISOString()
        };
        ws.send(JSON.stringify(messageWithTimestamp));
        console.log(`📨 Message sent to user ${userId}:`, message.type);
      } catch (error) {
        console.error(`❌ Error sending message to user ${userId}:`, error);
        this.clients.delete(userId);
        this.userRoles.delete(userId);
      }
    } else {
      console.log(`⚠️ User ${userId} not connected or WebSocket not open`);
    }
  }

  // Send notification to user
  sendNotification(userId, notification) {
    console.log(`📢 [WEBSOCKET] Sending notification to user ${userId}:`, {
      title: notification.title,
      type: notification.type,
      id: notification._id
    });
    
    this.sendToUser(userId, {
      type: 'new_notification',
      data: notification
    });
  }

  // Send notification to all admins
  sendAdminNotification(notification) {
    let adminCount = 0;
    this.userRoles.forEach((role, userId) => {
      if (role === 'admin' || role === 'superadmin') {
        this.sendToUser(userId, {
          type: 'new_admin_notification',
          data: notification
        });
        adminCount++;
      }
    });
    console.log(`📨 Admin notification sent to ${adminCount} admin users`);
  }

  // Broadcast to all connected users
  broadcast(message) {
    let sentCount = 0;
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({
            ...message,
            timestamp: new Date().toISOString()
          }));
          sentCount++;
        } catch (error) {
          console.error(`❌ Error broadcasting to user ${userId}:`, error);
        }
      }
    });
    console.log(`📢 Broadcast message sent to ${sentCount} users`);
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
      connectedUsers: this.getConnectedUsers()
    };
  }

  // Generate unique connection ID
  generateConnectionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Close all connections gracefully
  closeAllConnections() {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Server shutting down');
      }
    });
    this.clients.clear();
    this.userRoles.clear();
    console.log('🔌 All WebSocket connections closed');
  }
}

module.exports = WebSocketService;