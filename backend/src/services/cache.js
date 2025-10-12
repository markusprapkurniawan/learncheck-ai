// Cache Service - Redis integration untuk caching
const redis = require('redis');
const logger = require('./logger');

// Redis client configuration - support both URL and individual params
const redisUrl = process.env.REDIS_URL;
const redisConfig = redisUrl 
  ? { url: redisUrl }
  : {
      socket: {
        host: process.env.REDIS_HOST || 'redis',
        port: process.env.REDIS_PORT || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    };

// Create Redis client
let client = null;
let isConnected = false;

try {
  client = redis.createClient(redisConfig);
  
  client.on('connect', () => {
    logger.info('Redis client connecting...');
  });
  
  client.on('ready', () => {
    logger.info('Redis client ready');
    isConnected = true;
  });
  
  client.on('error', (err) => {
    logger.error('Redis client error:', err.message);
    isConnected = false;
  });
  
  client.on('end', () => {
    logger.warn('Redis client connection ended');
    isConnected = false;
  });

  // Connect to Redis
  client.connect().catch(err => {
    logger.error('Failed to connect to Redis:', err.message);
    isConnected = false;
  });

} catch (error) {
  logger.error('Redis initialization error:', error.message);
  client = null;
  isConnected = false;
}

// Cache operations
const cache = {
  // Check if Redis is available
  isAvailable: () => {
    return client && isConnected;
  },

  // Get value from cache
  get: async (key) => {
    try {
      if (!cache.isAvailable()) {
        logger.warn('Redis not available for GET operation');
        return null;
      }
      
      const value = await client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error('Cache GET error:', error.message);
      return null;
    }
  },

  // Set value in cache with expiration
  set: async (key, value, ttl = 3600) => {
    try {
      if (!cache.isAvailable()) {
        logger.warn('Redis not available for SET operation');
        return false;
      }
      
      const serializedValue = JSON.stringify(value);
      await client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error('Cache SET error:', error.message);
      return false;
    }
  },

  // Delete value from cache
  del: async (key) => {
    try {
      if (!cache.isAvailable()) {
        logger.warn('Redis not available for DEL operation');
        return false;
      }
      
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache DEL error:', error.message);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      if (!cache.isAvailable()) {
        return false;
      }
      
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache EXISTS error:', error.message);
      return false;
    }
  },

  // Clear all cache
  flushAll: async () => {
    try {
      if (!cache.isAvailable()) {
        logger.warn('Redis not available for FLUSH operation');
        return false;
      }
      
      await client.flushAll();
      return true;
    } catch (error) {
      logger.error('Cache FLUSH error:', error.message);
      return false;
    }
  },

  // Generate cache key for questions
  generateQuestionsCacheKey: (content, difficulty, questionCount) => {
    const contentHash = require('crypto').createHash('md5').update(content).digest('hex');
    return `questions:${contentHash}:${difficulty}:${questionCount}`;
  },

  // Generate cache key for tutorial content
  generateTutorialCacheKey: (tutorialId) => {
    return `tutorial:${tutorialId}`;
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  if (client && isConnected) {
    client.quit().then(() => {
      logger.info('Redis client disconnected gracefully');
    }).catch(err => {
      logger.error('Error disconnecting Redis client:', err.message);
    });
  }
});

module.exports = cache;