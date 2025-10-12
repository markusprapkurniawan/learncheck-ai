const fs = require('fs');
const path = require('path');

/**
 * Load tutorial content from mock-materi folder
 * Maps tutorial IDs to corresponding .txt files
 * Path: /usr/src/app/mock-materi (mounted via Docker volume)
 */
function loadTutorialContent(filename) {
  const basePath = '/usr/src/app/mock-materi';  // Absolute path in Docker container
  const filePath = path.join(basePath, filename);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error loading ${filename} from ${filePath}:`, error.message);
    return '';
  }
}

/**
 * Mock tutorials mapped to real content from mock-materi folder
 * Each tutorial corresponds to a .txt file in mock-materi/
 */
const mockTutorials = [
  {
    id: '1',
    courseId: 'ai-dasar-pengenalan',
    title: 'Pengenalan AI',
    description: 'Pelajari sejarah, definisi, dan konsep dasar Artificial Intelligence mulai dari konferensi Dartmouth hingga perkembangan ChatGPT',
    category: 'Artificial Intelligence',
    difficulty: 'beginner',
    duration: '45 menit',
    instructor: 'Dicoding Indonesia',
    tags: ['AI', 'Machine Learning', 'Pengantar', 'Sejarah AI'],
    createdAt: '2023-12-17T08:00:00Z',
    updatedAt: '2025-01-10T10:30:00Z',
    content: loadTutorialContent('Pengenalan-AI.txt'),
    estimatedTime: 45,
    prerequisites: [],
    learningObjectives: [
      'Memahami sejarah perkembangan AI dari tahun 1950',
      'Mengerti definisi dan konsep dasar Artificial Intelligence',
      'Mengetahui penerapan AI di kehidupan sehari-hari',
      'Memahami bagaimana AI belajar dari data'
    ]
  },
  {
    id: '2',
    courseId: 'ai-dasar-taksonomi',
    title: 'Taksonomi AI',
    description: 'Pahami kelompok keilmuan AI: Artificial Intelligence, Machine Learning, dan Deep Learning beserta hubungannya',
    category: 'Artificial Intelligence',
    difficulty: 'beginner',
    duration: '30 menit',
    instructor: 'Dicoding Indonesia',
    tags: ['AI', 'Machine Learning', 'Deep Learning', 'Taksonomi'],
    createdAt: '2023-12-17T08:30:00Z',
    updatedAt: '2025-01-10T11:00:00Z',
    content: loadTutorialContent('Taksonomi-AI.txt'),
    estimatedTime: 30,
    prerequisites: ['Pengenalan AI'],
    learningObjectives: [
      'Memahami hierarki keilmuan AI',
      'Membedakan AI, Machine Learning, dan Deep Learning',
      'Mengerti proses training dalam Machine Learning',
      'Mengetahui konsep jaringan saraf tiruan dalam Deep Learning'
    ]
  },
  {
    id: '3',
    courseId: 'ai-penerapan',
    title: 'Penerapan AI dalam Dunia Nyata',
    description: 'Eksplorasi berbagai implementasi AI di industri healthcare, transportasi, e-commerce, dan lainnya',
    category: 'Artificial Intelligence',
    difficulty: 'beginner',
    duration: '40 menit',
    instructor: 'Dicoding Indonesia',
    tags: ['AI', 'Use Case', 'Industry Application', 'Real World'],
    createdAt: '2023-12-17T09:00:00Z',
    updatedAt: '2025-01-10T11:30:00Z',
    content: loadTutorialContent('Penerapan-AI-dalam-Dunia-Nyata.txt'),
    estimatedTime: 40,
    prerequisites: ['Pengenalan AI', 'Taksonomi AI'],
    learningObjectives: [
      'Mengetahui penerapan AI di berbagai industri',
      'Memahami use case nyata AI dalam kehidupan sehari-hari',
      'Mengerti potensi dan keterbatasan AI',
      'Mampu mengidentifikasi peluang penerapan AI'
    ]
  },
  {
    id: '4',
    courseId: 'ai-workflow',
    title: 'AI Workflow dan Pipeline',
    description: 'Pelajari tahapan lengkap pengembangan AI: dari pengumpulan data, preprocessing, training, hingga deployment',
    category: 'Artificial Intelligence',
    difficulty: 'intermediate',
    duration: '60 menit',
    instructor: 'Dicoding Indonesia',
    tags: ['AI', 'Workflow', 'Pipeline', 'Development'],
    createdAt: '2023-12-17T09:30:00Z',
    updatedAt: '2025-01-10T12:00:00Z',
    content: loadTutorialContent('AI-Workflow.txt'),
    estimatedTime: 60,
    prerequisites: ['Pengenalan AI', 'Taksonomi AI'],
    learningObjectives: [
      'Memahami tahapan lengkap AI development lifecycle',
      'Mengerti proses pengumpulan dan preprocessing data',
      'Memahami konsep training dan evaluation model',
      'Mengetahui cara deployment model AI ke production'
    ]
  }
];

module.exports = { mockTutorials };
