import { useState, useCallback } from 'react';
import { TopNav } from './TopNav';
import { ChatPanel } from './ChatPanel';
import { PreviewPanel } from './PreviewPanel';
import { FileExplorerModal } from './FileExplorerModal';
import { AgentPanel } from './AgentPanel';
import { useOrchestrator } from '@/hooks/useOrchestrator';
import type { Message, Attachment, AIModel, ProjectStatus, UserTier } from '@/types/workspace';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export function WorkspaceEditor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [fileExplorerOpen, setFileExplorerOpen] = useState(false);
  const [userTier] = useState<UserTier>('pro'); // Mock user tier
  
  const { agents, isRunning, runOrchestrator } = useOrchestrator();

  const handleSendMessage = useCallback(
    async (content: string, attachments: Attachment[], model: AIModel) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
        attachments,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setProjectStatus({ status: 'working' });

      // Start the 6-agent orchestrator
      runOrchestrator(content);

      // Add initial AI message
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I'm orchestrating 6 specialized agents to build your project using ${model.name}:

• **Architect** - Designing system structure
• **Backend** - Building APIs and database
• **Frontend** - Creating UI components
• **Integrator** - Connecting all pieces
• **QA** - Testing and validation
• **DevOps** - Preparing deployment

Watch the agents work in real-time on the right panel.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    },
    [runOrchestrator]
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav 
        onFileExplorerOpen={() => setFileExplorerOpen(true)}
        userTier={userTier}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <div className="h-full flex flex-col">
            {/* Agent Orchestra Panel */}
            {(Object.keys(agents).length > 0 || isRunning) && (
              <div className="border-b border-border bg-card">
                <AgentPanel agents={agents} isRunning={isRunning} />
              </div>
            )}
            {/* Preview Panel */}
            <div className="flex-1">
              <PreviewPanel status={isRunning ? { status: 'working' } : projectStatus} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <FileExplorerModal
        open={fileExplorerOpen}
        onOpenChange={setFileExplorerOpen}
      />
    </div>
  );
}
