// ============================================================================
// LearnCheck - Adaptive Formative Assessment (Main Page)
// ============================================================================
// Displays AI-generated questions with adaptive difficulty based on user performance
// Integrates with Dicoding Classroom via iFrame
// ============================================================================

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import ProgressIndicator from "@/components/ProgressIndicator";
import QuestionCard from "@/components/QuestionCard";
import ResultCard from "@/components/ResultCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import IntroScreen from "@/components/IntroScreen";
import QuizHeader from "@/components/QuizHeader";
import Timer from "@/components/Timer";
import { ChevronLeft, ChevronRight, RotateCcw, Send, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, type Question, type UserPreferences } from "@/lib/api";
import { 
  saveAssessmentState, 
  loadAssessmentState, 
  clearAssessmentState,
  saveUserPreferences,
  loadUserPreferences 
} from "@/lib/storage";

const Index = () => {
  const { toast } = useToast();
  
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  const [hasStarted, setHasStarted] = useState(false);
  const [showRules, setShowRules] = useState(false); // Track if showing rules modal
  const [viewingHistoryIndex, setViewingHistoryIndex] = useState<number | null>(null); // Track which history to view
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [tutorialTitle, setTutorialTitle] = useState<string>("AI di Balik Layar: Integrasi AI di Back-End");
  const [attemptHistory, setAttemptHistory] = useState<any[]>([]);
  
  // Adaptive difficulty tracking
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  
  // Ref to prevent infinite loop
  const isGeneratingRef = useRef(false);

  // ========================================================================
  // URL PARAMETERS
  // ========================================================================
  // Get tutorial_id and user_id from query params (from Dicoding iFrame)
  // ========================================================================
  
  const urlParams = new URLSearchParams(window.location.search);
  const tutorialId = urlParams.get('tutorial_id') || '1';
  const userId = urlParams.get('user_id') || 'demo_user';

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const currentAnswer = userAnswers[currentQuestionIndex] || "";
  const quizDuration = 5; // 5 minutes

  // ========================================================================
  // LOAD SAVED STATE ON MOUNT
  // ========================================================================
  useEffect(() => {
    // Load saved assessment state if exists
    const savedState = loadAssessmentState(userId, tutorialId);
    if (savedState && !savedState.isSubmitted) {
      setUserAnswers(savedState.answers);
      setCurrentQuestionIndex(savedState.currentQuestionIndex);
      
      toast({
        title: "Progress dimuat",
        description: "Melanjutkan dari terakhir kali",
      });
    }

    // Load user preferences
    const savedPreferences = loadUserPreferences(userId);
    if (savedPreferences) {
      setUserPreferences(savedPreferences);
      applyUserPreferences(savedPreferences);
    } else {
      // Fetch from API if not in localStorage
      fetchUserPreferences();
    }

    // Load attempt history
    const historyKey = `attempt_history_${userId}_${tutorialId}`;
    const savedHistory = localStorage.getItem(historyKey);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setAttemptHistory(parsedHistory);
      } catch (error) {
        // Silent fail - use empty history
      }
    }
  }, [tutorialId, userId]);

  // ========================================================================
  // AUTO-SAVE ANSWERS
  // ========================================================================
  useEffect(() => {
    if (hasStarted && Object.keys(userAnswers).length > 0) {
      saveAssessmentState(userId, tutorialId, userAnswers, currentQuestionIndex, isSubmitted);
    }
  }, [userAnswers, currentQuestionIndex, isSubmitted, hasStarted, userId, tutorialId]);

  // ========================================================================
  // FETCH USER PREFERENCES FROM API
  // ========================================================================
  const fetchUserPreferences = async () => {
    try {
      const preferences = await apiService.getUserPreferences(userId);
      setUserPreferences(preferences);
      saveUserPreferences(userId, preferences);
      applyUserPreferences(preferences);
    } catch (error) {
      // Silent fail - use defaults
    }
  };

  // ========================================================================
  // APPLY USER PREFERENCES TO UI
  // ========================================================================
  // ========================================================================
  
  const applyUserPreferences = (prefs: UserPreferences) => {
    const root = document.documentElement;
    
    // Apply theme
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply font size
    if (prefs.fontSize === 'large') {
      root.style.fontSize = '18px';
    } else if (prefs.fontSize === 'small') {
      root.style.fontSize = '14px';
    } else {
      root.style.fontSize = '16px';
    }

    // Apply layout width
    if (prefs.layoutWidth === 'fullWidth') {
      root.classList.add('layout-full-width');
    } else {
      root.classList.remove('layout-full-width');
    }
  };

  // ========================================================================
  // GENERATE QUESTIONS ON INITIAL MOUNT ONLY
  // ========================================================================
  // Uses ref to prevent infinite loop - only generates once on mount
  // ========================================================================
  
  useEffect(() => {
    // Prevent multiple generation calls
    if (isGeneratingRef.current || questions.length > 0) {
      return;
    }

    isGeneratingRef.current = true;

    const generateQuestionsFromAPI = async () => {
      setIsGeneratingQuestions(true);
      setApiError(null);
      
      try {
        // 1. Fetch tutorial content from mock Dicoding API
        const tutorial = await apiService.getTutorial(tutorialId);
        
        // Save tutorial title for intro screen
        setTutorialTitle(tutorial.title);

        // 2. Generate questions via LLM with adaptive difficulty
        const response = await apiService.generateQuestions({
          content: tutorial.content,
          difficulty: currentDifficulty,
          questionCount: 3,
          language: 'id',
          tutorialTitle: tutorial.title,
          attemptNumber, // For cache busting
          previousScore: previousScore || undefined, // For adaptive difficulty
          userId // For personalized questions
        });

        // 3. Handle response
        if (response.data?.questions && response.data.questions.length > 0) {
          setQuestions(response.data.questions);
          
          toast({
            title: response.fallback ? "Menggunakan Soal Demo 📝" : "Soal AI Berhasil Dibuat! 🤖",
            description: `${response.data.questions.length} soal ${response.fallback ? 'demo' : 'AI'} siap dikerjakan (${response.difficulty || currentDifficulty})`,
            variant: response.fallback ? "default" : "default"
          });
        } else {
          throw new Error('No questions in response');
        }

      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Unknown error');
        isGeneratingRef.current = false; // Reset on error
        
        toast({
          title: "❌ Gagal Generate Soal AI",
          description: "Backend API tidak tersedia. Cek koneksi backend!",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingQuestions(false);
      }
    };

    generateQuestionsFromAPI();
  }, [tutorialId]); // Only run once on mount - tutorialId is static from URL
  
  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleAnswerSelect = (answerId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answerId,
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleReset = () => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: "",
    }));
    // Auto-save akan trigger via useEffect
  };

  const handleSubmit = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      
      // Save final state
      saveAssessmentState(userId, tutorialId, userAnswers, currentQuestionIndex, true);
      
      // Calculate and save to history
      const score = calculateScore();
      const newHistoryEntry = {
        attemptNumber: attemptNumber,
        score: score,
        totalQuestions: questions.length,
        difficulty: currentDifficulty,
        timestamp: new Date().toISOString(),
        questions: questions, // Save questions for history view
        userAnswers: userAnswers // Save user answers for history view
      };
      
      const historyKey = `attempt_history_${userId}_${tutorialId}`;
      const updatedHistory = [...attemptHistory, newHistoryEntry];
      setAttemptHistory(updatedHistory);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      
      toast({
        title: "Kuis selesai! ✅",
        description: "Jawaban Anda telah tersimpan.",
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (!isSubmitted) {
      toast({
        title: "Waktu habis!",
        description: "Kuis akan otomatis disubmit.",
        variant: "destructive",
      });
      handleSubmit();
    }
  };

  const handleExit = () => {
    // Clear state and redirect back to parent (Dicoding)
    clearAssessmentState(userId, tutorialId);
    
    toast({
      title: "Keluar dari kuis",
      description: "Terima kasih telah mengerjakan kuis.",
    });
    
    setTimeout(() => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'LEARNCHECK_EXIT' }, '*');
      } else {
        window.location.href = '/';
      }
    }, 1000);
  };

  const handleStart = () => {
    if (questions.length === 0 || isGeneratingQuestions) {
      toast({
        title: "Soal belum siap",
        description: "Soal sedang disiapkan, coba lagi sebentar...",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setHasStarted(true);
      setIsLoading(false);
    }, 500);
  };

  const handleTryAgain = async () => {
    setIsLoading(true);
    
    // ========================================================================
    // CALCULATE ADAPTIVE DIFFICULTY BASED ON PREVIOUS SCORE
    // ========================================================================
    
    const score = calculateScore();
    const scorePercentage = (score / questions.length) * 100;
    setPreviousScore(scorePercentage);
    
    let nextDifficulty = currentDifficulty;
    
    // Adjust difficulty based on performance
    if (scorePercentage >= 80 && currentDifficulty !== 'hard') {
      nextDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
    } else if (scorePercentage <= 40 && currentDifficulty !== 'easy') {
      nextDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
    }
    
    setCurrentDifficulty(nextDifficulty);
    
    // Clear saved state
    clearAssessmentState(userId, tutorialId);
    
    // Reset state
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setIsSubmitted(false);
    setHasStarted(false);
    
    // Increment attempt number for cache busting
    const nextAttempt = attemptNumber + 1;
    setAttemptNumber(nextAttempt);
    
    // ========================================================================
    // GENERATE NEW QUESTIONS WITH ADAPTIVE DIFFICULTY
    // ========================================================================
    
    try {
      setIsGeneratingQuestions(true);
      
      const tutorial = await apiService.getTutorial(tutorialId);
      const response = await apiService.generateQuestions({
        content: tutorial.content,
        difficulty: nextDifficulty,
        questionCount: 3,
        language: 'id',
        tutorialTitle: tutorial.title,
        attemptNumber: nextAttempt,
        previousScore: scorePercentage,
        userId
      });

      if (response.data?.questions && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
        
        const difficultyEmoji = nextDifficulty === 'hard' ? '🔥' : nextDifficulty === 'easy' ? '🌱' : '⚡';
        
        toast({
          title: `Soal baru berhasil dibuat! ${difficultyEmoji}`,
          description: `${response.data.questions.length} soal AI (${nextDifficulty}) siap dikerjakan`,
        });
      } else {
        throw new Error('No questions generated');
      }
    } catch (error) {
      
      toast({
        title: "❌ Gagal membuat soal baru",
        description: "Backend API error. Coba lagi!",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuestions(false);
      setIsLoading(false);  
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  // ========================================================================
  // RENDER: Loading screen with countdown
  // ========================================================================
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <LoadingSpinner 
            message={
              isSubmitted 
                ? "Memproses jawaban Anda..." 
                : hasStarted 
                ? "Menyiapkan soal baru..." 
                : isGeneratingQuestions
                ? "🤖 AI sedang membuat soal khusus untuk Anda..."
                : "Memuat kuis..."
            }
            showCountdown={isGeneratingQuestions && !hasStarted}
            estimatedSeconds={15}
          />
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER: Show IntroScreen before quiz starts
  // ========================================================================
  
  if (!hasStarted && viewingHistoryIndex === null) {
    return (
      <IntroScreen 
        onStart={handleStart} 
        totalQuestions={totalQuestions}
        duration={quizDuration}
        courseName={tutorialTitle}
        isGenerating={isGeneratingQuestions}
        estimatedGenerationTime={15}
        attemptHistory={attemptHistory}
        onViewDetail={(index) => setViewingHistoryIndex(index)}
      />
    );
  }

  // ========================================================================
  // RENDER: Show history detail (result cards from previous attempt)
  // ========================================================================
  
  if (viewingHistoryIndex !== null) {
    const historyAttempt = attemptHistory[viewingHistoryIndex];
    
    // Check if this history has questions data (new format)
    if (!historyAttempt.questions || !historyAttempt.userAnswers) {
      // Old format without questions data - show error message
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <QuizHeader 
            title="Detail Riwayat Exam" 
            onBack={() => setViewingHistoryIndex(null)}
            showBackButton={true}
          />
          <div className="flex-1 px-4 py-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">Detail Tidak Tersedia</h2>
                <p className="text-muted-foreground mb-4">
                  Maaf, detail untuk riwayat ini tidak tersedia karena menggunakan format lama. 
                  Silakan coba lagi dengan mengerjakan kuis baru.
                </p>
                <Button onClick={() => setViewingHistoryIndex(null)} size="lg" variant="outline">
                  Kembali ke Riwayat
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    const score = historyAttempt.score;
    const percentage = Math.round((score / historyAttempt.totalQuestions) * 100);
    const isPassed = percentage >= 80;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <QuizHeader 
          title="Detail Riwayat Exam" 
          onBack={() => setViewingHistoryIndex(null)}
          showBackButton={true}
        />

        {/* Main content */}
        <div className="flex-1 px-4 py-6">
          <div className="max-w-3xl mx-auto">
            {/* Score summary card */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Total soal</h2>
                  <div className="text-5xl font-bold text-primary mb-2">{historyAttempt.totalQuestions}</div>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-semibold text-foreground mb-2">Score</h2>
                  <div className="text-5xl font-bold text-success">{score * 20}</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className={`text-base font-medium ${isPassed ? 'text-success' : 'text-error'}`}>
                  {isPassed 
                    ? 'Selamat! Anda telah lulus dari ujian ini.' 
                    : 'Maaf, Anda belum memenuhi standar kelulusan.'}
                </p>
              </div>
            </div>

            {/* Category label for results */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">
                Kategori: {tutorialTitle}
              </h3>
            </div>

            {/* Result cards - from history */}
            <div className="space-y-4 mb-6">
              {historyAttempt.questions.map((question: any, index: number) => (
                <ResultCard
                  key={question.id}
                  questionNumber={index + 1}
                  question={question.question}
                  options={question.options}
                  userAnswer={historyAttempt.userAnswers[index] || ""}
                  correctAnswer={question.correctAnswer}
                  explanation={question.explanation}
                />
              ))}
            </div>

            {/* Back button */}
            <div className="flex justify-center gap-3 pb-6">
              <Button onClick={() => setViewingHistoryIndex(null)} size="lg" variant="outline">
                Kembali ke Riwayat
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER: Show results after submission
  // ========================================================================
  
  if (isSubmitted) {
    const score = calculateScore();
    const percentage = Math.round((score / totalQuestions) * 100);
    const isPassed = percentage >= 80; // Passing score 80%

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <QuizHeader 
          title="Hasil Exam" 
          onBack={handleExit}
          showBackButton={true}
        />

        {/* Main content */}
        <div className="flex-1 px-4 py-6">
          <div className="max-w-3xl mx-auto">
            {/* Score summary card */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Total soal</h2>
                  <div className="text-5xl font-bold text-primary mb-2">{totalQuestions}</div>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-semibold text-foreground mb-2">Score</h2>
                  <div className="text-5xl font-bold text-success">{score * 20}</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className={`text-base font-medium ${isPassed ? 'text-success' : 'text-error'}`}>
                  {isPassed 
                    ? 'Selamat! Anda telah lulus dari ujian ini.' 
                    : 'Maaf, Anda belum memenuhi standar kelulusan.'}
                </p>
              </div>
            </div>

            {/* Category label for results */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">
                Kategori: {tutorialTitle}
              </h3>
            </div>

            {/* Result cards - preserved with explanations as requested */}
            <div className="space-y-4 mb-6">
              {questions.map((question, index) => (
                <ResultCard
                  key={question.id}
                  questionNumber={index + 1}
                  question={question.question}
                  options={question.options}
                  userAnswer={userAnswers[index] || ""}
                  correctAnswer={question.correctAnswer}
                  explanation={question.explanation}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-3 pb-6">
              <Button onClick={handleTryAgain} size="lg" variant="outline">
                Coba Lagi
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Indicator with timer on the right */}
      <div className="bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Category label */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Soal kategori: <span className="font-medium text-foreground">{tutorialTitle}</span>
            </span>
            {/* Timer on the right */}
            <Timer duration={quizDuration} onTimeUp={handleTimeUp} />
          </div>
          
          {/* Clickable numbered boxes - horizontal compact layout */}
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: totalQuestions }).map((_, index) => {
              const questionNumber = index + 1;
              const isCurrentQuestion = index === currentQuestionIndex;
              const isAnswered = Object.keys(userAnswers).map(Number).includes(index);
              
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`
                    w-10 h-10 rounded border-2 
                    flex items-center justify-center
                    transition-all duration-200
                    text-sm font-semibold
                    cursor-pointer hover:scale-105
                    ${isCurrentQuestion 
                      ? 'border-primary bg-primary text-white shadow-sm' 
                      : isAnswered
                      ? 'border-border bg-card text-foreground'
                      : 'border-border bg-background text-muted-foreground'
                    }
                  `}
                  title={
                    isCurrentQuestion 
                      ? 'Soal saat ini' 
                      : isAnswered 
                      ? `Soal ${questionNumber} - Sudah dijawab` 
                      : `Soal ${questionNumber} - Belum dijawab`
                  }
                >
                  {questionNumber}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Question Card - preserved as requested */}
          <QuestionCard
            question={currentQuestion.question}
            options={currentQuestion.options}
            selectedAnswer={currentAnswer}
            onAnswerSelect={handleAnswerSelect}
          />

          {/* Navigation buttons - simplified Dicoding style */}
          <div className="flex items-center justify-between mt-6">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              size="lg"
            >
              Sebelumnya
            </Button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!currentAnswer}
                size="lg"
              >
                Selanjutnya
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={Object.keys(userAnswers).length < totalQuestions}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                Submit
              </Button>
            )}
          </div>

          {/* Answer progress counter */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {Object.keys(userAnswers).length} dari {totalQuestions} pertanyaan terjawab
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
