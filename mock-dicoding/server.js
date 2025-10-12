const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { mockTutorials } = require('./data/tutorials');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Mock user preferences data
const mockUserPreferences = {
  'demo_user': {
    theme: 'light',
    fontSize: 'medium',
    layoutWidth: 'full',
    fontFamily: 'Inter',
    notifications: true,
    language: 'id',
    autoSave: true,
    showHints: true
  },
  'student_123': {
    theme: 'dark', 
    fontSize: 'large',
    layoutWidth: 'centered',
    fontFamily: 'Roboto',
    notifications: false,
    language: 'id',
    autoSave: false,
    showHints: false
  },
  'user_456': {
    theme: 'light',
    fontSize: 'small', 
    layoutWidth: 'full',
    fontFamily: 'Open Sans',
    notifications: true,
    language: 'en',
    autoSave: true,
    showHints: true
  }
};

// API Routes

// GET /api/tutorials
app.get('/api/tutorials', (req, res) => {
  const { category, difficulty, search } = req.query;
  
  let filteredTutorials = mockTutorials;
  
  if (category) {
    filteredTutorials = filteredTutorials.filter(t => 
      t.category.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  if (difficulty) {
    filteredTutorials = filteredTutorials.filter(t => 
      t.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }
  
  if (search) {
    filteredTutorials = filteredTutorials.filter(t => 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json({
    data: filteredTutorials,
    count: filteredTutorials.length,
    status: 'success'
  });
});

// GET /api/tutorials/:id
app.get('/api/tutorials/:id', (req, res) => {
  const tutorial = mockTutorials.find(t => t.id === req.params.id);
  
  if (!tutorial) {
    return res.status(404).json({
      error: 'Tutorial not found',
      status: 'error'
    });
  }
  
  res.json({
    data: tutorial,
    status: 'success'
  });
});

// GET /api/users/:userId/preferences
app.get('/api/users/:userId/preferences', (req, res) => {
  const { userId } = req.params;
  const preferences = mockUserPreferences[userId] || mockUserPreferences['demo_user'];
  
  res.json({
    data: {
      userId: userId,
      preferences: preferences,
      lastUpdated: new Date().toISOString()
    },
    status: 'success'
  });
});

// PUT /api/users/:userId/preferences
app.put('/api/users/:userId/preferences', (req, res) => {
  const { userId } = req.params;
  const newPreferences = req.body;
  
  const validKeys = ['theme', 'fontSize', 'layoutWidth', 'fontFamily', 'notifications', 'language', 'autoSave', 'showHints'];
  const filteredPreferences = {};
  
  validKeys.forEach(key => {
    if (newPreferences[key] !== undefined) {
      filteredPreferences[key] = newPreferences[key];
    }
  });
  
  mockUserPreferences[userId] = {
    ...mockUserPreferences[userId] || mockUserPreferences['demo_user'],
    ...filteredPreferences
  };
  
  res.json({
    data: {
      userId: userId,
      preferences: mockUserPreferences[userId],
      updated: Object.keys(filteredPreferences),
      lastUpdated: new Date().toISOString()
    },
    status: 'success',
    message: 'Preferences updated successfully'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mock-dicoding-api',
    timestamp: new Date().toISOString(),
    tutorials_count: mockTutorials.length,
    available_endpoints: [
      'GET /api/tutorials',
      'GET /api/tutorials/:id', 
      'GET /api/users/:userId/preferences',
      'PUT /api/users/:userId/preferences',
      'GET /health'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    status: 'error',
    available_endpoints: [
      'GET /api/tutorials',
      'GET /api/tutorials/:id', 
      'GET /api/users/:userId/preferences',
      'PUT /api/users/:userId/preferences',
      'GET /health'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    status: 'error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mock Dicoding API server running on port ${PORT}`);
  console.log(`📚 Serving ${mockTutorials.length} comprehensive tutorials`);
  console.log(`👥 Mock user preferences for ${Object.keys(mockUserPreferences).length} users`);
  console.log(`🌐 Available at http://localhost:${PORT}/health`);
});

module.exports = app;