import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  duration: number; // in minutes
  onTimeUp: () => void;
}

const Timer = ({ duration, onTimeUp }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // convert to seconds

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isWarning = timeLeft <= 60; // last minute warning

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
        isWarning
          ? "bg-error-light border-error text-error"
          : "bg-card border-border text-foreground"
      }`}
    >
      <Clock className="w-4 h-4" />
      <span className="font-mono font-semibold">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
};

export default Timer;
