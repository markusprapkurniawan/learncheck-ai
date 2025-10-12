import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Option {
  id: string;
  text: string;
}

interface QuestionCardProps {
  question: string;
  options: Option[];
  selectedAnswer: string;
  onAnswerSelect: (answerId: string) => void;
}

const QuestionCard = ({ question, options, selectedAnswer, onAnswerSelect }: QuestionCardProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground leading-relaxed">
          {question}
        </h2>
      </div>

      <RadioGroup value={selectedAnswer} onValueChange={onAnswerSelect} className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          return (
            <div
              key={option.id}
              className={`
                relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer
                transition-all duration-200 hover:border-primary/50
                ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background"
                }
              `}
            >
              <RadioGroupItem
                value={option.id}
                id={option.id}
                className="mt-0.5 flex-shrink-0"
              />
              <Label
                htmlFor={option.id}
                className="flex-1 cursor-pointer text-base leading-relaxed text-foreground"
              >
                <span className="font-medium mr-2">{option.id}.</span>
                {option.text}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default QuestionCard;
