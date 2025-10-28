const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const WebSocketService = require('./services/websocketService');
require('dotenv').config();

// Route files
const auth = require('./routes/auth');
const products = require('./routes/products');
const orders = require('./routes/orders');
const inventory = require('./routes/inventory');
const notifications = require('./routes/notifications');
const userRequests = require('./routes/userRequests');
const userRoutes = require('./routes/userRoutes');

// Connect to database
connectDB();

const app = express();

// Security headers
app.use(helmet());

// Enhanced CORS configuration - FIXED FOR RENDER.COM
const corsOptions = {
  origin: [
    'https://manjhay.vercel.app',
    'https://manjhay-git-main-manjhays-projects.vercel.app',
    'https://manjhay-2b1y0ptnf-manjhays-projects.vercel.app',
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-auth-token'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests globally
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/products', products);
app.use('/api/orders', orders);
app.use('/api/inventory', inventory);
app.use('/api/notifications', notifications);
app.use('/api/user-requests', userRequests);
app.use('/api/users', userRoutes);

// Health check route with WebSocket status
app.get('/api/health', (req, res) => {
  const wsStatus = global.wsService ? {
    connected: true,
    clients: global.wsService.getConnectionCount(),
    connectedUsers: global.wsService.getConnectedUsers(),
    connectionStats: global.wsService.getConnectionStats()
  } : {
    connected: false,
    clients: 0,
    connectedUsers: []
  };

  res.json({
    success: true,
    message: 'ManJhay API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    cors: {
      enabled: true,
      allowedOrigins: corsOptions.origin
    },
    websocket: {
      ...wsStatus,
      endpoint: '/ws',
      protocol: 'wss'
    },
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      users: '/api/users',
      notifications: '/api/notifications',
      websocket: '/ws'
    }
  });
});

// WebSocket test endpoint
app.get('/api/websocket-test', (req, res) => {
  if (!global.wsService) {
    return res.status(503).json({
      success: false,
      message: 'WebSocket service not available'
    });
  }

  const stats = global.wsService.getConnectionStats();

  res.json({
    success: true,
    message: 'WebSocket service is running',
    data: stats
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../manjhay-frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../manjhay-frontend/build', 'index.html'));
  });
}

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server explicitly for WebSocket
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🌐 CORS Allowed Origins: ${corsOptions.origin.join(', ')}`);
  console.log(`🔗 Health check: https://manjhay-backend.onrender.com/api/health`);
  console.log(`🔌 WebSocket test: https://manjhay-backend.onrender.com/api/websocket-test`);
  console.log(`📡 WebSocket endpoint: wss://manjhay-backend.onrender.com/ws`);
  console.log(`⚡ Server listening on: 0.0.0.0:${PORT}`);
});

// Initialize WebSocket service with the HTTP server
try {
  global.wsService = new WebSocketService(server);
  console.log('✅ WebSocket service initialized successfully');
  console.log(`📡 WebSocket server listening on path: /ws`);
} catch (error) {
  console.error('❌ WebSocket service failed to initialize:', error.message);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  if (global.wsService) {
    global.wsService.closeAllConnections();
  }
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

module.exports = server;