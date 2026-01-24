// Edge Function: orchestrator
// Multi-agent orchestration using Langdock AI (OpenAI-compatible Chat Completions API)
// Lovable Cloud handles orchestration/state/UX, Langdock handles model execution

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const BUILD_ID = "orch-langdock-v2";

// ============= LANGDOCK CONFIGURATION =============

const LANGDOCK_API_URL = "https://api.langdock.com/v1/chat/completions";

// Default model - can be overridden per agent
const DEFAULT_MODEL = "claude-sonnet-4";

// ============= DIAGNOSTIC =============

function handleDiagnostic(): Response {
  const envObj = Deno.env.toObject();
  const diag = {
    build: BUILD_ID,
    timestamp: new Date().toISOString(),
    executionLayer: "langdock-chat-completions",
    apiUrl: LANGDOCK_API_URL,
    secrets: {
      LANGDOCK_API_KEY: Boolean(envObj.LANGDOCK_API_KEY && envObj.LANGDOCK_API_KEY.length > 0),
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

// ============= AGENT CONFIGURATION =============

const AGENTS = {
  architect: {
    name: "Planner",
    role: "System design and project structure",
    model: "claude-sonnet-4", // Best for planning/reasoning
    nextHandoff: "handoff_to_frontend",
    systemPrompt: `You are a project planner for a code generation system. Analyze the user's request and create a project plan.

IMPORTANT: After creating the plan, you MUST indicate a handoff by including this at the end of your response:
TOOL_CALL: handoff_to_frontend({"plan_json": <your plan object>})

For landing pages: handoff_to_frontend
For web apps with backend: handoff_to_backend first

Output a JSON plan first, then the handoff.

Plan format:
{
  "projectName": "string",
  "projectType": "landing" | "webapp" | "native",
  "description": "Brief description",
  "techStack": {
    "frontend": ["HTML", "CSS", "JavaScript"],
    "backend": ["None"],
    "database": "None"
  },
  "steps": [
    {"id": "1", "agent": "frontend", "task": "Create structure", "dependencies": []}
  ],
  "estimatedTime": "X minutes"
}`
  },
  backend: {
    name: "Backend",
    role: "API and database implementation",
    model: "claude-sonnet-4",
    nextHandoff: "handoff_to_frontend",
    systemPrompt: `You are a backend developer. Create APIs and database schemas.

After generating code, include:
TOOL_CALL: handoff_to_frontend({"backend_artifacts": {...}})`
  },
  frontend: {
    name: "Frontend",
    role: "UI components and styling",
    model: "claude-sonnet-4", // Best for code generation
    nextHandoff: "handoff_to_qa",
    systemPrompt: `You are a frontend developer. Generate complete, working code.

RULES:
1. Generate complete, runnable code - no placeholders
2. Use modern best practices and Tailwind CSS
3. Make it visually stunning and responsive
4. Output code blocks with language tags

For landing pages:
- Complete HTML with Tailwind CDN
- Modern, professional design
- Mobile-responsive layout
- Beautiful gradients and shadows
- Smooth animations

Format your code like:
\`\`\`html
<!DOCTYPE html>
<html>
...complete code...
</html>
\`\`\`

After generating code, include:
TOOL_CALL: handoff_to_qa({"project_artifacts": {"files": [...]}})`
  },
  integrator: {
    name: "Integrator",
    role: "Connect frontend to backend",
    model: "claude-sonnet-4",
    nextHandoff: "handoff_to_qa",
    systemPrompt: `You are an integration specialist. Connect frontend to backend APIs.

After integration, include:
TOOL_CALL: handoff_to_qa({"project_artifacts": {...}})`
  },
  qa: {
    name: "QA",
    role: "Testing and quality assurance",
    model: "claude-sonnet-4",
    nextHandoff: "handoff_to_devops",
    systemPrompt: `You are a QA engineer. Review code for bugs and improvements.

After review, include:
TOOL_CALL: handoff_to_devops({"project_artifacts": {...}})`
  },
  devops: {
    name: "DevOps",
    role: "Deployment and infrastructure",
    model: "claude-sonnet-4",
    nextHandoff: "complete_project",
    systemPrompt: `You are a DevOps engineer. Prepare for deployment.

When ready, include:
TOOL_CALL: complete_project({"final_output": {...}})`
  },
};

// ============= LANGDOCK CHAT COMPLETIONS API CALL =============

async function callLangdock(
  agentKey: string,
  message: string,
  additionalContext?: string
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  // Normalize the API key to avoid common misconfiguration issues:
  // - accidental surrounding whitespace/newlines
  // - user pasting the whole header value ("Bearer <key>") into the secret
  const apiKeyRaw = Deno.env.get("LANGDOCK_API_KEY");
  const apiKey = apiKeyRaw?.trim().replace(/^Bearer\s+/i, "");
  
  if (!apiKey) {
    throw new Error(`LANGDOCK_API_KEY is not configured (build: ${BUILD_ID})`);
  }

  const agent = AGENTS[agentKey as keyof typeof AGENTS];
  if (!agent) {
    throw new Error(`Unknown agent: ${agentKey}`);
  }

  const systemPrompt = agent.systemPrompt + (additionalContext ? `\n\nContext:\n${additionalContext}` : "");
  const model = agent.model || DEFAULT_MODEL;

  console.log(`[Langdock] Calling agent: ${agentKey} with model: ${model}`);
  
  const response = await fetch(LANGDOCK_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Langdock] Error ${response.status}:`, errorText);
    
    if (response.status === 429) {
      throw new Error("Langdock rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 401) {
      throw new Error("Langdock API key is invalid.");
    }
    if (response.status === 402) {
      throw new Error("Langdock payment required. Please check your account.");
    }
    throw new Error(`Langdock call failed: ${response.status} - ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
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
      const agent = AGENTS[key as keyof typeof AGENTS];
      if (agent) {
        this.agentTasks[key] = {
          agentId: key,
          agentName: agent.name,
          role: agent.role,
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

    this.send({
      type: "agent_status",
      agent: agentKey,
      status: "thinking",
      statusLabel: `${AGENTS[agentKey as keyof typeof AGENTS]?.name || agentKey} working...`,
      progress: this.getProgress(),
    });

    await this.executeAgent(agentKey, context);
  }

  private async executeAgent(agentKey: string, context: Record<string, unknown>) {
    const agent = AGENTS[agentKey as keyof typeof AGENTS];
    if (!agent) {
      console.error(`[Orchestration] Unknown agent: ${agentKey}`);
      return;
    }

    try {
      const contextStr = JSON.stringify(context, null, 2);
      const message = this.state.plan 
        ? `Build this project:\n${JSON.stringify(this.state.plan, null, 2)}\n\nContext:\n${contextStr}`
        : `Process this request with context:\n${contextStr}`;

      // Call Langdock via chat completions API
      const { content, toolCalls } = await callLangdock(agentKey, message);

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
    const agent = AGENTS[agentKey as keyof typeof AGENTS];
    if (!agent?.nextHandoff) {
      console.log(`[Orchestration] No next handoff for ${agentKey}, completing`);
      await this.completeProject(context);
      return;
    }

    console.log(`[Orchestration] Auto-handoff: ${agent.nextHandoff}`);
    await this.handleToolCall(agent.nextHandoff, context);
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
      agentName: AGENTS.architect.name,
      role: AGENTS.architect.role,
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
      // Call Langdock architect via chat completions
      const { content, toolCalls } = await callLangdock("architect", message);

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
