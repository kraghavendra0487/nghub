const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Import the file system module
const { runPy } = require('./utils/emailRunner'); // kept as-is in case you use it elsewhere
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS ---
// Configure CORS for production and development
const allowedOrigins = [
  'http://localhost:3000', // Vite dev server (configured port)
  'http://localhost:5000', // Backend server
  'http://localhost:5173', // Vite dev server default port
  'http://localhost:10000',
  'https://nghub.onrender.com',
  'https://compressor-ljk9.onrender.com' // Email API CORS
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Create reusable parsers with limits
const jsonParser = express.json({ limit: '50mb' });
const urlencodedParser = express.urlencoded({ extended: true, limit: '50mb' });

// Conditional JSON parsing middleware
app.use((req, res, next) => {
  // Skip JSON parsing for the file upload routes
  if ((req.path === '/api/financial-transactions/upload' || 
       req.path === '/api/client-services/upload' ||
       req.path.match(/^\/api\/documents\/service\/\d+\/upload$/)) && req.method === 'POST') {
    return next();
  }
  return jsonParser(req, res, next);
});

// Conditional URL-encoded parsing middleware
app.use((req, res, next) => {
  // Skip URL-encoded parsing for the file upload routes
  if ((req.path === '/api/financial-transactions/upload' || 
       req.path === '/api/client-services/upload' ||
       req.path.match(/^\/api\/documents\/service\/\d+\/upload$/)) && req.method === 'POST') {
    return next();
  }
  return urlencodedParser(req, res, next);
});

// Define the path to the frontend build directory
const distPath = path.join(__dirname, '../my-app/dist');

// Serve static files from the React build directory if it exists
if (fs.existsSync(distPath)) {
  console.log(`✅ Frontend 'dist' directory found at: ${distPath}`);
  app.use(express.static(distPath));
} else {
  console.warn(`⚠ Frontend 'dist' directory NOT found at: ${distPath}. Static assets might not be served.`);
  console.warn('Please ensure you have run "npm run build" in your my-app directory.');
}

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Import and use all API routes
const apiRoutes = require('./routes/index'); // Make sure this path is correct
app.use('/api', apiRoutes);

// 404 handler for API routes (this should come before the catch-all that serves index.html)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found', path: req.originalUrl });
});

// Catch-all handler: serves React's index.html for any non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log(`Serving index.html for route: ${req.originalUrl}`);
    res.sendFile(indexPath);
  } else {
    console.error(`❌ index.html NOT found at: ${indexPath}. Cannot serve frontend.`);
    res.status(404).json({
      error: 'Frontend not built or index.html not found.',
      message: 'Please ensure "npm run build" has been run in the my-app directory and deployed correctly.',
      attemptedPath: indexPath,
      apiHint: 'API endpoints are available at /api/*',
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Test Supabase connection on startup
const testSupabaseOnStartup = async () => {
  try {
    const { testSupabaseConnection } = require('./config/supabase');
    console.log('🔍 Testing Supabase connection on startup...');
    const isConnected = await testSupabaseConnection();
    if (isConnected) {
      console.log('✅ Supabase connection verified on startup');
    } else {
      console.error('❌ Supabase connection failed on startup');
    }
  } catch (error) {
    console.error('❌ Error testing Supabase connection on startup:', error.message);
  }
};

// Start the server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api`);
  if (fs.existsSync(distPath)) {
    console.log(`📱 Frontend potentially served from: http://localhost:${PORT}`);
  } else {
    console.warn('⚠ Frontend will NOT be served as the "dist" directory was not found.');
  }
  
  // Test Supabase connection after server starts
  await testSupabaseOnStartup();
});

module.exports = app;
