import { useState, useRef } from 'react';
import { Wand2, Send, RotateCcw, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Attachment } from '@/types/workspace';
import { VoiceButton } from './VoiceButton';

interface RefinePanelProps {
  onRefine: (feedback: string, attachments?: Attachment[]) => void;
  onStartOver: () => void;
  isRefining?: boolean;
}

// Design refinements
const DESIGN_REFINEMENTS = [
  "Make it more modern and minimal",
  "Add more visual impact with animations",
  "Make the colors bolder and vibrant",
  "Add a dark mode version",
];

// Backend/Full-stack refinements
const BACKEND_REFINEMENTS = [
  "Add user authentication",
  "Add database storage",
  "Connect to external API",
  "Add payment processing",
];

// Combined for display
const QUICK_REFINEMENTS = [...DESIGN_REFINEMENTS, ...BACKEND_REFINEMENTS];

// Shorter labels for mobile
const QUICK_REFINEMENTS_SHORT = [
  "Modern style",
  "Animations",
  "Bold colors",
  "Dark mode",
  "Add auth",
  "Add database",
  "External API",
  "Payments",
];

export function RefinePanel({ onRefine, onStartOver, isRefining }: RefinePanelProps) {
  const [customFeedback, setCustomFeedback] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const handleSubmit = () => {
    if (customFeedback.trim() || attachments.length > 0) {
      onRefine(customFeedback, attachments);
      setCustomFeedback('');
      setAttachments([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => {
      let type: Attachment['type'] = 'code';
      if (file.type.includes('pdf')) type = 'pdf';
      else if (file.type.includes('image')) type = 'image';
      else if (file.name.endsWith('.zip')) type = 'zip';
      else if (file.name.includes('figma')) type = 'figma';

      return {
        id: crypto.randomUUID(),
        name: file.name,
        type,
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleVoiceTranscript = (text: string) => {
    setCustomFeedback(text);
    textareaRef.current?.focus();
  };

  const refinements = isMobile ? QUICK_REFINEMENTS_SHORT : QUICK_REFINEMENTS;
  const fullRefinements = QUICK_REFINEMENTS;

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

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 px-2 py-1 bg-secondary rounded-lg text-xs"
              >
                <span className="text-muted-foreground truncate max-w-[100px]">
                  {attachment.name}
                </span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Custom feedback with file and voice input */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              placeholder={isMobile ? "Describe changes..." : "Describe specific changes you'd like..."}
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              className={cn(
                "w-full resize-none bg-background border border-input rounded-md px-3 py-2 pr-20 text-sm scrollbar-thin focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isMobile ? "min-h-[50px]" : "min-h-[60px]"
              )}
              disabled={isRefining}
            />
            
            {/* Input toolbar - positioned inside textarea */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {/* File attachment */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip,.js,.ts,.tsx,.jsx,.py,.html,.css,.fig,.figma"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRefining}
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                title="Attach files (images, PDFs, code)"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {/* Voice input - reuse VoiceButton component */}
              <VoiceButton
                onTranscript={handleVoiceTranscript}
                disabled={isRefining}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={(!customFeedback.trim() && attachments.length === 0) || isRefining}
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
