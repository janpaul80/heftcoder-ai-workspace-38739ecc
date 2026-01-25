import { useState, useCallback, useEffect } from 'react';
import { TopNav } from './TopNav';
import { ChatPanel } from './ChatPanel';
import { PreviewPanel } from './PreviewPanel';
import { FileExplorerModal } from './FileExplorerModal';
import { useOrchestrator } from '@/hooks/useOrchestrator';
import type { Message, Attachment, AIModel, ProjectStatus, UserTier } from '@/types/workspace';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export function WorkspaceEditor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [fileExplorerOpen, setFileExplorerOpen] = useState(false);
  const [userTier] = useState<UserTier>('pro');
  
  const { 
    agents, 
    phase, 
    plan, 
    error, 
    summary,
    streamingOutput,
    generatedProject,
    requestPlan, 
    approvePlan, 
    reset 
  } = useOrchestrator();

  // Update status when project is generated
  useEffect(() => {
    if (generatedProject && generatedProject.files.length > 0) {
      setProjectStatus({ status: 'complete' });
    }
  }, [generatedProject]);

  // Update messages when build completes
  useEffect(() => {
    if (phase === "complete" && summary) {
      const summaryMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: summary,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, summaryMessage]);
    }
  }, [phase, summary]);

  // Handle errors
  useEffect(() => {
    if (phase === "error" && error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `## ❌ Build Error\n\n${error}\n\nPlease try again or modify your request.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setProjectStatus({ status: 'error', message: error });
    }
  }, [phase, error]);

  const handleSendMessage = useCallback(
    async (content: string, attachments: Attachment[], model: AIModel) => {
      // Reset orchestrator for new request
      reset();
      
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
        attachments,
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setProjectStatus({ status: 'working' });

      // Start planning phase
      requestPlan(content);

      // Add planning message
      const planningMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `🤔 **Analyzing your request...**\n\nI'm designing the architecture and creating a build plan. This will just take a moment.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, planningMessage]);
      setIsLoading(false);
    },
    [requestPlan, reset]
  );

  const handleApprove = useCallback(async () => {
    // Add approval message
    const approvalMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `🚀 **Building your project...**\n\nThe agent orchestra is generating code. Watch the preview panel to see your project come to life!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, approvalMessage]);
    setProjectStatus({ status: 'working' });
    
    approvePlan();
  }, [approvePlan]);

  const isActive = phase !== "idle" && phase !== "complete" && phase !== "error";
  const hasGeneratedFiles = generatedProject && generatedProject.files.length > 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav 
        onFileExplorerOpen={() => setFileExplorerOpen(true)}
        userTier={userTier}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={25} maxSize={55}>
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            agents={agents}
            phase={phase}
          />
        </ResizablePanel>

        <ResizableHandle className="w-1.5 bg-border hover:bg-primary/50 transition-colors data-[resize-handle-active]:bg-primary" />

        <ResizablePanel defaultSize={60} minSize={45} maxSize={75}>
          <PreviewPanel 
            status={isActive && !hasGeneratedFiles ? { status: 'working' } : projectStatus}
            project={generatedProject}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <FileExplorerModal
        open={fileExplorerOpen}
        onOpenChange={setFileExplorerOpen}
      />
    </div>
  );
}
