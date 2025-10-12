// ============================================================================
// LLM Routes - Gemini API Integration for Adaptive Question Generation
// ============================================================================
// Generates formative assessment questions with adaptive difficulty
// based on user performance and previous attempts
// ============================================================================

const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Joi = require('joi');
const logger = require('../services/logger');
const cache = require('../services/cache');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const generateQuestionsSchema = Joi.object({
  content: Joi.string().min(100).max(50000).required(),
  questionCount: Joi.number().integer().min(1).max(10).default(3),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  language: Joi.string().valid('id', 'en').default('id'),
  questionType: Joi.string().valid('multiple-choice', 'true-false', 'short-answer').default('multiple-choice'),
  attemptNumber: Joi.number().integer().min(0).default(0), // For cache busting
  previousScore: Joi.number().integer().min(0).max(100).optional(), // For adaptive difficulty
  userId: Joi.string().optional() // For personalized questions
});

// ============================================================================
// MAIN ENDPOINT: POST /api/llm/generate-questions
// ============================================================================
// Generates questions with adaptive difficulty based on user performance
// Cache key includes attemptNumber to ensure fresh questions on retry
// ============================================================================

router.post('/generate-questions', async (req, res) => {
  try {
    // Validate request
    const { error, value } = generateQuestionsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const { content, questionCount, difficulty, language, questionType, attemptNumber, previousScore, userId } = value;

    // ========================================================================
    // ADAPTIVE DIFFICULTY LOGIC
    // ========================================================================
    // Adjust difficulty based on previous score:
    // - Score >= 80%  → increase difficulty (if not already 'hard')
    // - Score <= 40%  → decrease difficulty (if not already 'easy')
    // - Score 41-79%  → keep current difficulty
    // ========================================================================
    
    let adjustedDifficulty = difficulty;
    
    if (previousScore !== undefined && attemptNumber > 0) {
      const scorePercentage = previousScore;
      
      if (scorePercentage >= 80 && difficulty !== 'hard') {
        adjustedDifficulty = difficulty === 'easy' ? 'medium' : 'hard';
        logger.info(`📈 Increasing difficulty from ${difficulty} to ${adjustedDifficulty} (score: ${scorePercentage}%)`);
      } else if (scorePercentage <= 40 && difficulty !== 'easy') {
        adjustedDifficulty = difficulty === 'hard' ? 'medium' : 'easy';
        logger.info(`📉 Decreasing difficulty from ${difficulty} to ${adjustedDifficulty} (score: ${scorePercentage}%)`);
      }
    }

    // ========================================================================
    // CACHE KEY GENERATION
    // ========================================================================
    // Include attemptNumber and userId to prevent returning same questions
    // Format: questions:{contentHash}:{difficulty}:{count}:{attempt}:{userId}
    // ========================================================================
    
    const contentHash = Buffer.from(content).toString('base64').slice(0, 32);
    const cacheKey = `questions:${contentHash}:${adjustedDifficulty}:${questionCount}:${attemptNumber}:${userId || 'anonymous'}`;
    
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      logger.info(`✅ Returning cached questions (attempt: ${attemptNumber}, difficulty: ${adjustedDifficulty})`);
      return res.json({
        success: true,
        data: {
          questions: JSON.parse(cached)
        },
        cached: true,
        difficulty: adjustedDifficulty,
        attemptNumber,
        generatedAt: new Date().toISOString()
      });
    }

    // ========================================================================
    // GENERATE QUESTIONS USING GEMINI 2.5 FLASH
    // ========================================================================
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = createPrompt(content, questionCount, adjustedDifficulty, language, questionType, attemptNumber);
    
    logger.info(`🤖 Generating ${questionCount} questions (difficulty: ${adjustedDifficulty}, attempt: ${attemptNumber})`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // ========================================================================
    // PARSE AND VALIDATE RESPONSE
    // ========================================================================
    
    const questions = parseGeminiResponse(text, questionCount);

    if (!questions || questions.length === 0) {
      throw new Error('Failed to generate valid questions');
    }

    // ========================================================================
    // CACHE FOR 1 HOUR
    // ========================================================================
    
    await cache.set(cacheKey, JSON.stringify(questions), 3600);

    logger.info(`✅ Successfully generated ${questions.length} questions (difficulty: ${adjustedDifficulty})`);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================
    
    res.json({
      success: true,
      data: {
        questions
      },
      cached: false,
      difficulty: adjustedDifficulty,
      attemptNumber,
      generatedAt: new Date().toISOString(),
      metadata: {
        requestedDifficulty: difficulty,
        adjustedDifficulty,
        previousScore,
        language,
        questionType,
        contentLength: content.length,
        questionCount: questions.length
      }
    });

  } catch (error) {
    logger.error('❌ Error generating questions:', error);
    
    // ========================================================================
    // FALLBACK: Return demo questions on error
    // ========================================================================
    
    const fallbackQuestions = getFallbackQuestions(req.body.questionCount || 3);
    
    res.status(200).json({
      success: false,
      error: 'Question generation failed',
      message: 'Menggunakan soal contoh untuk development/demo',
      data: {
        questions: fallbackQuestions
      },
      fallback: true,
      generatedAt: new Date().toISOString()
    });
  }
});

