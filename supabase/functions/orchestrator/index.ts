import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentTask {
  agentId: string;
  agentName: string;
  role: string;
  status: "pending" | "working" | "complete" | "error";
  output?: string;
}

const AGENTS = {
  architect: {
    id: Deno.env.get("AGENT_ARCHITECT_ID"),
    name: "Architect",
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

async function callLangdockAgent(agentId: string, message: string): Promise<string> {
  const apiKey = Deno.env.get("LANGDOCK_API_KEY");
  
  if (!apiKey) {
    throw new Error("LANGDOCK_API_KEY is not configured");
  }

  const response = await fetch(`https://api.langdock.com/assistant/v1/chat/${agentId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: message }],
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, stream } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For streaming, we'll send agent status updates
    if (stream) {
      const encoder = new TextEncoder();
      const body = new ReadableStream({
        async start(controller) {
          const send = (data: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          // Initialize all agents as pending
          const agentTasks: Record<string, AgentTask> = {};
          for (const [key, agent] of Object.entries(AGENTS)) {
            agentTasks[key] = {
              agentId: agent.id || "",
              agentName: agent.name,
              role: agent.role,
              status: "pending",
            };
          }

          send({ type: "agents_init", agents: agentTasks });

          // Phase 1: Architect designs the system
          send({ type: "agent_status", agent: "architect", status: "working" });
          try {
            const architectOutput = await callLangdockAgent(
              AGENTS.architect.id!,
              `Design a system architecture for: ${message}`
            );
            agentTasks.architect.status = "complete";
            agentTasks.architect.output = architectOutput;
            send({ type: "agent_status", agent: "architect", status: "complete", output: architectOutput });
          } catch (err) {
            agentTasks.architect.status = "error";
            send({ type: "agent_status", agent: "architect", status: "error", error: err instanceof Error ? err.message : "Unknown error" });
          }

          // Phase 2: Backend and Frontend work in parallel
          send({ type: "agent_status", agent: "backend", status: "working" });
          send({ type: "agent_status", agent: "frontend", status: "working" });

          const [backendResult, frontendResult] = await Promise.allSettled([
            callLangdockAgent(
              AGENTS.backend.id!,
              `Based on this architecture, implement the backend: ${agentTasks.architect.output || message}`
            ),
            callLangdockAgent(
              AGENTS.frontend.id!,
              `Based on this architecture, implement the frontend: ${agentTasks.architect.output || message}`
            ),
          ]);

          if (backendResult.status === "fulfilled") {
            agentTasks.backend.status = "complete";
            agentTasks.backend.output = backendResult.value;
            send({ type: "agent_status", agent: "backend", status: "complete", output: backendResult.value });
          } else {
            agentTasks.backend.status = "error";
            send({ type: "agent_status", agent: "backend", status: "error", error: backendResult.reason?.message });
          }

          if (frontendResult.status === "fulfilled") {
            agentTasks.frontend.status = "complete";
            agentTasks.frontend.output = frontendResult.value;
            send({ type: "agent_status", agent: "frontend", status: "complete", output: frontendResult.value });
          } else {
            agentTasks.frontend.status = "error";
            send({ type: "agent_status", agent: "frontend", status: "error", error: frontendResult.reason?.message });
          }

          // Phase 3: Integrator connects everything
          send({ type: "agent_status", agent: "integrator", status: "working" });
          try {
            const integratorOutput = await callLangdockAgent(
              AGENTS.integrator.id!,
              `Integrate these components:\nBackend: ${agentTasks.backend.output}\nFrontend: ${agentTasks.frontend.output}`
            );
            agentTasks.integrator.status = "complete";
            agentTasks.integrator.output = integratorOutput;
            send({ type: "agent_status", agent: "integrator", status: "complete", output: integratorOutput });
          } catch (err) {
            agentTasks.integrator.status = "error";
            send({ type: "agent_status", agent: "integrator", status: "error", error: err instanceof Error ? err.message : "Unknown error" });
          }

          // Phase 4: QA and DevOps work in parallel
          send({ type: "agent_status", agent: "qa", status: "working" });
          send({ type: "agent_status", agent: "devops", status: "working" });

          const [qaResult, devopsResult] = await Promise.allSettled([
            callLangdockAgent(
              AGENTS.qa.id!,
              `Test this integrated system: ${agentTasks.integrator.output || message}`
            ),
            callLangdockAgent(
              AGENTS.devops.id!,
              `Prepare deployment for: ${agentTasks.integrator.output || message}`
            ),
          ]);

          if (qaResult.status === "fulfilled") {
            agentTasks.qa.status = "complete";
            agentTasks.qa.output = qaResult.value;
            send({ type: "agent_status", agent: "qa", status: "complete", output: qaResult.value });
          } else {
            agentTasks.qa.status = "error";
            send({ type: "agent_status", agent: "qa", status: "error", error: qaResult.reason?.message });
          }

          if (devopsResult.status === "fulfilled") {
            agentTasks.devops.status = "complete";
            agentTasks.devops.output = devopsResult.value;
            send({ type: "agent_status", agent: "devops", status: "complete", output: devopsResult.value });
          } else {
            agentTasks.devops.status = "error";
            send({ type: "agent_status", agent: "devops", status: "error", error: devopsResult.reason?.message });
          }

          // Final summary
          send({ type: "complete", agents: agentTasks });
          send({ type: "[DONE]" });
          controller.close();
        },
      });

      return new Response(body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Non-streaming: run all agents sequentially and return final result
    const results: Record<string, string> = {};
    
    for (const [key, agent] of Object.entries(AGENTS)) {
      if (agent.id) {
        try {
          results[key] = await callLangdockAgent(agent.id, message);
        } catch (err) {
          results[key] = `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Orchestrator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
