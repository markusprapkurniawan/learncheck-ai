# 🎓 LearnCheck - Formative Assessment Powered with AI

LearnCheck adalah sistem penilaian formatif berbasis AI yang terintegrasi dengan platform Dicoding. Sistem ini menggunakan Google Gemini AI untuk menghasilkan soal kuis secara otomatis berdasarkan materi pembelajaran, dengan tingkat kesulitan yang adaptif terhadap performa user.

![LearnCheck Banner](https://img.shields.io/badge/LearnCheck-Formative_Assessment-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Konfigurasi](#-konfigurasi)
- [API Documentation](#-api-documentation)
- [Development Guide](#-development-guide)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Fitur Utama

### 🤖 AI-Powered Question Generation
- Soal quiz otomatis dibuat oleh Google Gemini AI
- Disesuaikan dengan konten materi pembelajaran
- Penjelasan lengkap untuk setiap jawaban

### 📊 Adaptive Difficulty
- Tingkat kesulitan menyesuaikan performa user
- 3 level: Easy, Medium, Hard
- Algoritma adaptif berdasarkan score sebelumnya

### 📱 User-Friendly Interface
- UI minimalis mengikuti design Dicoding
- Progress indicator dengan nomor soal clickable
- Timer countdown dengan warning
- Riwayat attempt dengan detail lengkap

### 🔄 Real-time Feedback
- Hasil quiz langsung tampil setelah submit
- Result card dengan penjelasan untuk setiap soal
- Status lulus/tidak lulus (passing score: 80%)

### 💾 Auto-Save & History
- Auto-save jawaban ke localStorage
- Riwayat attempt tersimpan lengkap
- Detail riwayat bisa di-review kapan saja

### 🌐 iFrame Integration
- Designed untuk di-embed di Dicoding Classroom
- URL parameters: `tutorial_id` & `user_id`
- No CORS issues dengan proper configuration

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                      Dicoding Classroom                         │
│                  (Main Learning Platform)                       │
└───────────────────────┬─────────────────────────────────────────┘
                        │ iFrame Embed
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LearnCheck Frontend (React)                   │
│                    Port 5000 (nginx)                            │
│  • Quiz UI • Progress Tracker • Result Display • History       │
└───────────────────────┬─────────────────────────────────────────┘
                        │ REST API
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                LearnCheck Backend (Node.js/Express)             │
│                       Port 3001                                 │
│  • API Routes • Cache Management • Business Logic              │
└──────┬──────────────────────────┬───────────────────────────────┘
       │                          │
       ↓                          ↓
┌──────────────────┐    ┌──────────────────────────────────┐
│  Mock Dicoding   │    │    LLM Service (Gemini AI)      │
│   API Server     │    │        Port 3003                │
│   Port 3002      │    │  • Question Generation          │
│  • Tutorials     │    │  • Adaptive Difficulty          │
│  • User Prefs    │    │  • Answer Explanations          │
└──────────────────┘    └──────────────────────────────────┘
       │
       ↓
┌──────────────────┐
│  Redis Cache     │
│   Port 6379      │
│  • Question Cache│
│  • User Session  │
└──────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling
- **Shadcn/UI** - Component library
- **Lucide Icons** - Icon set
- **Zustand** - State management (optional)

### Backend
- **Node.js 20** - Runtime
- **Express.js** - Web framework
- **Redis** - Caching layer
- **Winston** - Logging
- **Helmet** - Security middleware
- **Rate Limiting** - API protection

### LLM Service
- **Google Gemini AI** - Question generation
- **Gemini 1.5 Flash** - Fast & accurate responses
- **Structured output** - JSON-based question format

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy & static server
- **GitHub Actions** - CI/CD (optional)

---

## 📦 Prerequisites

Sebelum menjalankan project, pastikan sudah install:

- **Node.js** >= 20.x
- **Docker** >= 24.x
- **Docker Compose** >= 2.x
- **Git**
- **Google Gemini API Key** (opsional untuk development)

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone git@github.com:markusprap/learncheck-ai.git
cd learncheck-ai
```

### 2. Environment Setup

Buat file `.env` di root folder `learncheck-ai/`:

```env
# LLM Service Configuration
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3003

# Backend Configuration
DICODING_API_URL=http://mock-dicoding:3002
LLM_SERVICE_URL=http://llm-service:3003
REDIS_URL=redis://redis:6379
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=http://localhost:3001
```

> **Note**: Tanpa Gemini API key, sistem akan menggunakan mock responses (soal dummy).

### 3. Run dengan Docker (Recommended)

```bash
# Build dan start semua services
docker-compose up -d

# Check status containers
docker-compose ps

# View logs
docker-compose logs -f

# Stop semua services
docker-compose down
```

Services akan berjalan di:
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:3001
- **Mock Dicoding**: http://localhost:3002
- **LLM Service**: http://localhost:3003
- **Redis**: localhost:6379

### 4. Access Application

Buka browser:
```
http://localhost:5000/?tutorial_id=1&user_id=demo_user
```

Parameter URL:
- `tutorial_id`: ID tutorial dari Dicoding (1-4)
- `user_id`: ID user untuk tracking history

---

## ⚙️ Konfigurasi

### Frontend Configuration

File: `frontend/vite.config.ts`

```typescript
export default defineConfig({
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
```

### Backend Configuration

File: `backend/src/index.js`

```javascript
const config = {
  port: process.env.PORT || 3001,
  dicodingApiUrl: process.env.DICODING_API_URL,
  llmServiceUrl: process.env.LLM_SERVICE_URL,
  redisUrl: process.env.REDIS_URL,
  corsOrigins: [
    'http://localhost:5000',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082'
  ]
};
```

### Docker Configuration

File: `docker-compose.yml`

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: http://localhost:3001
    ports:
      - "5000:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DICODING_API_URL=http://mock-dicoding:3002
      - LLM_SERVICE_URL=http://llm-service:3003
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - mock-dicoding
      - llm-service

  llm-service:
    build: ./llm-service
    ports:
      - "3003:3003"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - PORT=3003

  mock-dicoding:
    build: ./mock-dicoding
    ports:
      - "3002:3002"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## 📚 API Documentation

### Backend Endpoints

#### 1. Health Check
```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "message": "LearnCheck Backend is running",
  "timestamp": "2025-10-12T10:00:00.000Z",
  "services": {
    "dicoding": {
      "status": "healthy"
    }
  }
}
```

#### 2. Get Tutorial
```http
GET /api/tutorials/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "AI di Balik Layar: Integrasi AI di Back-End",
    "content": "...",
    "category": "Artificial Intelligence"
  }
}
```

#### 3. Generate Questions
```http
POST /api/llm/generate-questions
Content-Type: application/json

{
  "content": "Tutorial content here...",
  "difficulty": "medium",
  "questionCount": 5,
  "language": "id",
  "tutorialTitle": "AI Tutorial",
  "userId": "user123",
  "attemptNumber": 0
}
```

Response:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q1",
        "question": "Apa itu AI?",
        "options": [
          {"id": "A", "text": "Artificial Intelligence"},
          {"id": "B", "text": "Animal Intelligence"},
          {"id": "C", "text": "Automated Integration"},
          {"id": "D", "text": "Advanced Information"}
        ],
        "correctAnswer": "A",
        "explanation": "AI adalah singkatan dari Artificial Intelligence..."
      }
    ]
  },
  "difficulty": "medium",
  "fallback": false
}
```

### Mock Dicoding Endpoints

#### Get All Tutorials
```http
GET /api/tutorials
```

#### Get User Preferences
```http
GET /api/users/:userId/preferences
```

---

## 👨‍💻 Development Guide

### Run Development Mode (tanpa Docker)

#### 1. Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Frontend akan running di http://localhost:5173

#### 2. Backend Development

```bash
cd backend
npm install
npm run dev
```

Backend akan running di http://localhost:3001

#### 3. LLM Service Development

```bash
cd llm-service
npm install
npm run dev
```

LLM service akan running di http://localhost:3003

#### 4. Mock Dicoding API

```bash
cd mock-dicoding
npm install
npm start
```

Mock API akan running di http://localhost:3002

### Project Structure

```
learncheck-ai/
├── frontend/                    # React TypeScript app
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── IntroScreen.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   ├── QuizHeader.tsx
│   │   │   ├── Timer.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── pages/              # Page components
│   │   │   └── Index.tsx       # Main quiz page
│   │   ├── lib/                # Utilities
│   │   │   ├── api.ts          # API client
│   │   │   └── storage.ts      # LocalStorage utils
│   │   ├── hooks/              # Custom hooks
│   │   └── styles/             # Global styles
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── backend/                     # Express.js API
│   ├── src/
│   │   ├── routes/             # API routes
│   │   │   ├── tutorials.js
│   │   │   ├── llm.js
│   │   │   └── health.js
│   │   ├── services/           # Business logic
│   │   │   ├── dicodingService.js
│   │   │   ├── cache.js
│   │   │   └── logger.js
│   │   ├── middleware/         # Express middleware
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   └── index.js            # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── llm-service/                 # Gemini AI service
│   ├── src/
│   │   └── controllers/
│   ├── server.js               # Main server
│   ├── Dockerfile
│   └── package.json
│
├── mock-dicoding/              # Mock Dicoding API
│   ├── data/
│   │   └── tutorials.js        # Mock data
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # Docker orchestration
├── .env.example                # Environment template
└── README.md                   # This file
```

### Code Quality

#### Linting
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
npm run lint
```

#### Type Checking
```bash
cd frontend
npm run type-check
```

### Testing

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test
```

---

## 🚢 Deployment

### Production Build

#### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

#### Manual Deployment

**Frontend:**
```bash
cd frontend
npm run build
# Deploy dist/ folder to nginx/CDN
```

**Backend:**
```bash
cd backend
npm run build
# Deploy to Node.js server
```

### Environment Variables untuk Production

```env
# Production settings
NODE_ENV=production
VITE_API_URL=https://api.learncheck.yourdomain.com
GEMINI_API_KEY=your_production_api_key
REDIS_URL=redis://your-redis-host:6379

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Docker containers tidak start
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 2. Frontend tidak bisa connect ke backend
- Check CORS configuration di backend
- Verify `VITE_API_URL` di .env
- Check network connectivity: `docker-compose ps`

#### 3. LLM Service error (no API key)
- Set `GEMINI_API_KEY` di .env
- Atau gunakan mock mode (automatic fallback)

#### 4. Redis connection error
```bash
# Restart Redis
docker-compose restart redis

# Check Redis health
docker-compose exec redis redis-cli ping
```

#### 5. Port already in use
```bash
# Check ports
lsof -i :5000  # Frontend
lsof -i :3001  # Backend
lsof -i :6379  # Redis

# Kill process
kill -9 <PID>
```

### Debug Mode

Enable debug logging:

```bash
# Backend
DEBUG=learncheck:* npm run dev

# Frontend
VITE_DEBUG=true npm run dev
```

---

## 🤝 Contributing

Kami welcome contributions! Berikut guidelines-nya:

### Development Workflow

1. Fork repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

### Coding Standards

- Follow ESLint rules
- Write meaningful commit messages
- Add comments untuk complex logic
- Update README jika ada perubahan major

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Capstone Project Team - Dicoding Indonesia**

- **Developer**: [Your Name]
- **Mentor**: Mas Ben (AI Pair Programming Partner)
- **Organization**: Dicoding Indonesia

---

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for powerful language model
- [Dicoding Indonesia](https://www.dicoding.com/) for learning platform
- [Shadcn/UI](https://ui.shadcn.com/) for beautiful components
- All open-source contributors

---

## 📞 Support

Jika ada pertanyaan atau issue:

1. Check [Troubleshooting](#-troubleshooting) section
2. Open issue di GitHub
3. Contact team via Dicoding forum

---

**Made with ❤️ for Dicoding Learners**

