import { cn } from '@/lib/utils';
import type { AgentInfo, AgentStatus, ProjectPlan, OrchestratorPhase } from '@/types/orchestrator';
import { Bot, CheckCircle2, Loader2, AlertCircle, Clock, Download, FileCode, TestTube, Rocket, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgentPanelProps {
  agents: Record<string, AgentInfo>;
  phase: OrchestratorPhase;
  plan: ProjectPlan | null;
  onApprove: () => void;
}

const AGENT_COLORS: Record<string, string> = {
  architect: "from-violet-500 to-purple-600",
  backend: "from-blue-500 to-cyan-600",
  frontend: "from-pink-500 to-rose-600",
  integrator: "from-amber-500 to-orange-600",
  qa: "from-emerald-500 to-green-600",
  devops: "from-slate-500 to-gray-600",
};

const STATUS_ICONS: Record<AgentStatus, React.ReactNode> = {
  idle: <Clock className="h-4 w-4 text-white/60" />,
  thinking: <Loader2 className="h-4 w-4 text-white animate-spin" />,
  installing: <Download className="h-4 w-4 text-white animate-pulse" />,
  creating: <FileCode className="h-4 w-4 text-white animate-pulse" />,
  testing: <TestTube className="h-4 w-4 text-white animate-pulse" />,
  deploying: <Rocket className="h-4 w-4 text-white animate-pulse" />,
  complete: <CheckCircle2 className="h-4 w-4 text-white" />,
  error: <AlertCircle className="h-4 w-4 text-white" />,
};

const isActiveStatus = (status: AgentStatus): boolean => {
  return ["thinking", "installing", "creating", "testing", "deploying"].includes(status);
};

function AgentCard({ agentKey, agent }: { agentKey: string; agent: AgentInfo }) {
  const colorClass = AGENT_COLORS[agentKey] || "from-gray-500 to-gray-600";
  const isActive = isActiveStatus(agent.status);
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4 transition-all duration-300",
        "bg-gradient-to-br border border-white/10",
        colorClass,
        isActive && "animate-pulse ring-2 ring-white/30",
        agent.status === "complete" && "opacity-90",
        agent.status === "error" && "ring-2 ring-destructive"
      )}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        {STATUS_ICONS[agent.status]}
      </div>

      {/* Agent icon */}
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-5 w-5 text-white" />
        <span className="font-semibold text-white text-sm">{agent.agentName}</span>
      </div>

      {/* Status label */}
      {agent.statusLabel && (
        <p className="text-xs text-white font-medium mb-1">{agent.statusLabel}</p>
      )}

      {/* Role */}
      <p className="text-xs text-white/70 leading-relaxed">{agent.role}</p>

      {/* Working animation */}
      {isActive && (
        <div className="mt-3 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanDisplay({ plan, onApprove }: { plan: ProjectPlan; onApprove: () => void }) {
  return (
    <div className="p-4 bg-card/50 rounded-lg border border-border">
      <div className="mb-4">
        <h4 className="font-semibold text-foreground text-lg">{plan.projectName}</h4>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      <div className="mb-4">
        <h5 className="text-sm font-medium text-foreground mb-2">Tech Stack</h5>
        <div className="flex flex-wrap gap-2">
          {[...plan.techStack.frontend, ...plan.techStack.backend, plan.techStack.database].map((tech, i) => (
            <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h5 className="text-sm font-medium text-foreground mb-2">Build Steps</h5>
        <div className="space-y-2">
          {plan.steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {i + 1}
              </span>
              <span className="text-muted-foreground capitalize">{step.agent}:</span>
              <span className="text-foreground">{step.task}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Estimated: {plan.estimatedTime}
        </span>
        <Button onClick={onApprove} className="gap-2">
          <Check className="h-4 w-4" />
          Approve & Build
        </Button>
      </div>
    </div>
  );
}

export function AgentPanel({ agents, phase, plan, onApprove }: AgentPanelProps) {
  const agentList = Object.entries(agents);
  
  if (phase === "idle") {
    return null;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Bot className="h-5 w-5 text-primary" />
          {phase !== "complete" && phase !== "error" && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <h3 className="font-semibold text-foreground">Agent Orchestra</h3>
        <span className="text-xs text-muted-foreground capitalize">
          ({phase.replace("_", " ")})
        </span>
      </div>

      {/* Planning phase - show planner agent */}
      {phase === "planning" && agentList.length > 0 && (
        <div className="grid grid-cols-1 gap-3 mb-4">
          {agentList.map(([key, agent]) => (
            <AgentCard key={key} agentKey={key} agent={agent} />
          ))}
        </div>
      )}

      {/* Awaiting approval - show plan */}
      {phase === "awaiting_approval" && plan && (
        <PlanDisplay plan={plan} onApprove={onApprove} />
      )}

      {/* Building phase - show all agents */}
      {(phase === "building" || phase === "complete") && agentList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {agentList.map(([key, agent]) => (
            <AgentCard key={key} agentKey={key} agent={agent} />
          ))}
        </div>
      )}

      {phase === "complete" && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Build complete!</span>
          </div>
        </div>
      )}
    </div>
  );
}
