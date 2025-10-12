import { Check, X } from "lucide-react";

interface Option {
  id: string;
  text: string;
}

interface ResultCardProps {
  questionNumber: number;
  question: string;
  options: Option[];
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}

const ResultCard = ({
  questionNumber,
  question,
  options,
  userAnswer,
  correctAnswer,
  explanation,
}: ResultCardProps) => {
  const isCorrect = userAnswer === correctAnswer;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            ${isCorrect ? "bg-success text-success-foreground" : "bg-error text-error-foreground"}
          `}
        >
          {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Pertanyaan {questionNumber}
          </h3>
          <p className="text-base text-foreground leading-relaxed">{question}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4 ml-11">
        {options.map((option) => {
          const isUserAnswer = option.id === userAnswer;
          const isCorrectOption = option.id === correctAnswer;

          let bgColor = "bg-background";
          let borderColor = "border-border";
          let icon = null;

          if (isCorrectOption) {
            bgColor = "bg-success-light";
            borderColor = "border-success";
            icon = <Check className="w-4 h-4 text-success" />;
          } else if (isUserAnswer && !isCorrect) {
            bgColor = "bg-error-light";
            borderColor = "border-error";
            icon = <X className="w-4 h-4 text-error" />;
          }

          return (
            <div
              key={option.id}
              className={`
                flex items-center gap-2 p-3 rounded-lg border-2
                ${bgColor} ${borderColor}
              `}
            >
              {icon && <div className="flex-shrink-0">{icon}</div>}
              <span className="text-sm">
                <span className="font-medium mr-2">{option.id}.</span>
                {option.text}
              </span>
            </div>
          );
        })}
      </div>

      <div className="ml-11 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-start gap-2">
          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-1">Penjelasan</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
