import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Message } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

// Simple code block component
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');
  const shouldShowCollapse = lines.length > 10;

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border">
        <span className="text-xs text-muted-foreground">{language || 'code'}</span>
        <div className="flex items-center gap-1">
          {shouldShowCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-model-openai" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "p-4 bg-black/30 overflow-x-auto font-mono text-sm transition-all",
          collapsed && "max-h-20 overflow-hidden"
        )}
      >
        <pre className="text-foreground/90">
          <code>{code}</code>
        </pre>
      </div>
      {collapsed && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

// Parse content for code blocks and markdown
function parseContent(content: string) {
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }
    // Add code block
    parts.push({
      type: 'code',
      language: match[1],
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const parts = parseContent(message.content);

  return (
    <div
      className={cn(
        "flex w-full animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-chat-ai text-foreground rounded-bl-md"
        )}
      >
        {parts.map((part, index) =>
          part.type === 'code' ? (
            <CodeBlock key={index} code={part.content} language={part.language} />
          ) : (
            <p key={index} className="whitespace-pre-wrap leading-relaxed">
              {part.content}
            </p>
          )
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
            {message.attachments.map((attachment) => (
              <span
                key={attachment.id}
                className="text-xs px-2 py-1 bg-black/20 rounded"
              >
                📎 {attachment.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