// ============================================================================
// PROMPT CREATION FUNCTION
// ============================================================================
// Creates optimized prompt for Gemini with difficulty-aware instructions
// ============================================================================

function createPrompt(content, questionCount, difficulty, language, questionType, attemptNumber = 0) {
  const languageInstructions = language === 'id' ? 
    'Gunakan Bahasa Indonesia yang baik dan benar. WAJIB gunakan Bahasa Indonesia untuk semua soal dan penjelasan.' : 
    'Use clear and proper English';

  const difficultyLevels = {
    easy: 'Pemahaman dasar dan mengingat konsep (easy recall)',
    medium: 'Aplikasi konsep dan analisis (application & analysis)',  
    hard: 'Sintesis dan evaluasi mendalam (synthesis & evaluation)'
  };

  // Strip HTML tags untuk konten yang lebih clean
  const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 4000);

  // Add variation instruction for retry attempts
  const variationNote = attemptNumber > 0 
    ? `\n⚠️ INI ADALAH PERCOBAAN KE-${attemptNumber + 1}. Buat soal yang BERBEDA dari sebelumnya dengan memfokuskan aspek yang berbeda dari materi.` 
    : '';

  return `Kamu adalah asisten pembuat soal formatif untuk platform pembelajaran Dicoding Indonesia.

KONTEN MATERI PEMBELAJARAN:
${cleanContent}

TUGAS KAMU:
Buat ${questionCount} soal pilihan ganda BERKUALITAS TINGGI untuk formative assessment.
${variationNote}

ATURAN PENTING:
1. Tingkat kesulitan: ${difficulty} - ${difficultyLevels[difficulty]}
2. ${languageInstructions}
3. Soal harus RELEVAN dengan konten materi di atas
4. Hindari soal yang terlalu mudah ditebak
5. Setiap soal HARUS memiliki 4 pilihan (A, B, C, D)
6. Hanya 1 jawaban benar per soal
7. Penjelasan harus MENDIDIK dan membantu siswa memahami konsep

FORMAT OUTPUT - WAJIB JSON VALID:
[
  {
    "id": 1,
    "question": "Pertanyaan yang jelas dan spesifik?",
    "options": [
      {"id": "A", "text": "Opsi jawaban A"},
      {"id": "B", "text": "Opsi jawaban B"},
      {"id": "C", "text": "Opsi jawaban C"},
      {"id": "D", "text": "Opsi jawaban D"}
    ],
    "correctAnswer": "B",
    "explanation": "Penjelasan lengkap: Jawaban B benar karena [alasan edukatif yang membantu pemahaman]"
  }
]

CRITICAL: 
- Output HARUS JSON array valid
- JANGAN tambahkan text di luar JSON
- JANGAN gunakan markdown code blocks
- Langsung mulai dengan [ dan akhiri dengan ]`;
}

