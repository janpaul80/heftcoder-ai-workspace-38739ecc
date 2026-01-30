import { cn } from '@/lib/utils';
import type { AgentInfo, AgentStatus, OrchestratorPhase } from '@/types/orchestrator';
import { 
  Bot, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentProgressBarProps {
  agents: Record<string, AgentInfo>;
  phase: OrchestratorPhase;
}

const AGENT_ORDER = ['architect', 'backend', 'frontend', 'integrator', 'qa', 'devops'];

const AGENT_LABELS: Record<string, string> = {
  architect: 'Planner',
  backend: 'Backend',
  frontend: 'Frontend',
  integrator: 'Integrator',
  qa: 'QA',
  devops: 'DevOps',
};

// Estimated times per agent in seconds
const AGENT_ESTIMATED_TIMES: Record<string, number> = {
  architect: 10,
  backend: 25,
  frontend: 35,
  integrator: 20,
  qa: 15,
  devops: 10,
};

// Total pipeline timeout in seconds
const TOTAL_PIPELINE_TIMEOUT = 90;

const getStatusIcon = (status: AgentStatus, isActive: boolean) => {
  if (status === 'complete') {
    return <CheckCircle2 className="h-3 w-3 text-green-400" />;
  }
  if (status === 'error') {
    return <AlertCircle className="h-3 w-3 text-destructive" />;
  }
  if (isActive) {
    return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
  }
  return <Bot className="h-3 w-3 text-muted-foreground" />;
};

const isActiveStatus = (status: AgentStatus): boolean => {
  return ['thinking', 'installing', 'creating', 'testing', 'deploying'].includes(status);
};

const AgentStep = memo(function AgentStep({ 
  agentKey, 
  agent, 
  isLast 
}: { 
  agentKey: string; 
  agent: AgentInfo;
  isLast: boolean;
}) {
  const isActive = isActiveStatus(agent.status);
  const isComplete = agent.status === 'complete';
  const isError = agent.status === 'error';

  return (
    <div className="flex items-center gap-1">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300",
          isActive && "bg-primary/20 text-primary ring-1 ring-primary/40",
          isComplete && "bg-green-500/20 text-green-400",
          isError && "bg-destructive/20 text-destructive",
          !isActive && !isComplete && !isError && "bg-muted/50 text-muted-foreground"
        )}
      >
        {getStatusIcon(agent.status, isActive)}
        <span className="hidden sm:inline">{AGENT_LABELS[agentKey] || agent.agentName}</span>
        {isActive && (
          <Sparkles className="h-2.5 w-2.5 animate-pulse" />
        )}
      </motion.div>
      {!isLast && (
        <ArrowRight className={cn(
          "h-3 w-3 transition-colors",
          isComplete ? "text-green-400" : "text-muted-foreground/50"
        )} />
      )}
    </div>
  );
});

// Countdown timer hook
function useCountdownTimer(phase: OrchestratorPhase, agents: Record<string, AgentInfo>) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  
  // Calculate estimated time based on active agents
  const estimatedTotal = Object.keys(agents).reduce((total, key) => {
    return total + (AGENT_ESTIMATED_TIMES[key] || 15);
  }, 0);
  
  const isActive = phase !== 'idle' && phase !== 'complete' && phase !== 'error' && phase !== 'awaiting_approval';
  
  useEffect(() => {
    if (isActive && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    
    if (!isActive) {
      startTimeRef.current = null;
      setElapsedSeconds(0);
      return;
    }
    
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive]);
  
  const remainingSeconds = Math.max(0, Math.min(estimatedTotal, TOTAL_PIPELINE_TIMEOUT) - elapsedSeconds);
  const isOvertime = elapsedSeconds > estimatedTotal;
  
  return { elapsedSeconds, remainingSeconds, estimatedTotal, isOvertime, isActive };
}

// Format seconds to mm:ss
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const AgentProgressBar = memo(function AgentProgressBar({ 
  agents, 
  phase 
}: AgentProgressBarProps) {
  const { elapsedSeconds, remainingSeconds, isOvertime, isActive } = useCountdownTimer(phase, agents);
  
  if (phase === 'idle') return null;

  const agentEntries = Object.entries(agents);
  
  // Sort agents by defined order
  const sortedAgents = agentEntries.sort((a, b) => {
    const indexA = AGENT_ORDER.indexOf(a[0]);
    const indexB = AGENT_ORDER.indexOf(b[0]);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Calculate progress
  const completedCount = agentEntries.filter(([, a]) => a.status === 'complete').length;
  const totalCount = Math.max(agentEntries.length, 1);
  const progressPercent = (completedCount / totalCount) * 100;

  // Get current active agent
  const activeAgent = agentEntries.find(([, a]) => isActiveStatus(a.status));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4 p-3 bg-card/80 backdrop-blur-sm rounded-xl border border-border"
      >
        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground flex items-center gap-2">
              <Bot className="h-3.5 w-3.5 text-primary" />
              Agent Orchestra
              {phase !== 'complete' && phase !== 'error' && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Working
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalCount} complete
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                phase === 'complete' ? "bg-green-500" : "bg-gradient-to-r from-primary to-primary/60"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Countdown timer */}
        {isActive && (
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className={cn(
              "h-3 w-3",
              isOvertime ? "text-amber-400" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs tabular-nums font-medium",
              isOvertime ? "text-amber-400" : "text-muted-foreground"
            )}>
              {isOvertime ? (
                <>+{formatTime(elapsedSeconds)} (taking longer than expected)</>
              ) : (
                <>~{formatTime(remainingSeconds)} remaining</>
              )}
            </span>
          </div>
        )}

        {/* Agent steps */}
        <div className="flex items-center gap-1 flex-wrap">
          {sortedAgents.map(([key, agent], index) => (
            <AgentStep 
              key={key} 
              agentKey={key} 
              agent={agent}
              isLast={index === sortedAgents.length - 1}
            />
          ))}
        </div>

        {/* Active agent status */}
        {activeAgent && (
          <motion.div
            key={activeAgent[0]}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 pt-2 border-t border-border/50"
          >
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span className="font-medium text-foreground">{activeAgent[1].agentName}:</span>
              {activeAgent[1].statusLabel || 'Working...'}
            </p>
          </motion.div>
        )}

        {/* Complete state */}
        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2 text-green-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">All agents completed successfully!</span>
          </motion.div>
        )}

        {/* Error state */}
        {phase === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2 text-destructive"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Build encountered an error</span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});
