import type { GeneratedProject, ProjectType } from './workspace';

export type AgentStatus = "idle" | "thinking" | "installing" | "creating" | "testing" | "deploying" | "complete" | "error";

export interface AgentInfo {
  agentId: string;
  agentName: string;
  role: string;
  status: AgentStatus;
  output?: string;
  statusLabel?: string;
  code?: string;
}

export interface PlanStep {
  id: string;
  agent: string;
  task: string;
  dependencies: string[];
}

export interface ProjectPlan {
  projectName: string;
  projectType: ProjectType;
  description: string;
  techStack: {
    frontend: string[];
    backend: string[];
    database: string;
  };
  steps: PlanStep[];
  estimatedTime: string;
}

export interface PlanReadyEvent {
  type: "plan_ready";
  plan: ProjectPlan;
}

export interface AgentStatusEvent {
  type: "agent_status";
  agent: string;
  status: AgentStatus;
  statusLabel?: string;
  output?: string;
  code?: string;
  error?: string;
}

export interface AgentStreamEvent {
  type: "agent_stream";
  agent: string;
  chunk: string;
  output: string;
}

export interface AgentsInitEvent {
  type: "agents_init";
  agents: Record<string, AgentInfo>;
}

export interface CodeGeneratedEvent {
  type: "code_generated";
  project: GeneratedProject;
}

export interface CompleteEvent {
  type: "complete";
  agents: Record<string, AgentInfo>;
  summary?: string;
  project?: GeneratedProject;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type OrchestratorEvent = 
  | PlanReadyEvent 
  | AgentStatusEvent 
  | AgentStreamEvent
  | AgentsInitEvent 
  | CodeGeneratedEvent
  | CompleteEvent 
  | ErrorEvent
  | { type: "[DONE]" };

export type OrchestratorPhase = "idle" | "planning" | "awaiting_approval" | "building" | "complete" | "error";
