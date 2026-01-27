import { Check, X, Sparkles, Clock, Layers, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ProjectPlan } from '@/types/orchestrator';
import { cn } from '@/lib/utils';

interface PlanApprovalCardProps {
  plan: ProjectPlan;
  onApprove: () => void;
  onReject: (feedback: string) => void;
  onAskQuestion: (question: string) => void;
}

export function PlanApprovalCard({ plan, onApprove, onReject, onAskQuestion }: PlanApprovalCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [question, setQuestion] = useState('');
  const isMobile = useIsMobile();

  const handleReject = () => {
    if (feedback.trim()) {
      onReject(feedback);
      setFeedback('');
      setShowFeedback(false);
    }
  };

  const handleAskQuestion = () => {
    if (question.trim()) {
      onAskQuestion(question);
      setQuestion('');
      setShowQuestion(false);
    }
  };

  return (
    <Card className={cn(
      "border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg shadow-primary/10 flex flex-col",
      isMobile ? "max-h-[50vh]" : "max-h-[70vh]"
    )}>
      <CardHeader className={cn("flex-shrink-0", isMobile ? "p-3 pb-2" : "pb-3")}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("rounded-lg bg-primary/10 flex-shrink-0", isMobile ? "p-1.5" : "p-2")}>
              <Sparkles className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-primary")} />
            </div>
            <div className="min-w-0">
              <CardTitle className={cn(isMobile ? "text-sm" : "text-lg", "truncate")}>
                {plan.projectName}
              </CardTitle>
              <CardDescription className={cn(isMobile ? "text-xs" : "text-sm")}>
                {plan.projectType} project
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={cn("flex-shrink-0", isMobile ? "text-[10px] px-1.5 py-0.5" : "text-xs")}>
            <Clock className={cn(isMobile ? "h-2.5 w-2.5" : "h-3 w-3", "mr-1")} />
            {plan.estimatedTime}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={cn(
        "space-y-3 overflow-y-auto scrollbar-thin flex-1 min-h-0",
        isMobile ? "px-3 pb-3" : "space-y-4"
      )}>
        {/* Description */}
        <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
          {plan.description}
        </p>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-1.5">
          {plan.techStack.frontend.map((tech) => (
            <Badge key={tech} variant="secondary" className={cn(isMobile ? "text-[10px] px-1.5 py-0" : "text-xs")}>
              {tech}
            </Badge>
          ))}
          {plan.techStack.backend.filter(t => t !== 'None').map((tech) => (
            <Badge key={tech} variant="secondary" className={cn(
              "bg-blue-500/10 text-blue-400",
              isMobile ? "text-[10px] px-1.5 py-0" : "text-xs"
            )}>
              {tech}
            </Badge>
          ))}
          {plan.techStack.database !== 'None' && (
            <Badge variant="secondary" className={cn(
              "bg-green-500/10 text-green-400",
              isMobile ? "text-[10px] px-1.5 py-0" : "text-xs"
            )}>
              {plan.techStack.database}
            </Badge>
          )}
        </div>

        {/* Build Steps */}
        <div className="space-y-2">
          <div className={cn("flex items-center gap-2 font-medium", isMobile ? "text-xs" : "text-sm")}>
            <Layers className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
            Build Steps
          </div>
          <ol className={cn("space-y-1 text-muted-foreground pl-4", isMobile ? "text-xs" : "text-sm")}>
            {plan.steps.slice(0, isMobile ? 4 : undefined).map((step, index) => (
              <li key={step.id} className="flex items-start gap-2">
                <span className={cn(
                  "flex-shrink-0 rounded-full bg-muted flex items-center justify-center font-medium",
                  isMobile ? "w-4 h-4 text-[10px]" : "w-5 h-5 text-xs"
                )}>
                  {index + 1}
                </span>
                <span className={cn(isMobile && "line-clamp-1")}>{step.task}</span>
              </li>
            ))}
            {isMobile && plan.steps.length > 4 && (
              <li className="text-muted-foreground/60 text-xs pl-6">
                +{plan.steps.length - 4} more steps...
              </li>
            )}
          </ol>
        </div>

        {/* Feedback Input */}
        {showFeedback && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Textarea
              placeholder="Tell me what you'd like to change..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className={cn("text-sm scrollbar-thin", isMobile ? "min-h-[60px]" : "min-h-[80px]")}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowFeedback(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleReject} disabled={!feedback.trim()}>
                Submit
              </Button>
            </div>
          </div>
        )}

        {/* Question Input */}
        {showQuestion && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Textarea
              placeholder="What would you like to know?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className={cn("text-sm scrollbar-thin", isMobile ? "min-h-[60px]" : "min-h-[80px]")}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowQuestion(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAskQuestion} disabled={!question.trim()}>
                Ask
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {!showFeedback && !showQuestion && (
        <CardFooter className={cn(
          "flex gap-2 flex-shrink-0 border-t border-border/30",
          isMobile ? "p-3 flex-col" : "pt-4"
        )}>
          <Button 
            onClick={onApprove} 
            className={cn(
              "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
              isMobile ? "w-full" : "flex-1"
            )}
            size={isMobile ? "sm" : "default"}
          >
            <Check className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4", "mr-2")} />
            Approve & Build
          </Button>
          <div className={cn("flex gap-2", isMobile && "w-full")}>
            <Button 
              variant="outline" 
              onClick={() => setShowFeedback(true)}
              className={isMobile ? "flex-1" : "flex-1"}
              size={isMobile ? "sm" : "default"}
            >
              <X className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4", isMobile ? "" : "mr-2")} />
              {!isMobile && "Request Changes"}
              {isMobile && "Changes"}
            </Button>
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              onClick={() => setShowQuestion(true)}
              className="flex-shrink-0"
              title="Ask a question"
            >
              <MessageSquare className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
