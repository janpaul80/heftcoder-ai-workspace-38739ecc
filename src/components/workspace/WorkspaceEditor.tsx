import { useState, useCallback, useEffect } from 'react';
import { TopNav } from './TopNav';
import { ChatPanel } from './ChatPanel';
import { PreviewPanel } from './PreviewPanel';
import { FileExplorerModal } from './FileExplorerModal';
import { PlanApprovalCard } from './PlanApprovalCard';
import { RefinePanel } from './RefinePanel';
import { ClarifyingQuestionsCard } from './ClarifyingQuestionsCard';
import { useOrchestrator } from '@/hooks/useOrchestrator';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Message, Attachment, ProjectStatus, UserTier, GeneratedProject } from '@/types/workspace';
import type { Template } from '@/hooks/useTemplates';
import type { ProjectHistoryItem } from '@/hooks/useProjectHistory';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type MobileTab = 'chat' | 'preview';

export function WorkspaceEditor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [fileExplorerOpen, setFileExplorerOpen] = useState(false);
  const [userTier] = useState<UserTier>('pro');
  const [loadedProject, setLoadedProject] = useState<GeneratedProject | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  
  const isMobile = useIsMobile();
  
  const { 
    agents, 
    phase, 
    plan, 
    error, 
    summary,
    streamingOutput,
    generatedProject,
    clarifyingQuestions,
    agentMessages,
    requestPlan,
    answerQuestions,
    rejectPlan,
    askQuestion,
    approvePlan,
    refineProject,
    reset 
  } = useOrchestrator();

  // Update status when project is generated
  useEffect(() => {
    if (generatedProject && generatedProject.files.length > 0) {
      setProjectStatus({ status: 'complete' });
      setLoadedProject(null);
      // Auto-switch to preview on mobile when project is ready
      if (isMobile) {
        setMobileTab('preview');
      }
    }
  }, [generatedProject, isMobile]);

  // Show plan approval in messages when ready
  useEffect(() => {
    if (phase === "awaiting_approval" && plan) {
      // Update the last message to show plan is ready
      setMessages(prev => {
        const newMessages = [...prev];
        // Find last assistant message
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === 'assistant') {
            newMessages[i] = {
              ...newMessages[i],
              content: `## 📋 Build Plan Ready\n\nI've analyzed your request and created a detailed plan. Review it below and approve when ready, or request changes if needed.`,
            };
            break;
          }
        }
        return newMessages;
      });
      setIsLoading(false);
    }
  }, [phase, plan]);

  // Show clarifying questions message
  useEffect(() => {
    if (phase === "clarifying" && clarifyingQuestions.length > 0) {
      setMessages(prev => {
        const newMessages = [...prev];
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === 'assistant') {
            newMessages[i] = {
              ...newMessages[i],
              content: `## 💬 Quick Questions\n\nBefore I create your plan, I need a few details to make sure I build exactly what you need.`,
            };
            break;
          }
        }
        return newMessages;
      });
      setIsLoading(false);
    }
  }, [phase, clarifyingQuestions]);

  // Add agent messages to chat
  useEffect(() => {
    if (agentMessages.length > 0) {
      const latestMessage = agentMessages[agentMessages.length - 1];
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `**${latestMessage.agent}:** ${latestMessage.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
    }
  }, [agentMessages]);

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
      setIsLoading(false);
    }
  }, [phase, error]);

  const handleSendMessage = useCallback(
    async (content: string, attachments: Attachment[]) => {
      reset();
      setLoadedProject(null);
      
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

      requestPlan(content);

      const planningMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `🤔 **Analyzing your request...**\n\nI'm designing the architecture and creating a detailed build plan. I'll present it for your approval before starting.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, planningMessage]);
    },
    [requestPlan, reset]
  );

  const handleSelectTemplate = useCallback((template: Template) => {
    handleSendMessage(template.prompt, []);
  }, [handleSendMessage]);

  const handleSelectProject = useCallback((project: ProjectHistoryItem) => {
    const loaded: GeneratedProject = {
      type: project.project_type as 'landing' | 'webapp' | 'native',
      name: project.name,
      files: project.files,
      previewHtml: project.preview_html || undefined,
    };
    
    setLoadedProject(loaded);
    setProjectStatus({ status: 'complete' });
    
    const loadMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `📂 **Loaded project:** ${project.name}\n\nOriginal request: "${project.original_prompt}"`,
      timestamp: new Date(),
    };
    setMessages([loadMessage]);
    
    // Switch to preview on mobile when loading a project
    if (isMobile) {
      setMobileTab('preview');
    }
  }, [isMobile]);

  const handleApprove = useCallback(async () => {
    const approvalMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `🚀 **Building your project...**\n\nThe agent team is generating your code. Watch the progress bar and preview panel to see your project come to life!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, approvalMessage]);
    setProjectStatus({ status: 'working' });
    
    approvePlan();
  }, [approvePlan]);

  const handleReject = useCallback(async (feedback: string) => {
    const feedbackMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `**Change request:** ${feedback}`,
      timestamp: new Date(),
    };
    
    const revisingMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `📝 **Revising the plan...**\n\nI'm updating the build plan based on your feedback.`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, feedbackMessage, revisingMessage]);
    rejectPlan(feedback);
  }, [rejectPlan]);

  const handleAskQuestion = useCallback(async (question: string) => {
    const questionMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `**Question:** ${question}`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, questionMessage]);
    askQuestion(question);
  }, [askQuestion]);

  const handleRefine = useCallback(async (feedback: string) => {
    const refineMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `**Refinement:** ${feedback}`,
      timestamp: new Date(),
    };
    
    const workingMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `✨ **Refining your design...**\n\nApplying your changes to the current output.`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, refineMessage, workingMessage]);
    setProjectStatus({ status: 'working' });
    refineProject(feedback);
  }, [refineProject]);

  const handleAnswerQuestions = useCallback(async (answers: Record<string, string>) => {
    const answersText = Object.entries(answers).map(([id, answer]) => {
      const q = clarifyingQuestions.find(cq => cq.id === id);
      return `• ${q?.question || id}: ${answer}`;
    }).join('\n');
    
    const answerMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `**My preferences:**\n${answersText}`,
      timestamp: new Date(),
    };
    
    const processingMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `📋 **Creating your build plan...**\n\nThanks! Now generating a detailed plan based on your requirements.`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, answerMessage, processingMessage]);
    setIsLoading(true);
    answerQuestions(answers);
  }, [answerQuestions, clarifyingQuestions]);

  const handleStartOver = useCallback(() => {
    reset();
    setMessages([]);
    setProjectStatus({ status: 'idle' });
    setLoadedProject(null);
    setMobileTab('chat');
  }, [reset]);

  const isActive = phase !== "idle" && phase !== "complete" && phase !== "error" && phase !== "awaiting_approval" && phase !== "clarifying";
  const isRefining = phase === "building"; // Use building phase for refinements too
  const hasGeneratedFiles = generatedProject && generatedProject.files.length > 0;
  const displayProject = loadedProject || generatedProject;
  const showApproval = phase === "awaiting_approval" && plan;
  const showClarifying = phase === "clarifying" && clarifyingQuestions.length > 0;
  const showRefine = phase === "complete" && hasGeneratedFiles;

  // Mobile layout with tabs
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <TopNav 
          onFileExplorerOpen={() => setFileExplorerOpen(true)}
          userTier={userTier}
          isMobile={true}
          project={displayProject}
        />

        {/* Mobile Tab Bar */}
        <div className="border-b border-border bg-card px-2 py-1.5">
          <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as MobileTab)} className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-10">
              <TabsTrigger 
                value="chat" 
                className="flex items-center gap-2 text-sm"
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className={cn(
                  "flex items-center gap-2 text-sm",
                  hasGeneratedFiles && "relative"
                )}
              >
                <Eye className="h-4 w-4" />
                Preview
                {hasGeneratedFiles && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'chat' ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Clarifying Questions - positioned above chat */}
              {showClarifying && (
                <div className="flex-shrink-0 p-3 border-b border-border bg-background/95 backdrop-blur-sm max-h-[60vh] overflow-y-auto z-10">
                  <ClarifyingQuestionsCard
                    questions={clarifyingQuestions}
                    onSubmit={handleAnswerQuestions}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Plan Approval Card - positioned above chat */}
              {showApproval && (
                <div className="flex-shrink-0 p-3 border-b border-border bg-background/95 backdrop-blur-sm max-h-[50vh] overflow-y-auto z-10">
                  <PlanApprovalCard
                    plan={plan}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onAskQuestion={handleAskQuestion}
                  />
                </div>
              )}

              {/* Refine Panel - positioned above chat */}
              {showRefine && (
                <div className="flex-shrink-0 p-3 border-b border-border bg-background/95 backdrop-blur-sm z-10">
                  <RefinePanel
                    onRefine={handleRefine}
                    onStartOver={handleStartOver}
                    isRefining={isRefining}
                  />
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onSelectTemplate={handleSelectTemplate}
                  onSelectProject={handleSelectProject}
                  isLoading={isLoading}
                  agents={agents}
                  phase={phase}
                />
              </div>
            </div>
          ) : (
            <PreviewPanel 
              status={isActive && !hasGeneratedFiles && !loadedProject ? { status: 'working' } : projectStatus}
              project={displayProject}
            />
          )}
        </div>

        <FileExplorerModal
          open={fileExplorerOpen}
          onOpenChange={setFileExplorerOpen}
        />
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav 
        onFileExplorerOpen={() => setFileExplorerOpen(true)}
        userTier={userTier}
        project={displayProject}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={25} maxSize={55}>
          <div className="flex flex-col h-full overflow-hidden">
            {/* Clarifying Questions - positioned above chat */}
            {showClarifying && (
              <div className="flex-shrink-0 p-4 border-b border-border bg-background/95 backdrop-blur-sm max-h-[60vh] overflow-y-auto z-10">
                <ClarifyingQuestionsCard
                  questions={clarifyingQuestions}
                  onSubmit={handleAnswerQuestions}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Plan Approval Card - positioned above chat */}
            {showApproval && (
              <div className="flex-shrink-0 p-4 border-b border-border bg-background/95 backdrop-blur-sm z-10">
                <PlanApprovalCard
                  plan={plan}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onAskQuestion={handleAskQuestion}
                />
              </div>
            )}

            {/* Refine Panel - positioned above chat */}
            {showRefine && (
              <div className="flex-shrink-0 p-4 border-b border-border bg-background/95 backdrop-blur-sm z-10">
                <RefinePanel
                  onRefine={handleRefine}
                  onStartOver={handleStartOver}
                  isRefining={isRefining}
                />
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                onSelectTemplate={handleSelectTemplate}
                onSelectProject={handleSelectProject}
                isLoading={isLoading}
                agents={agents}
                phase={phase}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-1.5 bg-border hover:bg-primary/50 transition-colors data-[resize-handle-active]:bg-primary" />

        <ResizablePanel defaultSize={60} minSize={45} maxSize={75}>
          <PreviewPanel 
            status={isActive && !hasGeneratedFiles && !loadedProject ? { status: 'working' } : projectStatus}
            project={displayProject}
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
