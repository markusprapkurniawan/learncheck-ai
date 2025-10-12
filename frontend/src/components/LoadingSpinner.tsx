// ============================================================================
// LoadingSpinner Component - Enhanced with Countdown Timer
// ============================================================================
// Shows loading animation with optional countdown timer for AI question generation
// ============================================================================

import { Loader2, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface LoadingSpinnerProps {
  message?: string;
  showCountdown?: boolean;
  estimatedSeconds?: number;
  onCountdownComplete?: () => void;
}

const LoadingSpinner = ({ 
  message = "Memuat...", 
  showCountdown = false,
  estimatedSeconds = 15,
  onCountdownComplete
}: LoadingSpinnerProps) => {
  const [countdown, setCountdown] = useState(estimatedSeconds);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!showCountdown) return;

    // Reset countdown when estimatedSeconds changes
    setCountdown(estimatedSeconds);
    setProgress(0);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCountdownComplete?.();
          return 0;
        }
        return prev - 1;
      });

      setProgress((prev) => {
        const increment = 100 / estimatedSeconds;
        return Math.min(prev + increment, 100);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showCountdown, estimatedSeconds, onCountdownComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-accent/30 rounded-full animate-pulse" />
      </div>
      
      <p className="mt-4 text-base font-medium text-muted-foreground animate-pulse">
        {message}
      </p>

      {showCountdown && countdown > 0 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg font-semibold text-primary">
              {countdown}s
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            🤖 AI sedang membuat soal berkualitas...
          </p>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
