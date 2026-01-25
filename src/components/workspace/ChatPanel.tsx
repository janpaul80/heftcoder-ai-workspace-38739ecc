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
}

export function ChatPanel({ 
  messages, 
  onSendMessage, 
  onSelectTemplate,
  onSelectProject,
  isLoading, 
  agents = {}, 
  phase = 'idle' 
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartBlank = () => {
    // Just focus the input - user will type their own prompt
  };

  // Show start panel when no messages
  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-card">
        <div className="flex-1 overflow-hidden">
          <StartPanel 
            onSelectTemplate={onSelectTemplate || (() => {})}
            onSelectProject={onSelectProject || (() => {})}
            onStartBlank={handleStartBlank}
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
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}
