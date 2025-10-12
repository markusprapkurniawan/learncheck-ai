// Submission Routes - Handle assessment submissions
const express = require('express');
const router = express.Router();

// POST /api/submissions
router.post('/', (req, res) => {
  try {
    const { userId, tutorialId, results, score } = req.body;
    
    // In production, save to database
    // For now, just return success response
    
    const submission = {
      id: `sub_${Date.now()}`,
      userId,
      tutorialId,
      results,
      score,
      submittedAt: new Date().toISOString(),
      status: 'completed'
    };

    // Log submission for monitoring (would be saved to DB in production)
    logger.info('Assessment submission received', {
      userId,
      tutorialId, 
      score: `${score.percentage}%`,
      correctAnswers: score.correct,
      totalQuestions: score.total
    });

    res.status(201).json({
      data: submission,
      status: 'success',
      message: 'Assessment submitted successfully'
    });

  } catch (error) {
    logger.error('Submission failed:', error);
    res.status(500).json({
      error: 'Submission failed',
      message: error.message
    });
  }
});

// GET /api/submissions/:userId
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Mock user submissions history
  const submissions = [
    {
      id: 'sub_1',
      tutorialId: 'react-hooks',
      score: { correct: 2, total: 3, percentage: 67 },
      submittedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  res.json({
    data: submissions,
    status: 'success',
    count: submissions.length
  });
});

module.exports = router;