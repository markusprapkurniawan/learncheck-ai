// Rate Limiter Middleware
const rateLimit = require('express-rate-limit');
const logger = require('../services/logger');

// Create rate limiter for general API calls
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
    status: 'error',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later',
      status: 'error',
      retryAfter: '15 minutes'
    });
  }
});

// Create stricter rate limiter for LLM/AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 AI requests per minute
  message: {
    error: 'Too many AI requests, please try again later',
    status: 'error',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`AI rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many AI requests, please try again later',
      status: 'error',
      retryAfter: '1 minute'
    });
  }
});

// Create limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    status: 'error',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later',
      status: 'error',
      retryAfter: '15 minutes'
    });
  }
});

module.exports = {
  generalLimiter,
  aiLimiter,
  authLimiter
};