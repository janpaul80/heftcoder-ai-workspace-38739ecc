import { cn } from '@/lib/utils';
import type { AgentInfo, AgentStatus, ProjectPlan, OrchestratorPhase } from '@/types/orchestrator';
import { 
  Bot, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Clock, 
  Download, 
  FileCode, 
  TestTube, 
  Rocket, 
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, memo } from 'react';

interface AgentPanelProps {
  agents: Record<string, AgentInfo>;
  phase: OrchestratorPhase;
  plan: ProjectPlan | null;
  onApprove: () => void;
  streamingOutput?: Record<string, string>;
}

const AGENT_COLORS: Record<string, { gradient: string; border: string; glow: string }> = {
  architect: { 
    gradient: "from-violet-500 to-purple-600", 
    border: "border-violet-400/30",
    glow: "shadow-violet-500/20"
  },
  backend: { 
    gradient: "from-blue-500 to-cyan-600", 
    border: "border-blue-400/30",
    glow: "shadow-blue-500/20"
  },
  frontend: { 
    gradient: "from-pink-500 to-rose-600", 
    border: "border-pink-400/30",
    glow: "shadow-pink-500/20"
  },
  integrator: { 
    gradient: "from-amber-500 to-orange-600", 
    border: "border-amber-400/30",
    glow: "shadow-amber-500/20"
  },
  qa: { 
    gradient: "from-emerald-500 to-green-600", 
    border: "border-emerald-400/30",
    glow: "shadow-emerald-500/20"
  },
  devops: { 
    gradient: "from-slate-500 to-gray-600", 
    border: "border-slate-400/30",
    glow: "shadow-slate-500/20"
  },
};

const STATUS_ICONS: Record<AgentStatus, React.ReactNode> = {
  idle: <Clock className="h-4 w-4 text-white/60" />,
  thinking: <Loader2 className="h-4 w-4 text-white animate-spin" />,
  installing: <Download className="h-4 w-4 text-white animate-bounce" />,
  creating: <FileCode className="h-4 w-4 text-white animate-pulse" />,
  testing: <TestTube className="h-4 w-4 text-white animate-pulse" />,
  deploying: <Rocket className="h-4 w-4 text-white animate-bounce" />,
  complete: <CheckCircle2 className="h-4 w-4 text-white" />,
  error: <AlertCircle className="h-4 w-4 text-white" />,
};

const isActiveStatus = (status: AgentStatus): boolean => {
  return ["thinking", "installing", "creating", "testing", "deploying"].includes(status);
};

