const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
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

// Enhanced CORS configuration - MUST BE BEFORE ROUTES
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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
app.use('/api/users', userRoutes); // Changed from '/api/auth' to '/api/users'

// Health check route with WebSocket status
app.get('/api/health', (req, res) => {
  const wsStatus = global.wsService ? {
    connected: true,
    clients: global.wsService.getConnectionCount(),
    connectedUsers: global.wsService.getConnectedUsers()
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
    websocket: wsStatus,
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      users: '/api/users',
      notifications: '/api/notifications',
      websocket: 'ws://localhost:5000/ws'
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

  const stats = {
    connectedClients: global.wsService.getConnectionCount(),
    connectedUsers: global.wsService.getConnectedUsers(),
    service: 'WebSocket Service Active'
  };

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

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket test: http://localhost:${PORT}/api/websocket-test`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`📝 User Requests API: http://localhost:${PORT}/api/user-requests`);
  console.log(`👥 User Management API: http://localhost:${PORT}/api/users/admin/users`);
});

// Initialize WebSocket service with enhanced error handling
try {
  global.wsService = new WebSocketService(server);
  console.log('✅ WebSocket service initialized successfully');
  console.log(`📡 WebSocket server listening on ws://localhost:${PORT}/ws`);
} catch (error) {
  console.error('❌ WebSocket service failed to initialize:', error.message);
  console.error('🔧 WebSocket stack trace:', error.stack);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', err);
  console.log('🔧 Stack trace:', err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  if (global.wsService) {
    console.log('🔌 Closing WebSocket connections...');
    global.wsService.wss.close(() => {
      console.log('✅ WebSocket server closed');
    });
  }
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

// Handle process exit
process.on('exit', (code) => {
  console.log(`🔚 Process exiting with code: ${code}`);
});

// Export for testing
module.exports = server;