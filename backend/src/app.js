const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to database
connectDB();

// Middleware - Enhanced CORS for Vercel deployment
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CORS_ORIGIN,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches Vercel preview deployments
    if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // For development, allow all origins. In production, you may want to restrict this
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes with error handling
try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
}

try {
  app.use('/api/jobs', require('./routes/jobs'));
  console.log('✅ Jobs routes loaded');
} catch (error) {
  console.error('❌ Failed to load jobs routes:', error.message);
}

try {
  app.use('/api/ai', require('./routes/ai'));
  console.log('✅ AI routes loaded');
} catch (error) {
  console.error('❌ Failed to load AI routes:', error.message);
}

try {
  app.use('/api/connections', require('./routes/connections'));
  console.log('✅ Connections routes loaded');
} catch (error) {
  console.error('❌ Failed to load connections routes:', error.message);
}

try {
  app.use('/api/messages', require('./routes/messages'));
  console.log('✅ Messages routes loaded');
} catch (error) {
  console.error('❌ Failed to load messages routes:', error.message);
}

try {
  app.use('/api/posts', require('./routes/posts'));
  console.log('✅ Posts routes loaded');
} catch (error) {
  console.error('❌ Failed to load posts routes:', error.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    routes: ['/api/auth', '/api/jobs', '/api/ai', '/api/connections', '/api/messages', '/api/posts']
  });
});

// Test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle non-API routes (catch-all should be last)
app.use('*', (req, res) => {
  // Only handle non-API routes
  if (!req.path.startsWith('/api/')) {
    if (process.env.NODE_ENV === 'production') {
      res.status(404).json({ message: 'Route not found' });
    } else {
      res.status(404).json({ message: 'Route not found' });
    }
  } else {
    // API routes that weren't matched by the specific route handlers
    res.status(404).json({ message: 'API route not found' });
  }
});

module.exports = app;
