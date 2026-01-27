import { useState } from 'react';
import { Wand2, Send, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export function RefinePanel({ onRefine, onStartOver, isRefining }: RefinePanelProps) {
  const [customFeedback, setCustomFeedback] = useState('');

  const handleSubmit = () => {
    if (customFeedback.trim()) {
      onRefine(customFeedback);
      setCustomFeedback('');
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          Refine Your Design
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick refinements */}
        <div className="flex flex-wrap gap-2">
          {QUICK_REFINEMENTS.map((refinement) => (
            <Button
              key={refinement}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onRefine(refinement)}
              disabled={isRefining}
            >
              {refinement}
            </Button>
          ))}
        </div>

        {/* Custom feedback */}
        <div className="space-y-2">
          <Textarea
            placeholder="Describe specific changes you'd like..."
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value)}
            className="min-h-[60px] text-sm"
            disabled={isRefining}
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!customFeedback.trim() || isRefining}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isRefining ? 'Refining...' : 'Apply Changes'}
            </Button>
            <Button 
              variant="ghost" 
              onClick={onStartOver}
              disabled={isRefining}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
