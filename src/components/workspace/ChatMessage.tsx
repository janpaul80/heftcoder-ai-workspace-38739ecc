import { useState, memo } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, User, RotateCcw, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Message } from '@/types/workspace';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import heftcoderLogo from '@/assets/heftcoder-logo.png';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onFeedback?: (type: 'positive' | 'negative') => void;
}

// Simple code block component with syntax highlighting placeholder
const CodeBlock = memo(function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');
  const shouldShowCollapse = lines.length > 12;

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-border group">
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border">
        <span className="text-xs text-muted-foreground font-medium">{language || 'code'}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "p-4 bg-black/40 overflow-x-auto font-mono text-sm transition-all duration-200",
          collapsed && "max-h-24 overflow-hidden"
        )}
      >
        <pre className="text-foreground/90 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
      {collapsed && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      )}
    </div>
  );
});

// Inline code component
function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-secondary/80 text-primary rounded text-sm font-mono">
      {children}
    </code>
  );
}

// Markdown renderer for assistant messages
const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code: ({ className, children }) => {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !className;
          
          if (isInline) {
            return <InlineCode>{children}</InlineCode>;
          }
          
          return (
            <CodeBlock
              code={String(children).replace(/\n$/, '')}
              language={match?.[1]}
            />
          );
        },
        pre: ({ children }) => <>{children}</>,
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
        ),
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/50 pl-4 my-3 italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

// Message action buttons for AI responses
const MessageActions = memo(function MessageActions({ 
  content,
  onRegenerate,
  onFeedback 
}: { 
  content: string;
  onRegenerate?: () => void;
  onFeedback?: (type: 'positive' | 'negative') => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    onFeedback?.(type);
  };

  return (
    <div className="flex items-center gap-1 mt-2 pt-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onRegenerate}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Regenerate</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              feedback === 'positive' ? "text-green-500" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleFeedback('positive')}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Good response</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              feedback === 'negative' ? "text-red-500" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleFeedback('negative')}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bad response</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>More options</TooltipContent>
      </Tooltip>
    </div>
  );
});

export const ChatMessage = memo(function ChatMessage({ 
  message, 
  isStreaming,
  onRegenerate,
  onFeedback
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-transparent"
      )}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <img src={heftcoderLogo} alt="HeftCoder" className="h-8 w-8 object-contain" />
        )}
      </div>

      {/* Message content */}
      <div className="flex flex-col max-w-[80%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 scrollbar-thin",
            isUser
              ? "bg-secondary text-foreground rounded-tr-md"
              : "bg-secondary/50 text-foreground rounded-tl-md"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <MarkdownContent content={message.content} />
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
              )}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
              {message.attachments.map((attachment) => (
                <span
                  key={attachment.id}
                  className="text-xs px-2 py-1 bg-black/20 rounded-md flex items-center gap-1"
                >
                  📎 {attachment.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons for AI messages (only show when not streaming) */}
        {!isUser && !isStreaming && (
          <MessageActions 
            content={message.content}
            onRegenerate={onRegenerate}
            onFeedback={onFeedback}
          />
        )}
      </div>
    </div>
  );
});
