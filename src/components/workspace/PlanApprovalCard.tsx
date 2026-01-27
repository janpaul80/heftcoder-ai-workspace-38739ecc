import { Check, X, Sparkles, Clock, Layers, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import type { ProjectPlan } from '@/types/orchestrator';

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
    <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg shadow-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{plan.projectName}</CardTitle>
              <CardDescription className="text-sm">{plan.projectType} project</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {plan.estimatedTime}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground">{plan.description}</p>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2">
          {plan.techStack.frontend.map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
          {plan.techStack.backend.filter(t => t !== 'None').map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs bg-blue-500/10 text-blue-400">
              {tech}
            </Badge>
          ))}
          {plan.techStack.database !== 'None' && (
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-400">
              {plan.techStack.database}
            </Badge>
          )}
        </div>

        {/* Build Steps */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layers className="h-4 w-4" />
            Build Steps
          </div>
          <ol className="space-y-1.5 text-sm text-muted-foreground pl-4">
            {plan.steps.map((step, index) => (
              <li key={step.id} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <span>{step.task}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Feedback Input */}
        {showFeedback && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Textarea
              placeholder="Tell me what you'd like to change..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowFeedback(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleReject} disabled={!feedback.trim()}>
                Submit Changes
              </Button>
            </div>
          </div>
        )}

        {/* Question Input */}
        {showQuestion && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Textarea
              placeholder="What would you like to know before we start?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[80px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowQuestion(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAskQuestion} disabled={!question.trim()}>
                Ask Question
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {!showFeedback && !showQuestion && (
        <CardFooter className="flex gap-2 pt-0">
          <Button 
            onClick={onApprove} 
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Check className="h-4 w-4 mr-2" />
            Approve & Build
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFeedback(true)}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Request Changes
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowQuestion(true)}
            className="flex-shrink-0"
            title="Ask a question"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
