// Health Routes - Health check with service dependencies
const express = require('express');
const router = express.Router();
const dicodingService = require('../services/dicodingService');

router.get('/', async (req, res) => {
  try {
    // Check Dicoding service health
    const dicodingHealth = await dicodingService.healthCheck();
    
    res.status(200).json({
      status: 'OK',
      message: 'LearnCheck Backend is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        dicoding: dicodingHealth
      }
    });
  } catch (error) {
    res.status(200).json({
      status: 'OK',
      message: 'LearnCheck Backend is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        dicoding: {
          success: false,
          error: 'Service check failed'
        }
      }
    });
  }
});

module.exports = router;