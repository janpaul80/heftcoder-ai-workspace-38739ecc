import { useState, useRef, useCallback, useEffect } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceButton } from './VoiceButton';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Attachment } from '@/types/workspace';
import hcIcon from '@/assets/hc-icon.png';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = isMobile ? 150 : 300;
      const newHeight = Math.min(Math.max(textarea.scrollHeight, isMobile ? 44 : 56), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [message, isMobile]);

  const handleSend = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return;
    onSend(message, attachments);
    setMessage('');
    setAttachments([]);
  }, [message, attachments, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // On mobile, Enter creates new line; on desktop, Enter sends
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSend();
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

  const handleVoiceTranscript = (text: string) => {
    setMessage(text);
    textareaRef.current?.focus();
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className={cn(
      "border-t border-border bg-card",
      isMobile ? "p-2 pb-safe" : "p-4"
    )}>
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 px-2 py-1 bg-secondary rounded-lg text-xs sm:text-sm"
            >
              <span className="text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                {attachment.name}
              </span>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input container */}
      <div className={cn(
        "flex flex-col gap-2 bg-input rounded-xl border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all",
        isMobile ? "p-2" : "p-3"
      )}>
        {/* Text input - takes full width */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isMobile ? "Message..." : "Message HeftCoder"}
          disabled={disabled}
          className={cn(
            "w-full resize-none bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 leading-relaxed scrollbar-thin",
            isMobile 
              ? "min-h-[44px] max-h-[150px] text-base" 
              : "min-h-[56px] max-h-[300px] text-base"
          )}
          rows={1}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Attachment button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.gif,.zip,.js,.ts,.tsx,.jsx,.py,.html,.css,.fig,.figma"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                "shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary",
                isMobile ? "h-9 w-9" : "h-8 w-8"
              )}
              title="Attach files"
            >
              <Paperclip className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            </Button>

            {/* Agents indicator - smaller on mobile */}
            <div className={cn(
              "flex items-center gap-1.5 sm:gap-2 bg-secondary rounded-lg text-muted-foreground border border-primary/30 shadow-[0_0_15px_rgba(255,140,0,0.3),0_0_30px_rgba(255,140,0,0.15)]",
              isMobile ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
            )}>
              <img 
                src={hcIcon} 
                alt="HeftCoder" 
                className={cn(isMobile ? "h-5 w-5" : "h-7 w-7", "rounded")} 
              />
              <span className="text-foreground font-medium">agents</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Voice input - hide label on mobile */}
            <VoiceButton
              onTranscript={handleVoiceTranscript}
              disabled={disabled}
            />

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={disabled || (!message.trim() && attachments.length === 0)}
              size="icon"
              className={cn(
                "bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg",
                isMobile ? "h-9 w-9" : "h-8 w-8"
              )}
            >
              <Send className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
