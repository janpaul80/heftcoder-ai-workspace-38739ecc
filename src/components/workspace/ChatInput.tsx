import { useState, useRef, useCallback } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelector, MODELS } from './ModelSelector';
import { VoiceButton } from './VoiceButton';
import type { AIModel, Attachment } from '@/types/workspace';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[], model: AIModel) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel>(MODELS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return;
    onSend(message, attachments, selectedModel);
    setMessage('');
    setAttachments([]);
  }, [message, attachments, selectedModel, onSend]);

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

      {/* Input row */}
      <div className="flex items-end gap-2">
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
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
          title="Attach files"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Model selector */}
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to build..."
          disabled={disabled}
          className="flex-1 min-h-[36px] max-h-[200px] resize-none bg-input border-border focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          rows={1}
        />

        {/* Voice input */}
        <VoiceButton
          onTranscript={handleVoiceTranscript}
          disabled={disabled}
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
