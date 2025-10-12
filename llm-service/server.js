const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Gemini AI (use environment variable or fallback)
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn('⚠️  GEMINI_API_KEY not set, using mock responses');
}

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    error: 'Too many requests, please try again later',
    status: 'error'
  }
});
app.use('/api/', limiter);

// Validation schemas
const generateQuestionsSchema = Joi.object({
  content: Joi.string().required().min(100).max(50000),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').default('intermediate'),
  questionCount: Joi.number().integer().min(1).max(10).default(5),
  language: Joi.string().valid('id', 'en').default('id'),
  tutorialTitle: Joi.string().optional()
});

// Mock questions untuk fallback
const generateMockQuestions = (difficulty, questionCount, language) => {
  const mockQuestions = [
    {
      id: 1,
      question: language === 'id' ? 
        'Apa yang dimaksud dengan React Hooks?' : 
        'What are React Hooks?',
      options: language === 'id' ? [
        'Fitur untuk menggunakan state di functional components',
        'Library untuk styling components',
        'Tool untuk debugging React apps',
        'Framework untuk building mobile apps'
      ] : [
        'Feature to use state in functional components',
        'Library for styling components', 
        'Tool for debugging React apps',
        'Framework for building mobile apps'
      ],
      correctAnswer: 0,
      explanation: language === 'id' ?
        'React Hooks adalah fitur yang memungkinkan penggunaan state dan lifecycle methods di functional components.' :
        'React Hooks are features that allow using state and lifecycle methods in functional components.'
    },
    {
      id: 2,
      question: language === 'id' ?
        'Hook mana yang digunakan untuk side effects?' :
        'Which hook is used for side effects?',
      options: language === 'id' ? [
        'useState',
        'useEffect',
        'useContext',
        'useReducer'
      ] : [
        'useState',
        'useEffect', 
        'useContext',
        'useReducer'
      ],
      correctAnswer: 1,
      explanation: language === 'id' ?
        'useEffect digunakan untuk menangani side effects seperti API calls, subscriptions, dan DOM manipulation.' :
        'useEffect is used to handle side effects like API calls, subscriptions, and DOM manipulation.'
    },
    {
      id: 3,
      question: language === 'id' ?
        'Apa yang dikembalikan oleh useState?' :
        'What does useState return?',
      options: language === 'id' ? [
        'Hanya state value',
        'Hanya setter function',
        'Array berisi state value dan setter function',
        'Object dengan state dan methods'
      ] : [
        'Only state value',
        'Only setter function',
        'Array containing state value and setter function',
        'Object with state and methods'
      ],
      correctAnswer: 2,
      explanation: language === 'id' ?
        'useState mengembalikan array dengan dua elemen: nilai state saat ini dan fungsi untuk memperbarui state.' :
        'useState returns an array with two elements: current state value and function to update state.'
    }
  ];

  return mockQuestions.slice(0, questionCount).map((q, index) => ({
    ...q,
    id: index + 1,
    difficulty: difficulty
  }));
};

// Generate questions dari content menggunakan Gemini AI
const generateQuestionsWithAI = async (content, options = {}) => {
  const {
    difficulty = 'intermediate',
    questionCount = 5,
    language = 'id',
    tutorialTitle = 'Tutorial'
  } = options;

  const prompt = language === 'id' ? `
Berdasarkan konten tutorial berikut, buatlah ${questionCount} soal pilihan ganda dengan tingkat kesulitan ${difficulty}.

KONTEN TUTORIAL:
${content}

INSTRUKSI:
1. Buat soal yang relevan dengan materi dalam konten
2. Setiap soal harus memiliki 4 pilihan jawaban (A, B, C, D)
3. Berikan penjelasan untuk jawaban yang benar
4. Tingkat kesulitan: ${difficulty}
5. Gunakan bahasa Indonesia yang baik dan benar

FORMAT JAWABAN (JSON):
{
  "questions": [
    {
      "id": 1,
      "question": "Pertanyaan di sini?",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correctAnswer": 0,
      "explanation": "Penjelasan jawaban yang benar",
      "difficulty": "${difficulty}"
    }
  ]
}

Pastikan JSON yang dikembalikan valid dan dapat di-parse.
` : `
Based on the following tutorial content, create ${questionCount} multiple choice questions with ${difficulty} difficulty level.

TUTORIAL CONTENT:
${content}

INSTRUCTIONS:
1. Create questions relevant to the material in the content
2. Each question should have 4 answer choices (A, B, C, D)
3. Provide explanation for the correct answer
4. Difficulty level: ${difficulty}
5. Use clear and proper English

JSON FORMAT:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
      "correctAnswer": 0,
      "explanation": "Explanation for the correct answer",
      "difficulty": "${difficulty}"
    }
  ]
}

Ensure the returned JSON is valid and parseable.
`;

  try {
    if (!genAI) {
      console.log('Using mock questions (no API key)');
      return generateMockQuestions(difficulty, questionCount, language);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON dari response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    return parsedResponse.questions || [];

  } catch (error) {
    console.error('AI generation failed, using fallback:', error.message);
    return generateMockQuestions(difficulty, questionCount, language);
  }
};

// API Routes

// POST /api/generate-questions
app.post('/api/generate-questions', async (req, res) => {
  try {
    // Validate request
    const { error, value } = generateQuestionsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
        status: 'error'
      });
    }

    const { content, difficulty, questionCount, language, tutorialTitle } = value;

    console.log(`Generating ${questionCount} questions (${difficulty}) for: ${tutorialTitle || 'Tutorial'}`);

    // Generate questions
    const questions = await generateQuestionsWithAI(content, {
      difficulty,
      questionCount,
      language,
      tutorialTitle
    });

    res.json({
      data: {
        questions,
        metadata: {
          tutorialTitle,
          difficulty,
          questionCount: questions.length,
          language,
          generatedAt: new Date().toISOString()
        }
      },
      status: 'success'
    });

  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({
      error: 'Failed to generate questions',
      message: error.message,
      status: 'error'
    });
  }
});

// GET /api/models - Get available AI models info
app.get('/api/models', (req, res) => {
  res.json({
    data: {
      available: genAI ? true : false,
      model: 'gemini-2.5-flash',
      capabilities: [
        'text-generation',
        'question-generation', 
        'content-analysis'
      ],
      languages: ['id', 'en'],
      maxContentLength: 50000
    },
    status: 'success'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'llm-service',
    ai_available: genAI ? true : false,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    status: 'error'
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
  console.log(`🤖 LLM Service running on port ${PORT}`);
  console.log(`🔑 Gemini AI: ${genAI ? 'Enabled' : 'Disabled (using mock responses)'}`);
});

module.exports = app;