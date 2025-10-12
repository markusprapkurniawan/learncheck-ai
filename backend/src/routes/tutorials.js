// Tutorial Routes - Integrated with Mock Dicoding API
const express = require('express');
const router = express.Router();
const dicodingService = require('../services/dicodingService');
const logger = require('../services/logger');
const cacheService = require('../services/cache');

// GET /api/tutorials - Get all tutorials with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    const filters = { category, difficulty, search };
    
    // Generate cache key
    const cacheKey = `tutorials:${JSON.stringify(filters)}`;
    
    // Try to get from cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('[TutorialRoutes] Returning cached tutorials list');
      return res.json({
        success: true,
        data: cached.data,
        count: cached.count,
        source: 'cache',
        status: 'success',
        timestamp: new Date().toISOString()
      });
    }
    
    // Fetch from Dicoding service
    const result = await dicodingService.getTutorials(filters);
    
    // Cache the result for 5 minutes
    await cacheService.set(cacheKey, result, 300);
    
    res.json({
      success: true,
      data: result.data,
      count: result.count,
      source: result.source,
      status: 'success',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('[TutorialRoutes] Error fetching tutorials:', error.message);
    res.status(500).json({
      error: 'Failed to fetch tutorials',
      message: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/tutorials/:id - Get specific tutorial
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Generate cache key for tutorial
    const cacheKey = cacheService.generateTutorialCacheKey(id);
    
    // Try to get from cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info(`[TutorialRoutes] Returning cached tutorial: ${id}`);
      return res.json({
        success: true,
        data: cached.data,
        source: 'cache',
        status: 'success',
        timestamp: new Date().toISOString()
      });
    }
    
    // Fetch from Dicoding service
    const result = await dicodingService.getTutorialById(id);
    
    // Validate tutorial content
    if (!dicodingService.validateTutorialContent(result.data)) {
      logger.warn(`[TutorialRoutes] Invalid tutorial content: ${id}`);
      return res.status(400).json({
        error: 'Invalid tutorial content',
        message: 'Tutorial content is insufficient for processing',
        status: 'error',
        timestamp: new Date().toISOString()
      });
    }
    
    // Cache the result for 15 minutes
    await cacheService.set(cacheKey, result, 900);
    
    res.json({
      success: true,
      data: result.data,
      source: result.source,
      status: 'success',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Tutorial not found',
        message: error.message,
        status: 'error',
        timestamp: new Date().toISOString()
      });
    }
    
    logger.error(`[TutorialRoutes] Error fetching tutorial ${req.params.id}:`, error.message);
    res.status(500).json({
      error: 'Failed to fetch tutorial',
      message: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;