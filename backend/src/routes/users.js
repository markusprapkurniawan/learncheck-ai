// User Routes - Integrated with Mock Dicoding API
const express = require('express');
const router = express.Router();
const dicodingService = require('../services/dicodingService');
const logger = require('../services/logger');
const cacheService = require('../services/cache');

// GET /api/users/:id/preferences  
router.get('/:id/preferences', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Generate cache key for user preferences
    const cacheKey = `user_preferences:${id}`;
    
    // Try to get from cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info(`[UserRoutes] Returning cached preferences for user: ${id}`);
      return res.json({
        data: cached.data,
        source: 'cache',
        status: 'success',
        timestamp: new Date().toISOString()
      });
    }
    
    // Fetch from Dicoding service
    const result = await dicodingService.getUserPreferences(id);
    
    // Cache the result for 10 minutes
    await cacheService.set(cacheKey, result, 600);
    
    res.json({
      data: result.data,
      source: result.source,
      status: 'success',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`[UserRoutes] Error fetching preferences for user ${req.params.id}:`, error.message);
    res.status(500).json({
      error: 'Failed to fetch user preferences',
      message: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /api/users/:id/preferences - Update user preferences
router.put('/:id/preferences', async (req, res) => {
  try {
    const { id } = req.params;
    const preferences = req.body;
    
    // Update preferences via Dicoding service
    const result = await dicodingService.updateUserPreferences(id, preferences);
    
    // Clear cache for this user
    const cacheKey = `user_preferences:${id}`;
    await cacheService.del(cacheKey);
    
    res.json({
      data: result.data,
      updated: result.updated,
      source: result.source,
      status: 'success',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`[UserRoutes] Error updating preferences for user ${req.params.id}:`, error.message);
    res.status(500).json({
      error: 'Failed to update user preferences',
      message: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;