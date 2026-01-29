require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration - allow frontend and any origin in development
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'http://localhost:5173', // Vite default
  'http://localhost:3000',
  'http://localhost:8080'
];

// Add all .vercel.app domains in production
const isVercelDomain = (origin) => {
  return origin && (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.com'));
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check whitelist or Vercel domains
    if (allowedOrigins.includes(origin) || isVercelDomain(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meditatva';

// Health check (needs to work even if DB is not ready)
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isConnected = dbState === 1;
  
  res.status(isConnected ? 200 : 503).json({ 
    status: isConnected ? 'ok' : 'starting',
    message: isConnected ? 'MediTatva API is running' : 'Database connecting...',
    database: isConnected ? 'connected' : 'disconnected',
    ready: isConnected
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MediTatva Pharmacy Management API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      medicines: '/api/medicines',
      medicinesSearch: '/api/medicines/search?q=<query>',
      invoices: '/api/invoices',
      inventory: '/api/inventory',
      realtime: '/api/realtime/inventory',
      health: '/health'
    }
  });
});

// API connectivity test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    server: 'MediTatva Backend',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
const medicineRoutes = require('./routes/medicine');
const invoiceRoutes = require('./routes/invoice');
const inventoryRoutes = require('./routes/inventory');
const voiceCallRoutes = require('./routes/voiceCall');

// Realtime Service
const realtimeService = require('./services/realtimeService');

// API Routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/voice-call', voiceCallRoutes);

// SSE Endpoint for real-time inventory updates
app.get('/api/realtime/inventory', (req, res) => {
  console.log('📡 New SSE connection request from:', req.headers.origin || 'unknown');
  
  try {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    
    // Send initial connection message
    res.write(': connected\n\n');
    
    // Add client to realtime service
    realtimeService.addClient(res);
    
    // Send initial data
    const Inventory = require('./models/Inventory');
    realtimeService.sendInitialInventory(res, Inventory);
    
    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (error) {
        console.error('❌ Heartbeat error:', error);
        clearInterval(heartbeat);
      }
    }, 30000); // Every 30 seconds
    
    // Cleanup on disconnect
    req.on('close', () => {
      console.log('📡 SSE client disconnected');
      clearInterval(heartbeat);
      realtimeService.removeClient(res);
    });
    
    // Handle errors
    req.on('error', (error) => {
      console.error('❌ SSE connection error:', error);
      clearInterval(heartbeat);
      realtimeService.removeClient(res);
    });
  } catch (error) {
    console.error('❌ Failed to establish SSE connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to establish real-time connection'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// CRITICAL: Start server ONLY after DB connection succeeds
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

console.log('🔄 Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log(`📦 Database: ${mongoose.connection.name}`);
  console.log('🔧 Registering API routes...');
  console.log('   - /api/medicines');
  console.log('   - /api/invoices');
  console.log('   - /api/inventory');
  console.log('   - /api/voice-call');
  
  // Start server ONLY after DB is ready
  app.listen(PORT, HOST, () => {
    console.log('═══════════════════════════════════════');
    console.log('✅ SERVER READY');
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
    console.log('═══════════════════════════════════════');
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  console.error('💥 Server startup failed - DB connection required');
  process.exit(1);
});

module.exports = app;
