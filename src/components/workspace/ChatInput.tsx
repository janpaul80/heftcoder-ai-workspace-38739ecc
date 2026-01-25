import { useState, useRef, useCallback, useEffect } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceButton } from './VoiceButton';
import type { Attachment } from '@/types/workspace';
import hcIcon from '@/assets/hc-icon.png';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 56), 300);
      textarea.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleSend = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return;
    onSend(message, attachments);
    setMessage('');
    setAttachments([]);
  }, [message, attachments, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    <div className="border-t border-border bg-card p-4">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm"
            >
              <span className="text-muted-foreground">{attachment.name}</span>
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
      <div className="flex flex-col gap-3 p-3 bg-input rounded-xl border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
        {/* Text input - takes full width */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message HeftCoder"
          disabled={disabled}
          className="w-full min-h-[56px] max-h-[300px] resize-none bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-base leading-relaxed"
          rows={1}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
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
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
              title="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Agents indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm text-muted-foreground border border-primary/30 shadow-[0_0_15px_rgba(255,140,0,0.3),0_0_30px_rgba(255,140,0,0.15)]">
              <img src={hcIcon} alt="HeftCoder" className="h-7 w-7 rounded" />
              <span className="text-foreground font-medium">agents</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice input */}
            <VoiceButton
              onTranscript={handleVoiceTranscript}
              disabled={disabled}
            />

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={disabled || (!message.trim() && attachments.length === 0)}
              size="icon"
              className="h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
