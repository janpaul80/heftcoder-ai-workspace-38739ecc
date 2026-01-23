import { useState, useCallback } from 'react';
import type { AgentInfo, OrchestratorEvent } from '@/types/orchestrator';

const ORCHESTRATOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrator`;

export function useOrchestrator() {
  const [agents, setAgents] = useState<Record<string, AgentInfo>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOrchestrator = useCallback(async (message: string) => {
    setIsRunning(true);
    setError(null);
    setAgents({});

    try {
      const response = await fetch(ORCHESTRATOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ message, stream: true }),
      });

      if (!response.ok) {
        throw new Error(`Orchestrator error: ${response.status}`);
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
            } else if (event.type === "agent_status") {
              setAgents(prev => ({
                ...prev,
                [event.agent]: {
                  ...prev[event.agent],
                  status: event.status,
                  output: event.output || prev[event.agent]?.output,
                },
              }));
            } else if (event.type === "complete") {
              setAgents(event.agents);
            }
          } catch {
            // Ignore parse errors for partial JSON
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  }, []);

  const resetAgents = useCallback(() => {
    setAgents({});
    setError(null);
  }, []);

  return {
    agents,
    isRunning,
    error,
    runOrchestrator,
    resetAgents,
  };
}
