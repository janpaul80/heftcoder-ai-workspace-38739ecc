import { useState, useCallback } from 'react';
import { TopNav } from './TopNav';
import { ChatPanel } from './ChatPanel';
import { PreviewPanel } from './PreviewPanel';
import { FileExplorerModal } from './FileExplorerModal';
import type { Message, Attachment, AIModel, ProjectStatus, UserTier } from '@/types/workspace';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export function WorkspaceEditor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [fileExplorerOpen, setFileExplorerOpen] = useState(false);
  const [userTier] = useState<UserTier>('pro'); // Mock user tier

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

      // Simulate AI response
      setTimeout(() => {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I'll help you build that using ${model.name}. Here's what I'm creating:

\`\`\`typescript
// Setting up your project structure
import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <h1>Your Project</h1>
    </div>
  );
}
\`\`\`

I'm now generating your project. You can see the live preview on the right panel.`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        
        // Simulate project completion after a delay
        setTimeout(() => {
          setProjectStatus({ status: 'complete' });
        }, 2000);
      }, 1500);
    },
    []
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
          <PreviewPanel status={projectStatus} />
        </ResizablePanel>
      </ResizablePanelGroup>

      <FileExplorerModal
        open={fileExplorerOpen}
        onOpenChange={setFileExplorerOpen}
      />
    </div>
  );
}
