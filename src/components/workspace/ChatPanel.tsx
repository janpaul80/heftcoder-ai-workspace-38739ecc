import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { AgentProgressBar } from './AgentProgressBar';
import type { Message, Attachment } from '@/types/workspace';
import type { AgentInfo, OrchestratorPhase } from '@/types/orchestrator';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  isLoading?: boolean;
  agents?: Record<string, AgentInfo>;
  phase?: OrchestratorPhase;
}

export function ChatPanel({ messages, onSendMessage, isLoading, agents = {}, phase = 'idle' }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-2xl font-semibold text-foreground mb-2">
              What would you like to build?
            </div>
            <p className="text-muted-foreground max-w-md">
              Describe your project and I'll help you create it. I can build web apps, 
              APIs, landing pages, dashboards, and more.
            </p>
          </div>
        ) : (
          <>
            {/* Agent Progress Bar - inline in chat */}
            {phase !== 'idle' && Object.keys(agents).length > 0 && (
              <AgentProgressBar agents={agents} phase={phase} />
            )}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}