const AgentCard = memo(function AgentCard({ 
  agentKey, 
  agent, 
  streamingContent 
}: { 
  agentKey: string; 
  agent: AgentInfo; 
  streamingContent?: string;
}) {
  const colors = AGENT_COLORS[agentKey] || AGENT_COLORS.devops;
  const isActive = isActiveStatus(agent.status);
  const [expanded, setExpanded] = useState(false);
  
  const hasOutput = streamingContent || agent.output;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl transition-all duration-500",
        "bg-gradient-to-br border",
        colors.gradient,
        colors.border,
        isActive && `ring-2 ring-white/40 shadow-lg ${colors.glow}`,
        agent.status === "complete" && "opacity-95",
        agent.status === "error" && "ring-2 ring-destructive",
        expanded ? "row-span-2" : ""
      )}
    >
      {/* Animated background for active state */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
      )}
      
      <div className="relative p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg bg-white/20 backdrop-blur-sm",
              isActive && "animate-pulse"
            )}>
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">{agent.agentName}</span>
          </div>
          <div className="flex items-center gap-1">
            {hasOutput && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}
            {STATUS_ICONS[agent.status]}
          </div>
        </div>

        {/* Status label */}
        {agent.statusLabel && (
          <p className="text-xs text-white font-medium mb-1 flex items-center gap-1">
            {isActive && <Sparkles className="h-3 w-3 animate-pulse" />}
            {agent.statusLabel}
          </p>
        )}

        {/* Role */}
        <p className="text-xs text-white/70 leading-relaxed">{agent.role}</p>

        {/* Working animation */}
        {isActive && (
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        )}

        {/* Streaming/Output preview */}
        {expanded && hasOutput && (
          <div className="mt-3 p-2 bg-black/30 rounded-lg max-h-40 overflow-y-auto">
            <pre className="text-xs text-white/80 whitespace-pre-wrap font-mono">
              {streamingContent || agent.output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
});

const PlanDisplay = memo(function PlanDisplay({ 
  plan, 
  onApprove 
}: { 
  plan: ProjectPlan; 
  onApprove: () => void;
}) {
  return (
    <div className="p-4 bg-gradient-to-br from-card/80 to-card/50 rounded-xl border border-border backdrop-blur-sm">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground text-lg">{plan.projectName}</h4>
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      <div className="mb-4">
        <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Tech Stack
        </h5>
        <div className="flex flex-wrap gap-2">
          {[...plan.techStack.frontend, ...plan.techStack.backend, plan.techStack.database].map((tech, i) => (
            <span 
              key={i} 
              className="px-2.5 py-1 bg-primary/15 text-primary text-xs rounded-full font-medium border border-primary/20"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Build Steps
        </h5>
        <div className="space-y-2">
          {plan.steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3 text-sm group">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {i + 1}
              </span>
              <span className="text-muted-foreground capitalize font-medium">{step.agent}:</span>
              <span className="text-foreground">{step.task}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Estimated: {plan.estimatedTime}
        </span>
        <Button 
          onClick={onApprove} 
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <Check className="h-4 w-4" />
          Approve & Build
        </Button>
      </div>
    </div>
  );
});

export function AgentPanel({ 
  agents, 
  phase, 
  plan, 
  onApprove,
  streamingOutput = {}
}: AgentPanelProps) {
  const agentList = Object.entries(agents);
  
  if (phase === "idle") {
    return null;
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          {phase !== "complete" && phase !== "error" && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse ring-2 ring-card" />
          )}
        </div>
        <h3 className="font-semibold text-foreground">Agent Orchestra</h3>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-medium",
          phase === "planning" && "bg-violet-500/20 text-violet-400",
          phase === "awaiting_approval" && "bg-amber-500/20 text-amber-400",
          phase === "building" && "bg-blue-500/20 text-blue-400",
          phase === "complete" && "bg-green-500/20 text-green-400",
          phase === "error" && "bg-destructive/20 text-destructive"
        )}>
          {phase.replace("_", " ")}
        </span>
      </div>

      {/* Planning phase - show planner agent */}
      {phase === "planning" && agentList.length > 0 && (
        <div className="grid grid-cols-1 gap-3 mb-4">
          {agentList.map(([key, agent]) => (
            <AgentCard 
              key={key} 
              agentKey={key} 
              agent={agent} 
              streamingContent={streamingOutput[key]}
            />
          ))}
        </div>
      )}

      {/* Awaiting approval - show plan */}
      {phase === "awaiting_approval" && plan && (
        <PlanDisplay plan={plan} onApprove={onApprove} />
      )}

      {/* Building phase - show all agents in grid */}
      {(phase === "building" || phase === "complete") && agentList.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {agentList.map(([key, agent]) => (
            <AgentCard 
              key={key} 
              agentKey={key} 
              agent={agent}
              streamingContent={streamingOutput[key]}
            />
          ))}
        </div>
      )}

      {/* Complete state */}
      {phase === "complete" && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-3 text-green-400">
            <div className="p-2 rounded-full bg-green-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold">Build complete!</span>
              <p className="text-xs text-green-400/70 mt-0.5">All agents finished successfully</p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {phase === "error" && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <div className="flex items-center gap-3 text-destructive">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold">Build failed</span>
              <p className="text-xs text-destructive/70 mt-0.5">Check agent outputs for details</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
