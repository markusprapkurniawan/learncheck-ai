// LearnCheck Backend API Server
// Complete Express.js server dengan LLM integration

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./services/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const healthRoutes = require('./routes/health');
const tutorialRoutes = require('./routes/tutorials');
const userRoutes = require('./routes/users');
const llmRoutes = require('./routes/llm');
const submissionRoutes = require('./routes/submissions');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration - support multiple origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use(morgan('combined', { 
  stream: { write: message => logger.info(message.trim()) }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', generalLimiter);

// API Routes
app.use('/health', healthRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/users', userRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/submissions', submissionRoutes);

// Alias route for direct LLM access
app.use('/api/generate-questions', llmRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 LearnCheck Backend API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid API endpoint`,
    availableEndpoints: [
      'GET /health',
      'GET /api/tutorials',
      'GET /api/tutorials/:id',
      'GET /api/users/:id/preferences',
      'PUT /api/users/:id/preferences',
      'POST /api/llm/generate-questions',
      'POST /api/submissions'
    ]
  });
});

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  const origins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
  logger.info(`🚀 LearnCheck Backend running on port ${PORT}`);
  logger.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 CORS enabled for: ${origins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;