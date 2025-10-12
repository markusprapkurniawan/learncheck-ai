// Dicoding API Service - Integration with Mock Dicoding API
const axios = require('axios');
const logger = require('./logger');

class DicodingService {
  constructor() {
    this.baseURL = process.env.MOCK_DICODING_API_URL || 'http://localhost:3002';
    this.timeout = parseInt(process.env.API_TIMEOUT) || 5000;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor untuk logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`[DicodingService] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('[DicodingService] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor untuk error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`[DicodingService] Response ${response.status}: ${response.config.url}`);
        return response;
      },
      (error) => {
        const status = error.response?.status || 'NETWORK_ERROR';
        const message = error.response?.data?.error || error.message;
        logger.error(`[DicodingService] Error ${status}: ${message}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all tutorials with optional filtering
   * @param {Object} filters - Query filters (category, difficulty, search)
   * @returns {Promise<Array>} List of tutorials
   */
  async getTutorials(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.search) params.append('search', filters.search);

      const response = await this.client.get('/api/tutorials', { params });
      
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
        source: 'mock-dicoding-api'
      };
    } catch (error) {
      logger.error('[DicodingService] Error fetching tutorials:', error.message);
      throw new Error(`Failed to fetch tutorials: ${error.message}`);
    }
  }

  /**
   * Get specific tutorial by ID
   * @param {string} tutorialId - Tutorial ID
   * @returns {Promise<Object>} Tutorial details
   */
  async getTutorialById(tutorialId) {
    try {
      const response = await this.client.get(`/api/tutorials/${tutorialId}`);
      
      return {
        success: true,
        data: response.data.data,
        source: 'mock-dicoding-api'
      };
    } catch (error) {
      if (error.response?.status === 404) {
        logger.warn(`[DicodingService] Tutorial not found: ${tutorialId}`);
        throw new Error(`Tutorial with ID ${tutorialId} not found`);
      }
      
      logger.error(`[DicodingService] Error fetching tutorial ${tutorialId}:`, error.message);
      throw new Error(`Failed to fetch tutorial: ${error.message}`);
    }
  }

  /**
   * Get user preferences from Dicoding
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      const response = await this.client.get(`/api/users/${userId}/preferences`);
      
      return {
        success: true,
        data: response.data.data,
        source: 'mock-dicoding-api'
      };
    } catch (error) {
      logger.error(`[DicodingService] Error fetching user preferences for ${userId}:`, error.message);
      throw new Error(`Failed to fetch user preferences: ${error.message}`);
    }
  }

  /**
   * Update user preferences in Dicoding
   * @param {string} userId - User ID
   * @param {Object} preferences - Updated preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const response = await this.client.put(`/api/users/${userId}/preferences`, preferences);
      
      return {
        success: true,
        data: response.data.data,
        updated: response.data.updated,
        source: 'mock-dicoding-api'
      };
    } catch (error) {
      logger.error(`[DicodingService] Error updating user preferences for ${userId}:`, error.message);
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }
  }

  /**
   * Health check for Mock Dicoding API
   * @returns {Promise<Object>} Service health status
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      
      return {
        success: true,
        status: response.data.status,
        service: response.data.service,
        timestamp: response.data.timestamp,
        tutorials_count: response.data.tutorials_count,
        available_endpoints: response.data.available_endpoints
      };
    } catch (error) {
      logger.error('[DicodingService] Health check failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate tutorial content for AI processing
   * @param {Object} tutorial - Tutorial object
   * @returns {boolean} Whether tutorial has sufficient content
   */
  validateTutorialContent(tutorial) {
    if (!tutorial || typeof tutorial !== 'object') {
      return false;
    }

    const requiredFields = ['id', 'title', 'content'];
    const hasRequiredFields = requiredFields.every(field => 
      tutorial[field] && typeof tutorial[field] === 'string' && tutorial[field].trim().length > 0
    );

    const hasMinimalContent = tutorial.content && tutorial.content.length >= 100;
    
    return hasRequiredFields && hasMinimalContent;
  }

  /**
   * Extract text content from HTML for AI processing
   * @param {string} htmlContent - HTML content from tutorial
   * @returns {string} Plain text content
   */
  extractTextFromHTML(htmlContent) {
    if (!htmlContent || typeof htmlContent !== 'string') {
      return '';
    }

    // Simple HTML tag removal - for production use a proper HTML parser
    return htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&lt;/g, '<')   // Replace HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }
}

module.exports = new DicodingService();