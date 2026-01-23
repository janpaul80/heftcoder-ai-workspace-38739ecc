import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlanStep {
  id: string;
  agent: string;
  task: string;
  dependencies: string[];
}

interface ProjectPlan {
  projectName: string;
  description: string;
  techStack: {
    frontend: string[];
    backend: string[];
    database: string;
  };
  steps: PlanStep[];
  estimatedTime: string;
}

type AgentStatus = "idle" | "thinking" | "installing" | "creating" | "testing" | "deploying" | "complete" | "error";

interface AgentTask {
  agentId: string;
  agentName: string;
  role: string;
  status: AgentStatus;
  statusLabel?: string;
  output?: string;
}

// Agent configuration with Langdock IDs
const AGENTS = {
  architect: {
    id: Deno.env.get("AGENT_ARCHITECT_ID"),
    name: "Planner",
    role: "System design and project structure",
  },
  backend: {
    id: Deno.env.get("AGENT_BACKEND_ID"),
    name: "Backend",
    role: "API and database implementation",
  },
  frontend: {
    id: Deno.env.get("AGENT_FRONTEND_ID"),
    name: "Frontend",
    role: "UI components and styling",
  },
  integrator: {
    id: Deno.env.get("AGENT_INTEGRATOR_ID"),
    name: "Integrator",
    role: "Connect frontend to backend",
  },
  qa: {
    id: Deno.env.get("AGENT_QA_ID"),
    name: "QA",
    role: "Testing and quality assurance",
  },
  devops: {
    id: Deno.env.get("AGENT_DEVOPS_ID"),
    name: "DevOps",
    role: "Deployment and infrastructure",
  },
};

const PLANNER_SYSTEM_PROMPT = `You are a project planner. When given a project request, output ONLY a valid JSON object with this exact structure (no markdown, no explanation):

{
  "projectName": "string",
  "description": "Brief 1-sentence description",
  "techStack": {
    "frontend": ["React", "TypeScript", "Tailwind"],
    "backend": ["Supabase", "Edge Functions"],
    "database": "PostgreSQL"
  },
  "steps": [
    {"id": "1", "agent": "backend", "task": "Create database schema", "dependencies": []},
    {"id": "2", "agent": "backend", "task": "Build API endpoints", "dependencies": ["1"]},
    {"id": "3", "agent": "frontend", "task": "Create UI components", "dependencies": []},
    {"id": "4", "agent": "integrator", "task": "Connect frontend to API", "dependencies": ["2", "3"]},
    {"id": "5", "agent": "qa", "task": "Run tests", "dependencies": ["4"]},
    {"id": "6", "agent": "devops", "task": "Deploy application", "dependencies": ["5"]}
  ],
  "estimatedTime": "X minutes"
}

Output ONLY the JSON. No other text.`;

// Streaming Langdock agent call
async function* streamLangdockAgent(
  agentId: string, 
  message: string, 
  systemPrompt?: string
): AsyncGenerator<string> {
  const apiKey = Deno.env.get("LANGDOCK_API_KEY");
  
  if (!apiKey) {
    throw new Error("LANGDOCK_API_KEY is not configured");
  }

  if (!agentId) {
    throw new Error("Agent ID is not configured");
  }

  const messages = systemPrompt 
    ? [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    : [{ role: "user", content: message }];

  const response = await fetch(`https://api.langdock.com/assistant/v1/chat/${agentId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Agent ${agentId} error:`, response.status, errorText);
    throw new Error(`Agent call failed: ${response.status} - ${errorText}`);
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

      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) continue;
      
      const jsonStr = line.slice(6);
      if (jsonStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          yield content;
        }
      } catch {
        // Partial JSON, skip
      }
    }
  }
}

