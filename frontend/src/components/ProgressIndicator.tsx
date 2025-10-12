// ============================================================================
// ProgressIndicator Component - Dicoding Style
// ============================================================================
// Displays numbered boxes for each question - compact horizontal layout
// Clean dan minimalis mengikuti design Dicoding
// ============================================================================

interface ProgressIndicatorProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions?: number[]; // Array of question indices that have been answered
  onQuestionClick?: (questionIndex: number) => void; // Callback when user clicks a question number
  category?: string; // Category name (e.g., "Persiapan Belajar Wajib")
}

const ProgressIndicator = ({ 
  currentQuestion, 
  totalQuestions,
  answeredQuestions = [],
  onQuestionClick,
  category = "Persiapan Belajar Wajib"
}: ProgressIndicatorProps) => {
  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Category label */}
        <div className="mb-3">
          <span className="text-sm text-muted-foreground">
            Soal kategori: <span className="font-medium text-foreground">{category}</span>
          </span>
        </div>
        
        {/* Clickable numbered boxes - horizontal compact layout */}
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from({ length: totalQuestions }).map((_, index) => {
            const questionNumber = index + 1;
            const isCurrentQuestion = index === currentQuestion - 1;
            const isAnswered = answeredQuestions.includes(index);
            
            return (
              <button
                key={index}
                onClick={() => onQuestionClick?.(index)}
                disabled={!onQuestionClick}
                className={`
                  w-10 h-10 rounded border-2 
                  flex items-center justify-center
                  transition-all duration-200
                  text-sm font-semibold
                  ${!onQuestionClick ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
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
  );
};

export default ProgressIndicator;
