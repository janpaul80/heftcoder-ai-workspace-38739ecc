import { useState, useCallback, useRef, useEffect } from 'react';
import type { AgentInfo, OrchestratorEvent, ProjectPlan, OrchestratorPhase, ClarifyingQuestion } from '@/types/orchestrator';
import type { GeneratedProject } from '@/types/workspace';
import { supabase } from '@/integrations/supabase/client';

const ORCHESTRATOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrator`;

// Job polling interval (ms)
const POLL_INTERVAL = 1500;
const MAX_POLL_TIME = 120000; // 2 minutes max

interface PlanningJob {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'clarifying' | 'awaiting_approval' | 'complete' | 'failed';
  progress: number;
  plan?: ProjectPlan;
  clarifying_questions?: ClarifyingQuestion[];
  error?: string;
}

export interface OrchestratorState {
  agents: Record<string, AgentInfo>;
  phase: OrchestratorPhase;
  plan: ProjectPlan | null;
  error: string | null;
  summary: string | null;
  streamingOutput: Record<string, string>;
  generatedProject: GeneratedProject | null;
  clarifyingQuestions: ClarifyingQuestion[];
  agentMessages: Array<{ agent: string; message: string }>;
  backendArtifacts: {
    migrations: Array<{ filename: string; content: string }>;
    edgeFunctions: Array<{ filename: string; content: string }>;
    secretsRequired: string[];
  };
}

export function useOrchestrator() {
  const [agents, setAgents] = useState<Record<string, AgentInfo>>({});
  const [phase, setPhase] = useState<OrchestratorPhase>("idle");
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [originalMessage, setOriginalMessage] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [streamingOutput, setStreamingOutput] = useState<Record<string, string>>({});
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>([]);
  const [agentMessages, setAgentMessages] = useState<Array<{ agent: string; message: string }>>([]);
  const [backendArtifacts, setBackendArtifacts] = useState<{
    migrations: Array<{ filename: string; content: string }>;
    edgeFunctions: Array<{ filename: string; content: string }>;
    secretsRequired: string[];
  }>({ migrations: [], edgeFunctions: [], secretsRequired: [] });
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartRef = useRef<number>(0);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  const streamEvents = useCallback(async (url: string, body: object) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Orchestrator error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line.startsWith("data: ")) continue;
        
        const jsonStr = line.slice(6);
        if (jsonStr === "[DONE]") continue;

        try {
          const event: OrchestratorEvent = JSON.parse(jsonStr);
          
          if (event.type === "agents_init") {
            setAgents(event.agents);
            setStreamingOutput({});
          } else if (event.type === "agent_status") {
            setAgents(prev => ({
              ...prev,
              [event.agent]: {
                ...prev[event.agent],
                status: event.status,
                statusLabel: event.statusLabel,
                output: event.output || prev[event.agent]?.output,
                code: event.code || prev[event.agent]?.code,
              },
            }));
          } else if (event.type === "agents_update") {
            setAgents(event.agents);
          } else if (event.type === "agent_stream") {
            setStreamingOutput(prev => ({
              ...prev,
              [event.agent]: event.output,
            }));
          } else if (event.type === "clarifying_questions") {
            setClarifyingQuestions(event.questions);
            setPhase("clarifying");
          } else if (event.type === "agent_message") {
            setAgentMessages(prev => [...prev, { agent: event.agent, message: event.message }]);
          } else if (event.type === "file_generated") {
            console.log("[useOrchestrator] File generated:", event.file.filename);
            setGeneratedProject(prev => {
              const existing = prev || {
                name: "Generated Project",
                type: "landing" as const,
                files: [],
              };
              return {
                ...existing,
                files: [
                  ...existing.files,
                  {
                    path: event.file.filename || event.file.path,
                    content: event.file.content,
                    language: event.file.language,
                  },
                ],
              };
            });
          } else if (event.type === "migration_generated") {
            console.log("[useOrchestrator] Migration generated:", event.filename);
            setBackendArtifacts(prev => ({
              ...prev,
              migrations: [...prev.migrations, { filename: event.filename, content: event.file.content }],
            }));
            // Also add to project files
            setGeneratedProject(prev => {
              const existing = prev || { name: "Generated Project", type: "landing" as const, files: [] };
              return {
                ...existing,
                files: [...existing.files, { path: event.filename, content: event.file.content, language: "sql" }],
              };
            });
          } else if (event.type === "edge_function_generated") {
            console.log("[useOrchestrator] Edge function generated:", event.filename);
            setBackendArtifacts(prev => ({
              ...prev,
              edgeFunctions: [...prev.edgeFunctions, { filename: event.filename, content: event.file.content }],
            }));
            // Also add to project files
            setGeneratedProject(prev => {
              const existing = prev || { name: "Generated Project", type: "landing" as const, files: [] };
              return {
                ...existing,
                files: [...existing.files, { path: event.filename, content: event.file.content, language: "typescript" }],
              };
            });
          } else if (event.type === "secrets_required") {
            console.log("[useOrchestrator] Secrets required:", event.secrets);
            setBackendArtifacts(prev => ({
              ...prev,
              secretsRequired: [...prev.secretsRequired, ...event.secrets],
            }));
            setAgentMessages(prev => [...prev, { 
              agent: "Backend", 
              message: `⚠️ Required secrets: ${event.secrets.join(", ")}` 
            }]);
          } else if (event.type === "preview_ready") {
            setGeneratedProject(prev => ({
              ...prev,
              name: prev?.name || "Generated Project",
              type: prev?.type || "landing",
              files: prev?.files || [],
              previewHtml: event.html,
            }));
          } else if (event.type === "code_generated") {
            setGeneratedProject(event.project);
          } else if (event.type === "plan_ready" || event.type === "plan_created") {
            setPlan(event.plan);
            setPhase("awaiting_approval");
          } else if (event.type === "project_complete") {
            console.log("[useOrchestrator] Project complete with files:", event.files?.length);
            if (event.files && event.files.length > 0) {
              const finalProject: GeneratedProject = {
                name: event.plan?.projectName || event.plan?.title || "Generated Project",
                type: (event.plan?.projectType || event.plan?.type as "landing" | "webapp" | "native") || "landing",
                files: event.files.map((f: { filename?: string; path?: string; content: string; language: string }) => ({
                  path: f.filename || f.path || "unknown",
                  content: f.content,
                  language: f.language,
                })),
              };
              setGeneratedProject(finalProject);
            }
            setPhase("complete");
          } else if (event.type === "complete") {
            setAgents(event.agents);
            setSummary(event.summary || null);
            if (event.project) {
              setGeneratedProject(event.project);
            }
            setPhase("complete");
          } else if (event.type === "error") {
            setError(event.message);
            setPhase("error");
          }
        } catch {
          // Ignore parse errors for partial JSON
        }
      }
    }
  }, []);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    // Check timeout
    if (Date.now() - pollStartRef.current > MAX_POLL_TIME) {
      console.log("[useOrchestrator] Polling timeout reached");
      setError("Planning took too long. Please try again.");
      setPhase("error");
      setCurrentJobId(null);
      return;
    }

    try {
      const response = await fetch(ORCHESTRATOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action: "job_status", jobId }),
      });

      if (!response.ok) {
        throw new Error(`Job status check failed: ${response.status}`);
      }

      const job: PlanningJob = await response.json();
      console.log("[useOrchestrator] Job status:", job.status, "progress:", job.progress);

      // Update progress in UI
      setAgents(prev => ({
        ...prev,
        architect: {
          ...prev.architect,
          statusLabel: job.status === 'processing' 
            ? `Analyzing requirements (${job.progress}%)...` 
            : prev.architect?.statusLabel,
        },
      }));

      if (job.status === 'clarifying' && job.clarifying_questions) {
        // Job needs clarification
        setClarifyingQuestions(job.clarifying_questions);
        setPhase("clarifying");
        setAgents(prev => ({
          ...prev,
          architect: { ...prev.architect, status: "complete", statusLabel: "Gathering requirements..." },
        }));
        setCurrentJobId(null);
        return;
      }

      if (job.status === 'awaiting_approval' && job.plan) {
        // Plan is ready
        setPlan(job.plan as ProjectPlan);
        setPhase("awaiting_approval");
        setAgents(prev => ({
          ...prev,
          architect: { ...prev.architect, status: "complete", statusLabel: "Plan ready" },
        }));
        setCurrentJobId(null);
        return;
      }

      if (job.status === 'failed') {
        setError(job.error || "Planning failed");
        setPhase("error");
        setCurrentJobId(null);
        return;
      }

      // Still processing - poll again
      pollingRef.current = setTimeout(() => pollJobStatus(jobId), POLL_INTERVAL);
    } catch (e) {
      console.error("[useOrchestrator] Poll error:", e);
      setError(e instanceof Error ? e.message : "Polling failed");
      setPhase("error");
      setCurrentJobId(null);
    }
  }, []);

  // Phase 1: Request a plan from the Architect (async job-based)
  const requestPlan = useCallback(async (message: string) => {
    setPhase("planning");
    setError(null);
    setPlan(null);
    setSummary(null);
    setOriginalMessage(message);
    setStreamingOutput({});
    setGeneratedProject(null);
    setClarifyingQuestions([]);
    setAgentMessages([]);
    setConversationHistory([{ role: 'user', content: message }]);
    
    // Initialize architect as thinking
    setAgents({
      architect: {
        agentId: "architect",
        agentName: "Planner",
        role: "Designing system architecture",
        status: "thinking",
        statusLabel: "Starting planning...",
      },
    });

    try {
      // Use new async job-based planning (returns immediately!)
      const response = await fetch(ORCHESTRATOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action: "plan_async", message }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Orchestrator error: ${response.status} - ${errorText}`);
      }

      const { jobId } = await response.json();
      console.log("[useOrchestrator] Job created:", jobId);
      
      setCurrentJobId(jobId);
      pollStartRef.current = Date.now();
      
      // Update UI to show we're processing
      setAgents(prev => ({
        ...prev,
        architect: { ...prev.architect, statusLabel: "Analyzing requirements..." },
      }));
      
      // Start polling for job completion
      pollingRef.current = setTimeout(() => pollJobStatus(jobId), POLL_INTERVAL);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setPhase("error");
    }
  }, [pollJobStatus]);

  // Answer clarifying questions
  const answerQuestions = useCallback(async (answers: Record<string, string>) => {
    setPhase("planning");
    setClarifyingQuestions([]);
    
    // Build context from answers
    const answerContext = Object.entries(answers)
      .map(([questionId, answer]) => {
        const q = clarifyingQuestions.find(cq => cq.id === questionId);
        return `Q: ${q?.question}\nA: ${answer}`;
      })
      .join('\n\n');

    const updatedMessage = `${originalMessage}\n\nAdditional context from user:\n${answerContext}`;
    
    setConversationHistory(prev => [...prev, { role: 'assistant', content: 'Questions answered' }, { role: 'user', content: answerContext }]);

    try {
      await streamEvents(ORCHESTRATOR_URL, { 
        action: "plan", 
        message: updatedMessage,
        conversationHistory: conversationHistory,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setPhase("error");
    }
  }, [clarifyingQuestions, originalMessage, conversationHistory, streamEvents]);

  // Reject plan with feedback
  const rejectPlan = useCallback(async (feedback: string) => {
    if (!plan || !originalMessage) return;
    
    setPhase("planning");
    setPlan(null);
    
    const updatedMessage = `${originalMessage}\n\nUser feedback on previous plan:\n${feedback}\n\nPlease revise the plan accordingly.`;
    
    setConversationHistory(prev => [...prev, { role: 'user', content: `Revision request: ${feedback}` }]);

    try {
      await streamEvents(ORCHESTRATOR_URL, { 
        action: "plan", 
        message: updatedMessage,
        conversationHistory: conversationHistory,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setPhase("error");
    }
  }, [plan, originalMessage, conversationHistory, streamEvents]);

  // Ask question about plan
  const askQuestion = useCallback(async (question: string) => {
    if (!plan) return;
    
    setAgentMessages([]);
    
    const questionMessage = `User question about the plan: ${question}\n\nCurrent plan: ${JSON.stringify(plan, null, 2)}`;
    
    try {
      await streamEvents(ORCHESTRATOR_URL, { 
        action: "question", 
        message: questionMessage,
        plan,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [plan, streamEvents]);

  // Phase 2: Approve plan and trigger build
  const approvePlan = useCallback(async () => {
    if (!plan || !originalMessage) return;
    
    setPhase("building");
    setError(null);
    setStreamingOutput({});

    try {
      await streamEvents(ORCHESTRATOR_URL, { 
        action: "execute", 
        message: originalMessage,
        plan,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setPhase("error");
    }
  }, [plan, originalMessage, streamEvents]);

  // Phase 3: Refine generated output
  const refineProject = useCallback(async (feedback: string) => {
    if (!generatedProject || !plan) return;
    
    setPhase("refining");
    setError(null);
    
    const refinementMessage = `Refine the generated project based on this feedback: ${feedback}\n\nOriginal request: ${originalMessage}`;

    try {
      await streamEvents(ORCHESTRATOR_URL, { 
        action: "refine", 
        message: refinementMessage,
        plan,
        currentCode: generatedProject.files.map(f => `// ${f.path}\n${f.content}`).join('\n\n'),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setPhase("error");
    }
  }, [generatedProject, plan, originalMessage, streamEvents]);

  const reset = useCallback(() => {
    // Cancel any ongoing polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setCurrentJobId(null);
    setAgents({});
    setPlan(null);
    setPhase("idle");
    setError(null);
    setSummary(null);
    setOriginalMessage("");
    setStreamingOutput({});
    setGeneratedProject(null);
    setClarifyingQuestions([]);
    setAgentMessages([]);
    setConversationHistory([]);
    setBackendArtifacts({ migrations: [], edgeFunctions: [], secretsRequired: [] });
  }, []);

  return {
    agents,
    phase,
    plan,
    error,
    summary,
    streamingOutput,
    generatedProject,
    clarifyingQuestions,
    agentMessages,
    backendArtifacts,
    requestPlan,
    answerQuestions,
    rejectPlan,
    askQuestion,
    approvePlan,
    refineProject,
    reset,
  };
}
