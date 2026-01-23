export interface AgentInfo {
  agentId: string;
  agentName: string;
  role: string;
  status: "pending" | "working" | "complete" | "error";
  output?: string;
}

export interface AgentStatusEvent {
  type: "agent_status";
  agent: string;
  status: AgentInfo["status"];
  output?: string;
  error?: string;
}

export interface AgentsInitEvent {
  type: "agents_init";
  agents: Record<string, AgentInfo>;
}

export interface CompleteEvent {
  type: "complete";
  agents: Record<string, AgentInfo>;
}

export type OrchestratorEvent = AgentStatusEvent | AgentsInitEvent | CompleteEvent | { type: "[DONE]" };
