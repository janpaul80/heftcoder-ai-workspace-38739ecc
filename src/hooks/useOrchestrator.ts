import { useState, useCallback } from 'react';
import type { AgentInfo, OrchestratorEvent, ProjectPlan, OrchestratorPhase } from '@/types/orchestrator';

const ORCHESTRATOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrator`;

export interface OrchestratorState {
  agents: Record<string, AgentInfo>;
  phase: OrchestratorPhase;
  plan: ProjectPlan | null;
  error: string | null;
  summary: string | null;
  streamingOutput: Record<string, string>;
}

export function useOrchestrator() {
  const [agents, setAgents] = useState<Record<string, AgentInfo>>({});
  const [phase, setPhase] = useState<OrchestratorPhase>("idle");
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [originalMessage, setOriginalMessage] = useState<string>("");
  const [streamingOutput, setStreamingOutput] = useState<Record<string, string>>({});

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
              },
            }));
          } else if (event.type === "agent_stream") {
            setStreamingOutput(prev => ({
              ...prev,
              [event.agent]: event.output,
            }));
          } else if (event.type === "plan_ready") {
            setPlan(event.plan);
            setPhase("awaiting_approval");
          } else if (event.type === "complete") {
            setAgents(event.agents);
            setSummary(event.summary || null);
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

  // Phase 1: Request a plan from the Architect
  const requestPlan = useCallback(async (message: string) => {
    setPhase("planning");
    setError(null);
    setPlan(null);
    setSummary(null);
    setOriginalMessage(message);
    setStreamingOutput({});
    
    // Initialize architect as thinking
    setAgents({
      architect: {
        agentId: "architect",
        agentName: "Planner",
        role: "Designing system architecture",
        status: "thinking",
        statusLabel: "Analyzing requirements...",
      },
    });

    try {
      await streamEvents(ORCHESTRATOR_URL, { 
        action: "plan", 
        message,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setPhase("error");
    }
  }, [streamEvents]);

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

  const reset = useCallback(() => {
    setAgents({});
    setPlan(null);
    setPhase("idle");
    setError(null);
    setSummary(null);
    setOriginalMessage("");
    setStreamingOutput({});
  }, []);

  return {
    agents,
    phase,
    plan,
    error,
    summary,
    streamingOutput,
    requestPlan,
    approvePlan,
    reset,
  };
}
