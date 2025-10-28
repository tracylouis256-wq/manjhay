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

// Security headers with WebSocket support
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https://manjhay-backend.onrender.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Enhanced CORS configuration for Render.com
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://manjhay.vercel.app',
      'https://manjhay-git-main-manjhays-projects.vercel.app',
      'https://manjhay-2b1y0ptnf-manjhays-projects.vercel.app',
      'http://localhost:3000',
      'https://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps, postman, or websocket clients)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-auth-token', 'Origin', 'Accept', 'Upgrade', 'Connection'],
  exposedHeaders: ['Content-Length', 'X-WebSocket-Accept'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests globally
app.options('*', cors(corsOptions));

// Rate limiting with WebSocket considerations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Allow more requests for WebSocket connections
    return req.headers.upgrade === 'websocket' ? 500 : 100;
  },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for WebSocket upgrade requests
    return req.headers.upgrade === 'websocket';
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

// Enhanced health check route with WebSocket status
app.get('/api/health', (req, res) => {
  const wsStatus = global.wsService ? {
    connected: true,
    clients: global.wsService.getConnectionCount(),
    connectedUsers: global.wsService.getConnectedUsers(),
    connectionStats: global.wsService.getConnectionStats(),
    server: 'render.com'
  } : {
    connected: false,
    clients: 0,
    connectedUsers: [],
    server: 'render.com'
  };

  res.json({
    success: true,
    message: 'ManJhay API is running on Render.com',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    cors: {
      enabled: true,
      allowedOrigins: corsOptions.origin
    },
    websocket: {
      ...wsStatus,
      endpoint: '/ws',
      protocol: 'wss',
      handshake: 'manual_upgrade',
      authentication: 'token_query_param'
    },
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      users: '/api/users',
      notifications: '/api/notifications',
      websocket: 'wss://manjhay-backend.onrender.com/ws'
    },
    server: {
      platform: 'render.com',
      node_version: process.version,
      memory: process.memoryUsage()
    }
  });
});

// Enhanced WebSocket test endpoint
app.get('/api/websocket-test', (req, res) => {
  if (!global.wsService) {
    return res.status(503).json({
      success: false,
      message: 'WebSocket service not available',
      fix: 'Check WebSocket service initialization in server.js'
    });
  }

  const stats = global.wsService.getConnectionStats();

  res.json({
    success: true,
    message: 'WebSocket service is running on Render.com',
    data: stats,
    connection_url: 'wss://manjhay-backend.onrender.com/ws?token=YOUR_JWT_TOKEN',
    test_command: "wscat -c 'wss://manjhay-backend.onrender.com/ws?token=YOUR_JWT_TOKEN'"
  });
});

// WebSocket connection test endpoint
app.get('/api/websocket-connection-test', async (req, res) => {
  try {
    const WebSocket = require('ws');
    const token = req.query.token;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required for WebSocket connection test'
      });
    }

    const wsUrl = `ws://localhost:${process.env.PORT || 5000}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    
    const connectionPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve({
          success: true,
          message: 'WebSocket connection successful'
        });
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    const result = await connectionPromise;
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'WebSocket connection test failed',
      error: error.message
    });
  }
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
    message: `Route ${req.originalUrl} not found`,
    available_endpoints: [
      '/api/health',
      '/api/websocket-test',
      '/api/websocket-connection-test',
      '/api/auth',
      '/api/products'
    ]
  });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server explicitly for WebSocket
const server = http.createServer(app);

// Initialize WebSocket service BEFORE starting the server
try {
  console.log('🔄 Initializing WebSocket service for Render.com...');
  global.wsService = new WebSocketService(server);
  console.log('✅ WebSocket service initialized successfully');
} catch (error) {
  console.error('❌ WebSocket service failed to initialize:', error.message);
  process.exit(1);
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🌐 CORS Allowed Origins: ${corsOptions.origin.join(', ')}`);
  console.log(`🔗 Health check: https://manjhay-backend.onrender.com/api/health`);
  console.log(`🔌 WebSocket test: https://manjhay-backend.onrender.com/api/websocket-test`);
  console.log(`📡 WebSocket endpoint: wss://manjhay-backend.onrender.com/ws`);
  console.log(`⚡ Server listening on: 0.0.0.0:${PORT}`);
  console.log(`🔒 WebSocket Authentication: Token-based via query parameter`);
});

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