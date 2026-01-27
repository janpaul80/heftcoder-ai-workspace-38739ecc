import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { AgentProgressBar } from './AgentProgressBar';
import { StartPanel } from './StartPanel';
import type { Message, Attachment } from '@/types/workspace';
import type { AgentInfo, OrchestratorPhase } from '@/types/orchestrator';
import type { Template } from '@/hooks/useTemplates';
import type { ProjectHistoryItem } from '@/hooks/useProjectHistory';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  onSelectTemplate?: (template: Template) => void;
  onSelectProject?: (project: ProjectHistoryItem) => void;
  isLoading?: boolean;
  agents?: Record<string, AgentInfo>;
  phase?: OrchestratorPhase;
  onRegenerate?: () => void;
}

export function ChatPanel({ 
  messages, 
  onSendMessage, 
  onSelectTemplate,
  onSelectProject,
  isLoading, 
  agents = {}, 
  phase = 'idle',
  onRegenerate
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFeedback = (type: 'positive' | 'negative') => {
    // Could integrate with analytics or feedback system
    console.log('User feedback:', type);
  };

  // Show start panel when no messages
  if (messages.length === 0) {
    const handleQuickStart = (prompt: string) => {
      onSendMessage(prompt, []);
    };

    return (
      <div className="flex flex-col h-full bg-card">
        <div className="flex-1 overflow-hidden">
          <StartPanel 
            onSelectTemplate={onSelectTemplate || (() => {})}
            onSelectProject={onSelectProject || (() => {})}
            onStartBlank={() => {}}
            onSendPrompt={handleQuickStart}
          />
        </div>
        <ChatInput onSend={onSendMessage} disabled={isLoading} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Agent Progress Bar - inline in chat */}
        {phase !== 'idle' && Object.keys(agents).length > 0 && (
          <AgentProgressBar agents={agents} phase={phase} />
        )}
        {messages.map((message, index) => (
          <ChatMessage 
            key={message.id} 
            message={message}
            onRegenerate={message.role === 'assistant' && index === messages.length - 1 ? onRegenerate : undefined}
            onFeedback={message.role === 'assistant' ? handleFeedback : undefined}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}
