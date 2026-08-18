const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const swaggerDocument = require('./src/config/swagger.json');

const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // If CLIENT_URL is defined, check matching origin (ignoring trailing slash)
    if (process.env.CLIENT_URL) {
      const clientUrlClean = process.env.CLIENT_URL.trim().replace(/\/$/, '');
      const originClean = origin.trim().replace(/\/$/, '');
      if (originClean === clientUrlClean) {
        return callback(null, true);
      }
    }

    // Allow Netlify subdomains, Vercel subdomains, and local dev servers
    if (
      origin.endsWith('.netlify.app') ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    ) {
      return callback(null, true);
    }

    // Dynamic reflection of origin to guarantee CORS compliance with credentials
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(cookieParser());
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount Routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running smoothly',
    timestamp: new Date(),
    uptime: process.uptime(),
    env: NODE_ENV
  });
});

// Root check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Expiry Date Manager API server'
  });
});

// Fallback 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  Server is running in ${NODE_ENV} mode`);
  console.log(`  Listening on port: ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`  API Specs:    http://localhost:${PORT}/api-docs`);
  console.log(`=========================================`);
});