// Non-streaming for planning (needs full JSON)
async function callLangdockAgent(agentId: string, message: string, systemPrompt?: string): Promise<string> {
  const apiKey = Deno.env.get("LANGDOCK_API_KEY");
  
  if (!apiKey) {
    throw new Error("LANGDOCK_API_KEY is not configured");
  }

  if (!agentId) {
    throw new Error("Agent ID is not configured");
  }

  const messages = systemPrompt 
    ? [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    : [{ role: "user", content: message }];

  const response = await fetch(`https://api.langdock.com/assistant/v1/chat/${agentId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Agent ${agentId} error:`, response.status, errorText);
    throw new Error(`Agent call failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response";
}

function parsePlanFromResponse(response: string): ProjectPlan | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ProjectPlan;
    }
    return JSON.parse(response) as ProjectPlan;
  } catch {
    console.error("Failed to parse plan:", response);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, message, plan } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // ========== PLAN ACTION ==========
        if (action === "plan") {
          send({ 
            type: "agent_status", 
            agent: "architect", 
            status: "thinking",
            statusLabel: "Analyzing requirements..."
          });

          try {
            const architectOutput = await callLangdockAgent(
              AGENTS.architect.id!,
              `Create a project plan for: ${message}`,
              PLANNER_SYSTEM_PROMPT
            );

            const parsedPlan = parsePlanFromResponse(architectOutput);
            
            if (parsedPlan) {
              send({ 
                type: "agent_status", 
                agent: "architect", 
                status: "complete",
                statusLabel: "Plan ready",
                output: architectOutput
              });
              send({ type: "plan_ready", plan: parsedPlan });
            } else {
              // Fallback: create a default plan structure
              const defaultPlan: ProjectPlan = {
                projectName: "Project",
                description: message,
                techStack: {
                  frontend: ["React", "TypeScript", "Tailwind"],
                  backend: ["Supabase"],
                  database: "PostgreSQL"
                },
                steps: [
                  { id: "1", agent: "backend", task: "Setup database", dependencies: [] },
                  { id: "2", agent: "frontend", task: "Build UI", dependencies: [] },
                  { id: "3", agent: "integrator", task: "Connect components", dependencies: ["1", "2"] },
                  { id: "4", agent: "qa", task: "Test application", dependencies: ["3"] },
                  { id: "5", agent: "devops", task: "Deploy", dependencies: ["4"] },
                ],
                estimatedTime: "5 minutes"
              };
              send({ 
                type: "agent_status", 
                agent: "architect", 
                status: "complete",
                statusLabel: "Plan ready (fallback)"
              });
              send({ type: "plan_ready", plan: defaultPlan });
            }
          } catch (err) {
            console.error("Planning error:", err);
            send({ 
              type: "agent_status", 
              agent: "architect", 
              status: "error",
              statusLabel: err instanceof Error ? err.message : "Planning failed"
            });
            send({ 
              type: "error", 
              message: err instanceof Error ? err.message : "Planning failed" 
            });
          }

          send({ type: "[DONE]" });
          controller.close();
          return;
        }

        // ========== EXECUTE ACTION ==========
        if (action === "execute") {
          const executionPlan = plan as ProjectPlan;
          
          // Initialize all builder agents
          const agentTasks: Record<string, AgentTask> = {
            backend: {
              agentId: AGENTS.backend.id || "",
              agentName: "Backend",
              role: "API and database",
              status: "idle",
            },
            frontend: {
              agentId: AGENTS.frontend.id || "",
              agentName: "Frontend", 
              role: "UI components",
              status: "idle",
            },
            integrator: {
              agentId: AGENTS.integrator.id || "",
              agentName: "Integrator",
              role: "Connect systems",
              status: "idle",
            },
            qa: {
              agentId: AGENTS.qa.id || "",
              agentName: "QA",
              role: "Testing",
              status: "idle",
            },
            devops: {
              agentId: AGENTS.devops.id || "",
              agentName: "DevOps",
              role: "Deployment",
              status: "idle",
            },
          };

          send({ type: "agents_init", agents: agentTasks });

          const stepsByAgent: Record<string, PlanStep[]> = {};
          
          for (const step of executionPlan.steps) {
            if (!stepsByAgent[step.agent]) {
              stepsByAgent[step.agent] = [];
            }
            stepsByAgent[step.agent].push(step);
          }

          // Helper to execute an agent with streaming output
          const executeAgent = async (agent: string, task: string, context: string) => {
            let output = "";
            
            try {
              for await (const chunk of streamLangdockAgent(
                AGENTS[agent as keyof typeof AGENTS].id!,
                `${task}\n\nContext: ${context}`
              )) {
                output += chunk;
                // Send streaming update every few chunks
                send({ 
                  type: "agent_stream", 
                  agent, 
                  chunk,
                  output
                });
              }
              return output;
            } catch (err) {
              throw err;
            }
          };

          // Phase 1: Backend & Frontend in parallel
          const phase1Agents = ["backend", "frontend"].filter(a => stepsByAgent[a]?.length);
          
          for (const agent of phase1Agents) {
            send({ 
              type: "agent_status", 
              agent, 
              status: "installing",
              statusLabel: "Installing dependencies..."
            });
          }

          await new Promise(r => setTimeout(r, 300));

          for (const agent of phase1Agents) {
            send({ 
              type: "agent_status", 
              agent, 
              status: "creating",
              statusLabel: "Creating files..."
            });
          }

          const phase1Results = await Promise.allSettled(
            phase1Agents.map(async (agent) => {
              const steps = stepsByAgent[agent] || [];
              const taskDescription = steps.map(s => s.task).join(", ");
              const output = await executeAgent(agent, taskDescription, message);
              return { agent, output };
            })
          );

          for (const result of phase1Results) {
            if (result.status === "fulfilled") {
              const { agent, output } = result.value;
              agentTasks[agent].status = "complete";
              agentTasks[agent].output = output;
              send({ 
                type: "agent_status", 
                agent, 
                status: "complete",
                statusLabel: "Done",
                output 
              });
            } else {
              const agent = phase1Agents[phase1Results.indexOf(result)];
              const errorMsg = result.reason instanceof Error ? result.reason.message : "Failed";
              send({ 
                type: "agent_status", 
                agent, 
                status: "error",
                statusLabel: errorMsg
              });
            }
          }

          // Phase 2: Integrator
          if (stepsByAgent["integrator"]?.length) {
            send({ 
              type: "agent_status", 
              agent: "integrator", 
              status: "creating",
              statusLabel: "Connecting components..."
            });

            try {
              const contextParts = [];
              if (agentTasks.backend.output) contextParts.push(`Backend:\n${agentTasks.backend.output}`);
              if (agentTasks.frontend.output) contextParts.push(`Frontend:\n${agentTasks.frontend.output}`);
              
              const integratorOutput = await executeAgent(
                "integrator",
                "Integrate the backend and frontend components",
                contextParts.join("\n\n")
              );
              
              agentTasks.integrator.status = "complete";
              agentTasks.integrator.output = integratorOutput;
              send({ 
                type: "agent_status", 
                agent: "integrator", 
                status: "complete",
                statusLabel: "Done",
                output: integratorOutput 
              });
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : "Failed";
              send({ 
                type: "agent_status", 
                agent: "integrator", 
                status: "error",
                statusLabel: errorMsg
              });
            }
          }

          // Phase 3: QA & DevOps
          const phase3Agents = ["qa", "devops"].filter(a => stepsByAgent[a]?.length);

          if (phase3Agents.includes("qa")) {
            send({ 
              type: "agent_status", 
              agent: "qa", 
              status: "testing",
              statusLabel: "Running tests..."
            });
          }
          if (phase3Agents.includes("devops")) {
            send({ 
              type: "agent_status", 
              agent: "devops", 
              status: "deploying",
              statusLabel: "Preparing deployment..."
            });
          }

          const phase3Results = await Promise.allSettled(
            phase3Agents.map(async (agent) => {
              const task = agent === "qa" ? "Test the application" : "Deploy the application";
              const context = agentTasks.integrator.output || message;
              const output = await executeAgent(agent, task, context);
              return { agent, output };
            })
          );

          for (const result of phase3Results) {
            if (result.status === "fulfilled") {
              const { agent, output } = result.value;
              agentTasks[agent].status = "complete";
              agentTasks[agent].output = output;
              send({ 
                type: "agent_status", 
                agent, 
                status: "complete",
                statusLabel: "Done",
                output 
              });
            } else {
              const agent = phase3Agents[phase3Results.indexOf(result)];
              const errorMsg = result.reason instanceof Error ? result.reason.message : "Failed";
              send({ 
                type: "agent_status", 
                agent, 
                status: "error",
                statusLabel: errorMsg
              });
            }
          }

          // Build summary
          const summaryParts = Object.entries(agentTasks)
            .filter(([_, task]) => task.status === "complete" && task.output)
            .map(([key, task]) => `### ${task.agentName}\n${task.output}`)
            .join("\n\n");

          send({ 
            type: "complete", 
            agents: agentTasks,
            summary: summaryParts || "Project build complete!"
          });
          send({ type: "[DONE]" });
          controller.close();
          return;
        }

        // Unknown action
        send({ type: "error", message: "Unknown action" });
        send({ type: "[DONE]" });
        controller.close();
      },
    });

    return new Response(body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Orchestrator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
