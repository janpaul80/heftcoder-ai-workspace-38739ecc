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
  const [userTier] = useState<UserTier>('pro');
  
  const { agents, phase, plan, error, requestPlan, approvePlan, reset } = useOrchestrator();

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

      // Start planning phase
      requestPlan(content);

      // Add planning message
      const planningMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Analyzing your request and creating a build plan...`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, planningMessage]);
      setIsLoading(false);
    },
    [requestPlan]
  );

  const handleApprove = useCallback(async () => {
    // Add approval message
    const approvalMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Starting build process...`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, approvalMessage]);
    
    approvePlan();
  }, [approvePlan]);

  const isActive = phase !== "idle" && phase !== "complete" && phase !== "error";

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
            {phase !== "idle" && (
              <div className="border-b border-border bg-card">
                <AgentPanel 
                  agents={agents} 
                  phase={phase} 
                  plan={plan}
                  onApprove={handleApprove}
                />
              </div>
            )}
            {/* Preview Panel */}
            <div className="flex-1">
              <PreviewPanel status={isActive ? { status: 'working' } : projectStatus} />
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
