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

export interface AgentsUpdateEvent {
  type: "agents_update";
  agents: Record<string, AgentInfo>;
}

export interface GeneratedFile {
  filename: string;
  path?: string;
  content: string;
  language: string;
}

export interface FileGeneratedEvent {
  type: "file_generated";
  agent: string;
  file: GeneratedFile;
}

export interface PreviewReadyEvent {
  type: "preview_ready";
  html: string;
}

export interface PlanCreatedEvent {
  type: "plan_created";
  plan: ProjectPlan;
}

export interface ProjectCompleteEvent {
  type: "project_complete";
  files: GeneratedFile[];
  plan?: ProjectPlan & { title?: string; type?: string };
  progress: number;
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
  | PlanCreatedEvent
  | AgentStatusEvent 
  | AgentStreamEvent
  | AgentsInitEvent 
  | AgentsUpdateEvent
  | FileGeneratedEvent
  | PreviewReadyEvent
  | ProjectCompleteEvent
  | CodeGeneratedEvent
  | CompleteEvent 
  | ErrorEvent
  | { type: "[DONE]" };

export type OrchestratorPhase = "idle" | "planning" | "awaiting_approval" | "building" | "complete" | "error";
