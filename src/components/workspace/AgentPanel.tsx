import { cn } from '@/lib/utils';
import type { AgentInfo } from '@/types/orchestrator';
import { Bot, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';

interface AgentPanelProps {
  agents: Record<string, AgentInfo>;
  isRunning: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  architect: "from-violet-500 to-purple-600",
  backend: "from-blue-500 to-cyan-600",
  frontend: "from-pink-500 to-rose-600",
  integrator: "from-amber-500 to-orange-600",
  qa: "from-emerald-500 to-green-600",
  devops: "from-slate-500 to-gray-600",
};

function AgentCard({ agentKey, agent }: { agentKey: string; agent: AgentInfo }) {
  const colorClass = AGENT_COLORS[agentKey] || "from-gray-500 to-gray-600";
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4 transition-all duration-300",
        "bg-gradient-to-br border border-white/10",
        colorClass,
        agent.status === "working" && "animate-pulse ring-2 ring-white/30",
        agent.status === "complete" && "opacity-90",
        agent.status === "error" && "ring-2 ring-destructive"
      )}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        {agent.status === "pending" && (
          <Clock className="h-4 w-4 text-white/60" />
        )}
        {agent.status === "working" && (
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        )}
        {agent.status === "complete" && (
          <CheckCircle2 className="h-4 w-4 text-white" />
        )}
        {agent.status === "error" && (
          <AlertCircle className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Agent icon */}
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-5 w-5 text-white" />
        <span className="font-semibold text-white text-sm">{agent.agentName}</span>
      </div>

      {/* Role */}
      <p className="text-xs text-white/80 leading-relaxed">{agent.role}</p>

      {/* Working animation */}
      {agent.status === "working" && (
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

export function AgentPanel({ agents, isRunning }: AgentPanelProps) {
  const agentList = Object.entries(agents);
  
  if (agentList.length === 0 && !isRunning) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Bot className="h-5 w-5 text-primary" />
          {isRunning && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <h3 className="font-semibold text-foreground">Agent Orchestra</h3>
        {isRunning && (
          <span className="text-xs text-muted-foreground">(working...)</span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {agentList.map(([key, agent]) => (
          <AgentCard key={key} agentKey={key} agent={agent} />
        ))}
      </div>
    </div>
  );
}