// Parse Gemini response dan validate format - IMPROVED VERSION
function parseGeminiResponse(text, expectedCount) {
  try {
    // Log raw response untuk debugging
    logger.info('Raw Gemini response length:', text.length);
    
    // Clean response text - handle berbagai format
    let cleanText = text.trim();
    
    // Remove markdown code blocks
    cleanText = cleanText.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing non-JSON text
    const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    // Parse JSON
    const questions = JSON.parse(cleanText);
    
    if (!Array.isArray(questions)) {
      logger.warn('Response is not an array, wrapping in array');
      return [questions].slice(0, expectedCount);
    }

    if (questions.length === 0) {
      throw new Error('Empty questions array');
    }

    // Validate dan normalize setiap question
    const validQuestions = questions.slice(0, expectedCount).map((q, index) => {
      // Ensure options have correct structure
      const normalizedOptions = (Array.isArray(q.options) ? q.options : [])
        .slice(0, 4)
        .map((opt, optIndex) => ({
          id: typeof opt === 'object' && opt.id ? opt.id : String.fromCharCode(65 + optIndex),
          text: typeof opt === 'object' && opt.text ? opt.text : (typeof opt === 'string' ? opt : `Opsi ${optIndex + 1}`)
        }));

      // Ensure we have exactly 4 options
      while (normalizedOptions.length < 4) {
        const nextId = String.fromCharCode(65 + normalizedOptions.length);
        normalizedOptions.push({
          id: nextId,
          text: `Opsi ${nextId}`
        });
      }

      return {
        id: index + 1,
        question: q.question || `Soal ${index + 1}`,
        options: normalizedOptions,
        correctAnswer: q.correctAnswer || "A",
        explanation: q.explanation || "Penjelasan belum tersedia."
      };
    });

    logger.info(`Successfully parsed ${validQuestions.length} questions`);
    return validQuestions;
    
  } catch (error) {
    logger.error('Failed to parse Gemini response:', error.message);
    logger.error('Raw response preview:', text.substring(0, 500));
    return null;
  }
}

// Fallback questions untuk error cases
function getFallbackQuestions(count = 3) {
  const fallback = [
    {
      id: 1,
      question: "Apa keuntungan utama menggunakan React Hooks dibandingkan dengan Class Components?",
      options: [
        { id: "A", text: "Lebih cepat dalam rendering" },
        { id: "B", text: "Syntax lebih sederhana dan mudah dipahami" },
        { id: "C", text: "Mendukung lebih banyak lifecycle methods" },
        { id: "D", text: "Kompatibilitas yang lebih baik dengan browser lama" }
      ],
      correctAnswer: "B",
      explanation: "React Hooks memberikan syntax yang lebih clean dan mudah dipahami untuk state management dan side effects, membuat code lebih readable dan maintainable."
    },
    {
      id: 2,
      question: "Kapan sebaiknya menggunakan useEffect() dalam React?",
      options: [
        { id: "A", text: "Hanya untuk API calls" },
        { id: "B", text: "Setiap kali ada state yang berubah" },
        { id: "C", text: "Untuk side effects seperti data fetching, subscriptions, atau DOM manipulation" },
        { id: "D", text: "Hanya di komponen class" }
      ],
      correctAnswer: "C",
      explanation: "useEffect adalah hook untuk menangani side effects dalam functional components, termasuk data fetching, event listeners, dan cleanup operations."
    },
    {
      id: 3,
      question: "Apa perbedaan antara props dan state dalam React?",
      options: [
        { id: "A", text: "Props bersifat mutable, state immutable" },
        { id: "B", text: "Props untuk data dari parent, state untuk data internal component" },
        { id: "C", text: "Props hanya untuk class components" },
        { id: "D", text: "Tidak ada perbedaan, keduanya sama" }
      ],
      correctAnswer: "B",
      explanation: "Props adalah data yang diberikan dari parent component dan bersifat read-only, sedangkan state adalah data internal yang dapat diubah oleh component itu sendiri."
    }
  ];

  return fallback.slice(0, count);
}

module.exports = router;