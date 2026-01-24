// Edge Function: orchestrator
// Multi-agent orchestration using Langdock AI as execution layer
// Lovable Cloud handles orchestration/state/UX, Langdock handles model execution

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const BUILD_ID = "orch-langdock-v1";

// ============= LANGDOCK CONFIGURATION =============

const LANGDOCK_API_BASE = "https://api.langdock.com/agent/v1";

// Agent ID mapping from secrets
function getAgentId(agentKey: string): string | null {
  const envMap: Record<string, string> = {
    architect: "AGENT_ARCHITECT_ID",
    backend: "AGENT_BACKEND_ID",
    frontend: "AGENT_FRONTEND_ID",
    integrator: "AGENT_INTEGRATOR_ID",
    qa: "AGENT_QA_ID",
    devops: "AGENT_DEVOPS_ID",
  };
  
  const envVar = envMap[agentKey];
  if (!envVar) return null;
  
  return Deno.env.get(envVar) || null;
}

// ============= DIAGNOSTIC =============

function handleDiagnostic(): Response {
  const envObj = Deno.env.toObject();
  const diag = {
    build: BUILD_ID,
    timestamp: new Date().toISOString(),
    executionLayer: "langdock",
    secrets: {
      LANGDOCK_API_KEY: Boolean(envObj.LANGDOCK_API_KEY && envObj.LANGDOCK_API_KEY.length > 0),
      AGENT_ARCHITECT_ID: Boolean(envObj.AGENT_ARCHITECT_ID),
      AGENT_BACKEND_ID: Boolean(envObj.AGENT_BACKEND_ID),
      AGENT_FRONTEND_ID: Boolean(envObj.AGENT_FRONTEND_ID),
      AGENT_INTEGRATOR_ID: Boolean(envObj.AGENT_INTEGRATOR_ID),
      AGENT_QA_ID: Boolean(envObj.AGENT_QA_ID),
      AGENT_DEVOPS_ID: Boolean(envObj.AGENT_DEVOPS_ID),
    },
  };
  return new Response(JSON.stringify(diag, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============= TYPES =============

type ProjectType = "landing" | "webapp" | "native";
type AgentPhase = "idle" | "planning" | "awaiting_approval" | "building_backend" | "building_frontend" | "integrating" | "qa_testing" | "deploying" | "complete" | "error";
type AgentStatus = "idle" | "thinking" | "installing" | "creating" | "testing" | "deploying" | "complete" | "error";

interface PlanStep {
  id: string;
  agent: string;
  task: string;
  dependencies: string[];
}

interface ProjectPlan {
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

interface GeneratedFile {
  filename: string;
  path: string;
  content: string;
  language: string;
}

interface AgentTask {
  agentId: string;
  agentName: string;
  role: string;
  status: AgentStatus;
  statusLabel?: string;
  output?: string;
  code?: string;
}

interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
}

interface OrchestrationState {
  phase: AgentPhase;
  currentAgent: string | null;
  plan: ProjectPlan | null;
  files: GeneratedFile[];
  executionLog: Array<{
    timestamp: Date;
    agent: string;
    phase: AgentPhase;
    message: string;
  }>;
}

// ============= AGENT METADATA (for UX display) =============

const AGENT_METADATA = {
  architect: {
    name: "Planner",
    role: "System design and project structure",
    nextHandoff: "handoff_to_frontend",
  },
  backend: {
    name: "Backend",
    role: "API and database implementation",
    nextHandoff: "handoff_to_frontend",
  },
  frontend: {
    name: "Frontend",
    role: "UI components and styling",
    nextHandoff: "handoff_to_qa",
  },
  integrator: {
    name: "Integrator",
    role: "Connect frontend to backend",
    nextHandoff: "handoff_to_qa",
  },
  qa: {
    name: "QA",
    role: "Testing and quality assurance",
    nextHandoff: "handoff_to_devops",
  },
  devops: {
    name: "DevOps",
    role: "Deployment and infrastructure",
    nextHandoff: "complete_project",
  },
};

// ============= LANGDOCK AGENT API CALL =============

interface LangdockMessage {
  role: "user" | "assistant";
  content: string;
}

interface LangdockRunResponse {
  id: string;
  status: "completed" | "failed" | "running";
  messages: LangdockMessage[];
  error?: string;
}

async function callLangdockAgent(
  agentKey: string,
  message: string,
  additionalContext?: string
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  const apiKey = Deno.env.get("LANGDOCK_API_KEY");
  
  if (!apiKey) {
    throw new Error(`LANGDOCK_API_KEY is not configured (build: ${BUILD_ID})`);
  }

  const agentId = getAgentId(agentKey);
  if (!agentId) {
    throw new Error(`Agent ID not configured for: ${agentKey}. Set AGENT_${agentKey.toUpperCase()}_ID secret.`);
  }

  const fullMessage = additionalContext 
    ? `${message}\n\nContext:\n${additionalContext}`
    : message;

  console.log(`[Langdock] Calling agent: ${agentKey} (ID: ${agentId.slice(0, 8)}...)`);
  
  // Step 1: Create a new run
  const createResponse = await fetch(`${LANGDOCK_API_BASE}/${agentId}/runs`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: fullMessage,
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error(`[Langdock] Create run error ${createResponse.status}:`, errorText);
    
    if (createResponse.status === 429) {
      throw new Error("Langdock rate limit exceeded. Please try again in a moment.");
    }
    if (createResponse.status === 401) {
      throw new Error("Langdock API key is invalid.");
    }
    throw new Error(`Langdock agent call failed: ${createResponse.status} - ${errorText.slice(0, 200)}`);
  }

  const runData = await createResponse.json();
  const runId = runData.id;
  
  console.log(`[Langdock] Run created: ${runId}`);

  // Step 2: Poll for completion (Langdock agents may take time)
  let attempts = 0;
  const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
  let result: LangdockRunResponse | null = null;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
    
    const statusResponse = await fetch(`${LANGDOCK_API_BASE}/${agentId}/runs/${runId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      console.error(`[Langdock] Status check failed: ${statusResponse.status}`);
      attempts++;
      continue;
    }

    result = await statusResponse.json();
    console.log(`[Langdock] Run status: ${result?.status} (attempt ${attempts + 1})`);

    if (result?.status === "completed") {
      break;
    }
    
    if (result?.status === "failed") {
      throw new Error(`Langdock agent failed: ${result.error || "Unknown error"}`);
    }

    attempts++;
  }

  if (!result || result.status !== "completed") {
    throw new Error("Langdock agent timed out after 2 minutes");
  }

  // Extract the last assistant message as the response
  const assistantMessages = result.messages.filter(m => m.role === "assistant");
  const content = assistantMessages.length > 0 
    ? assistantMessages[assistantMessages.length - 1].content 
    : "";

  console.log(`[Langdock] Response length: ${content.length}`);
  
  // Detect tool calls from content
  const toolCalls = detectToolCalls(content);
  console.log(`[Langdock] Tool calls detected: ${toolCalls.length}`);

  return { content, toolCalls };
}

// ============= TOOL CALL DETECTION =============

function detectToolCalls(content: string): ToolCall[] {
  const detectedCalls: ToolCall[] = [];

  // Strategy 1: Explicit TOOL_CALL syntax
  const explicitPattern = /TOOL_CALL:\s*(\w+)\s*\(\s*(\{[\s\S]*?\})\s*\)/g;
  let match;
  
  while ((match = explicitPattern.exec(content)) !== null) {
    const [, functionName, paramsJson] = match;
    try {
      const parameters = JSON.parse(paramsJson);
      detectedCalls.push({ name: functionName, parameters });
      console.log(`[Tool Detection] Found: ${functionName}`);
    } catch (e) {
      console.log(`[Tool Detection] Parse failed for ${functionName}`);
    }
  }

  // Strategy 2: Keyword fallback
  if (detectedCalls.length === 0) {
    const handoffPatterns = [
      { pattern: /\b(handoff|delegate|pass)\s+to\s+backend\b/i, tool: "handoff_to_backend" },
      { pattern: /\b(handoff|delegate|pass)\s+to\s+frontend\b/i, tool: "handoff_to_frontend" },
      { pattern: /\b(handoff|delegate|pass)\s+to\s+integrator\b/i, tool: "handoff_to_integrator" },
      { pattern: /\b(handoff|delegate|pass)\s+to\s+qa\b/i, tool: "handoff_to_qa" },
      { pattern: /\b(handoff|delegate|pass)\s+to\s+devops\b/i, tool: "handoff_to_devops" },
      { pattern: /\b(project\s+)?complete[d]?\b/i, tool: "complete_project" },
    ];

    for (const { pattern, tool } of handoffPatterns) {
      if (pattern.test(content)) {
        detectedCalls.push({ name: tool, parameters: {} });
        console.log(`[Tool Detection] Keyword match: ${tool}`);
        break;
      }
    }
  }

  return detectedCalls;
}

// ============= CODE EXTRACTION =============

function extractCodeBlocks(content: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || "text";
    const code = match[2].trim();
    
    // Skip empty code blocks
    if (!code || code.length < 10) continue;
    
    let filename = "code";
    if (language === "html") filename = "index.html";
    else if (language === "css") filename = "styles.css";
    else if (language === "javascript" || language === "js") filename = "script.js";
    else if (language === "typescript" || language === "ts") filename = "app.ts";
    else if (language === "tsx") filename = "App.tsx";
    else if (language === "jsx") filename = "App.jsx";
    
    files.push({ filename, path: filename, content: code, language });
    console.log(`[Code Extraction] Found ${language} file: ${filename} (${code.length} chars)`);
  }

  console.log(`[Code Extraction] Total files extracted: ${files.length}`);
  return files;
}

function extractPlan(content: string): ProjectPlan | null {
  const jsonMatch = content.match(/\{[\s\S]*?"projectName"[\s\S]*?\}/);
  if (!jsonMatch) return null;
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

// ============= ORCHESTRATION ENGINE =============

class OrchestrationEngine {
  private state: OrchestrationState;
  private send: (data: object) => void;
  private agentTasks: Record<string, AgentTask> = {};

  constructor(send: (data: object) => void) {
    this.send = send;
    this.state = {
      phase: "idle",
      currentAgent: null,
      plan: null,
      files: [],
      executionLog: [],
    };
  }

  private log(agent: string, message: string) {
    this.state.executionLog.push({
      timestamp: new Date(),
      agent,
      phase: this.state.phase,
      message,
    });
    console.log(`[Orchestration] ${agent}: ${message}`);
  }

  private getProgress(): number {
    const progressMap: Record<AgentPhase, number> = {
      idle: 0,
      planning: 10,
      awaiting_approval: 15,
      building_backend: 30,
      building_frontend: 50,
      integrating: 70,
      qa_testing: 85,
      deploying: 95,
      complete: 100,
      error: 0,
    };
    return progressMap[this.state.phase] || 0;
  }

  private initAgentsFromPlan(plan: ProjectPlan) {
    const agentOrder = ["architect", "frontend", "qa", "devops"];
    if (plan.steps.some(s => s.agent === "backend")) {
      agentOrder.splice(1, 0, "backend");
    }
    if (plan.steps.some(s => s.agent === "integrator")) {
      agentOrder.splice(agentOrder.indexOf("qa"), 0, "integrator");
    }

    for (const key of agentOrder) {
      const meta = AGENT_METADATA[key as keyof typeof AGENT_METADATA];
      if (meta) {
        this.agentTasks[key] = {
          agentId: key,
          agentName: meta.name,
          role: meta.role,
          status: "idle",
        };
      }
    }
  }

  async handleToolCall(toolName: string, parameters: Record<string, unknown>): Promise<void> {
    console.log(`[Orchestration] Tool call: ${toolName}`);

    switch (toolName) {
      case "handoff_to_backend":
        await this.transitionTo("building_backend", "backend", parameters);
        break;
      case "handoff_to_frontend":
        await this.transitionTo("building_frontend", "frontend", parameters);
        break;
      case "handoff_to_integrator":
        await this.transitionTo("integrating", "integrator", parameters);
        break;
      case "handoff_to_qa":
        await this.transitionTo("qa_testing", "qa", parameters);
        break;
      case "handoff_to_devops":
        await this.transitionTo("deploying", "devops", parameters);
        break;
      case "complete_project":
        await this.completeProject(parameters);
        break;
    }
  }

  private async transitionTo(phase: AgentPhase, agentKey: string, context: Record<string, unknown>) {
    this.state.phase = phase;
    this.state.currentAgent = agentKey;
    this.log(agentKey, `Starting ${phase}...`);

    if (this.agentTasks[agentKey]) {
      this.agentTasks[agentKey].status = "thinking";
      this.agentTasks[agentKey].statusLabel = "Working...";
    }

    const meta = AGENT_METADATA[agentKey as keyof typeof AGENT_METADATA];
    
    this.send({
      type: "agent_status",
      agent: agentKey,
      status: "thinking",
      statusLabel: `${meta?.name || agentKey} working...`,
      progress: this.getProgress(),
    });

    await this.executeAgent(agentKey, context);
  }

  private async executeAgent(agentKey: string, context: Record<string, unknown>) {
    const meta = AGENT_METADATA[agentKey as keyof typeof AGENT_METADATA];
    if (!meta) {
      console.error(`[Orchestration] Unknown agent: ${agentKey}`);
      return;
    }

    try {
      const contextStr = JSON.stringify(context, null, 2);
      const message = this.state.plan 
        ? `Build this project:\n${JSON.stringify(this.state.plan, null, 2)}\n\nContext:\n${contextStr}`
        : `Process this request with context:\n${contextStr}`;

      // Call Langdock agent instead of Lovable AI
      const { content, toolCalls } = await callLangdockAgent(agentKey, message);

      // Extract code
      const files = extractCodeBlocks(content);
      if (files.length > 0) {
        this.state.files.push(...files);
        
        // Send generated files
        for (const file of files) {
          this.send({
            type: "file_generated",
            agent: agentKey,
            file,
          });
        }

        // Build preview for HTML
        const htmlFile = files.find(f => f.language === "html");
        if (htmlFile) {
          this.send({
            type: "preview_ready",
            html: htmlFile.content,
          });
        }
      }

      // Update agent status
      if (this.agentTasks[agentKey]) {
        this.agentTasks[agentKey].status = "complete";
        this.agentTasks[agentKey].statusLabel = "Done";
        this.agentTasks[agentKey].output = content.slice(0, 500);
      }

      this.send({
        type: "agent_status",
        agent: agentKey,
        status: "complete",
        statusLabel: "Complete",
        progress: this.getProgress(),
      });

      this.send({
        type: "agent_output",
        agent: agentKey,
        output: content,
        filesGenerated: files.length,
      });

      // Handle tool calls or auto-advance
      if (toolCalls.length > 0) {
        for (const tc of toolCalls) {
          await this.handleToolCall(tc.name, tc.parameters);
        }
      } else {
        // Auto-advance if no explicit handoff
        await this.autoHandoff(agentKey, context);
      }

    } catch (err) {
      console.error(`[Orchestration] Agent error:`, err);
      
      if (this.agentTasks[agentKey]) {
        this.agentTasks[agentKey].status = "error";
        this.agentTasks[agentKey].statusLabel = err instanceof Error ? err.message : "Error";
      }

      this.send({
        type: "agent_status",
        agent: agentKey,
        status: "error",
        statusLabel: err instanceof Error ? err.message : "Error",
      });

      this.send({
        type: "error",
        message: err instanceof Error ? err.message : "Agent execution failed",
        build: BUILD_ID,
      });
    }
  }

  private async autoHandoff(agentKey: string, context: Record<string, unknown>) {
    const meta = AGENT_METADATA[agentKey as keyof typeof AGENT_METADATA];
    if (!meta?.nextHandoff) {
      console.log(`[Orchestration] No next handoff for ${agentKey}, completing`);
      await this.completeProject(context);
      return;
    }

    console.log(`[Orchestration] Auto-handoff: ${meta.nextHandoff}`);
    await this.handleToolCall(meta.nextHandoff, context);
  }

  private async completeProject(context: Record<string, unknown>) {
    this.state.phase = "complete";
    this.log("system", "Project complete!");

    // Mark all agents complete
    for (const key of Object.keys(this.agentTasks)) {
      if (this.agentTasks[key].status !== "error") {
        this.agentTasks[key].status = "complete";
        this.agentTasks[key].statusLabel = "Done";
      }
    }

    // Send project_complete with all files
    this.send({
      type: "project_complete",
      files: this.state.files,
      plan: this.state.plan,
      progress: 100,
    });

    // Send agents update
    this.send({
      type: "agents_update",
      agents: this.agentTasks,
    });

    // Send final complete event that the frontend expects
    this.send({
      type: "complete",
      agents: this.agentTasks,
      summary: `✅ Project "${this.state.plan?.projectName || 'Untitled'}" has been generated successfully! ${this.state.files.length} files created.`,
    });
  }

  async startPlanning(message: string) {
    this.state.phase = "planning";
    this.state.currentAgent = "architect";
    this.log("architect", "Starting planning...");

    // Initialize architect
    this.agentTasks["architect"] = {
      agentId: "architect",
      agentName: AGENT_METADATA.architect.name,
      role: AGENT_METADATA.architect.role,
      status: "thinking",
      statusLabel: "Analyzing requirements...",
    };

    this.send({
      type: "agents_init",
      agents: this.agentTasks,
    });

    this.send({
      type: "agent_status",
      agent: "architect",
      status: "thinking",
      statusLabel: "Analyzing requirements...",
    });

    try {
      // Call Langdock architect agent
      const { content, toolCalls } = await callLangdockAgent("architect", message);

      // Extract plan
      const plan = extractPlan(content);
      if (plan) {
        this.state.plan = plan;
        this.initAgentsFromPlan(plan);

        this.send({
          type: "plan_created",
          plan,
        });
      }

      // Update architect status
      this.agentTasks["architect"].status = "complete";
      this.agentTasks["architect"].statusLabel = "Plan ready";
      this.agentTasks["architect"].output = content.slice(0, 500);

      this.send({
        type: "agent_status",
        agent: "architect",
        status: "complete",
        statusLabel: "Plan ready",
      });

      this.send({
        type: "agent_output",
        agent: "architect",
        output: content,
      });

      // Handle tool calls
      if (toolCalls.length > 0) {
        for (const tc of toolCalls) {
          await this.handleToolCall(tc.name, tc.parameters);
        }
      } else if (plan) {
        // Auto-handoff based on plan
        const hasBackend = plan.steps.some(s => s.agent === "backend");
        if (hasBackend) {
          await this.handleToolCall("handoff_to_backend", { plan_json: plan, message });
        } else {
          await this.handleToolCall("handoff_to_frontend", { plan_json: plan, message });
        }
      }

    } catch (err) {
      console.error("[Orchestration] Planning error:", err);
      
      this.send({
        type: "agent_status",
        agent: "architect",
        status: "error",
        statusLabel: err instanceof Error ? err.message : "Planning failed",
        build: BUILD_ID,
      });
      
      this.send({
        type: "error",
        message: err instanceof Error ? err.message : "Planning failed",
        build: BUILD_ID,
      });
    }
  }

  async startExecution(message: string, plan: ProjectPlan) {
    this.state.plan = plan;
    this.state.phase = "building_frontend";
    this.initAgentsFromPlan(plan);

    this.send({ type: "agents_init", agents: this.agentTasks });

    const hasBackend = plan.steps.some(s => s.agent === "backend");
    
    if (hasBackend) {
      await this.handleToolCall("handoff_to_backend", { plan_json: plan, message });
    } else {
      await this.handleToolCall("handoff_to_frontend", { plan_json: plan, message });
    }
  }
}

// ============= MAIN HANDLER =============

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight - must return 200 OK for browsers
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // GET diagnostics
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("action") === "diag") {
      return handleDiagnostic();
    }
    return new Response(JSON.stringify({ info: "POST with action + message", build: BUILD_ID }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const { action, message, plan } = await req.json();

    if (action === "diag") {
      return handleDiagnostic();
    }

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

        const orchestrator = new OrchestrationEngine(send);

        if (action === "plan") {
          await orchestrator.startPlanning(message);
        } else if (action === "execute") {
          await orchestrator.startExecution(message, plan as ProjectPlan);
        } else {
          send({ type: "error", message: "Unknown action" });
        }

        send({ type: "[DONE]" });
        controller.close();
      },
    });

    return new Response(body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[Orchestrator] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
