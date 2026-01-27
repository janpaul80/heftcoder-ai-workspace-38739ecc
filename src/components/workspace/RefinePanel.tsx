import { useState } from 'react';
import { Wand2, Send, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface RefinePanelProps {
  onRefine: (feedback: string) => void;
  onStartOver: () => void;
  isRefining?: boolean;
}

const QUICK_REFINEMENTS = [
  "Make it more modern and minimal",
  "Add more visual impact with animations",
  "Make the colors bolder and more vibrant",
  "Improve mobile responsiveness",
  "Add a dark mode version",
  "Make the hero section more engaging",
];

// Shorter labels for mobile
const QUICK_REFINEMENTS_SHORT = [
  "More modern",
  "Add animations",
  "Bolder colors",
  "Better mobile",
  "Dark mode",
  "Better hero",
];

export function RefinePanel({ onRefine, onStartOver, isRefining }: RefinePanelProps) {
  const [customFeedback, setCustomFeedback] = useState('');
  const isMobile = useIsMobile();

  const handleSubmit = () => {
    if (customFeedback.trim()) {
      onRefine(customFeedback);
      setCustomFeedback('');
    }
  };

  const refinements = isMobile ? QUICK_REFINEMENTS_SHORT : QUICK_REFINEMENTS;
  const fullRefinements = QUICK_REFINEMENTS; // Always send full text

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className={cn("pb-2", isMobile && "px-3 py-2")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile ? "text-sm" : "text-base")}>
          <Wand2 className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4", "text-primary")} />
          Refine Your Design
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-3", isMobile && "px-3 pb-3")}>
        {/* Quick refinements */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {refinements.map((refinement, index) => (
            <Button
              key={refinement}
              variant="outline"
              size="sm"
              className={cn(
                "h-auto py-1.5",
                isMobile ? "text-[10px] px-2" : "text-xs"
              )}
              onClick={() => onRefine(fullRefinements[index])}
              disabled={isRefining}
            >
              {refinement}
            </Button>
          ))}
        </div>

        {/* Custom feedback */}
        <div className="space-y-2">
          <Textarea
            placeholder={isMobile ? "Describe changes..." : "Describe specific changes you'd like..."}
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value)}
            className={cn(
              "text-sm scrollbar-thin",
              isMobile ? "min-h-[50px]" : "min-h-[60px]"
            )}
            disabled={isRefining}
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!customFeedback.trim() || isRefining}
              className="flex-1"
              size={isMobile ? "sm" : "default"}
            >
              <Send className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4", "mr-2")} />
              {isRefining ? 'Refining...' : 'Apply'}
            </Button>
            <Button 
              variant="ghost" 
              onClick={onStartOver}
              disabled={isRefining}
              size={isMobile ? "sm" : "default"}
            >
              <RotateCcw className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4", isMobile ? "" : "mr-2")} />
              {!isMobile && "Start Over"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
