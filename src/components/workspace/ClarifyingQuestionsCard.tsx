import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MessageCircleQuestion, Send, Sparkles } from 'lucide-react';
import type { ClarifyingQuestion } from '@/types/orchestrator';
import { cn } from '@/lib/utils';

interface ClarifyingQuestionsCardProps {
  questions: ClarifyingQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  isLoading?: boolean;
}

export function ClarifyingQuestionsCard({ 
  questions, 
  onSubmit,
  isLoading = false
}: ClarifyingQuestionsCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const allAnswered = questions.every(q => answers[q.id]);

  const handleSubmit = () => {
    if (allAnswered) {
      onSubmit(answers);
    }
  };

  return (
    <div className="p-4 bg-gradient-to-br from-violet-500/10 via-card to-purple-500/10 rounded-xl border border-violet-500/20 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-violet-500/20">
          <MessageCircleQuestion className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">Quick Questions</h4>
          <p className="text-xs text-muted-foreground">Help me understand your needs better</p>
        </div>
        <Sparkles className="h-4 w-4 text-violet-400 animate-pulse ml-auto" />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div 
            key={question.id}
            className={cn(
              "p-3 rounded-lg bg-card/50 border border-border/50 transition-all",
              answers[question.id] && "border-violet-500/30 bg-violet-500/5"
            )}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-semibold text-violet-400 shrink-0">
                {index + 1}
              </span>
              <p className="text-sm font-medium text-foreground">{question.question}</p>
            </div>
            
            {question.options && question.type === 'choice' && (
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => setAnswers(prev => ({ ...prev, [question.id]: value }))}
                className="ml-7 space-y-1.5"
              >
                {question.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option} 
                      id={`${question.id}-${option}`}
                      className="border-violet-400/50 text-violet-500"
                    />
                    <Label 
                      htmlFor={`${question.id}-${option}`}
                      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {Object.keys(answers).length}/{questions.length} answered
        </span>
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || isLoading}
          className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Processing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
