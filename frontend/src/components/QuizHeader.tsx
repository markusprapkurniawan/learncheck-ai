// ============================================================================
// QuizHeader Component - Dicoding Style
// ============================================================================
// Simple header dengan back arrow dan judul, mengikuti design Dicoding
// ============================================================================

import { ChevronLeft } from "lucide-react";

interface QuizHeaderProps {
  title?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const QuizHeader = ({ 
  title = "Latihan Kuis", 
  onBack,
  showBackButton = true 
}: QuizHeaderProps) => {
  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-accent/50 transition-colors"
            aria-label="Kembali"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        
        <h1 className="text-lg font-semibold text-foreground">
          {title}
        </h1>
      </div>
    </div>
  );
};

export default QuizHeader;
