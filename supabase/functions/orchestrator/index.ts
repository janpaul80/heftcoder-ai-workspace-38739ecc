import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bump this when diagnosing deployments so we can confirm which version is running.
const BUILD_ID = "orchestrator-2026-01-24-03";

// Handle diagnostic requests to verify secrets are injected
function handleDiagnostic(): Response {
  const envObj = Deno.env.toObject();
  const diag = {
    build: BUILD_ID,
    timestamp: new Date().toISOString(),
    secrets: {
      LANGDOCK_API_KEY: Boolean(envObj.LANGDOCK_API_KEY && envObj.LANGDOCK_API_KEY.length > 0),
      AGENT_ARCHITECT_ID: Boolean(envObj.AGENT_ARCHITECT_ID),
      AGENT_BACKEND_ID: Boolean(envObj.AGENT_BACKEND_ID),
      AGENT_FRONTEND_ID: Boolean(envObj.AGENT_FRONTEND_ID),
      AGENT_INTEGRATOR_ID: Boolean(envObj.AGENT_INTEGRATOR_ID),
      AGENT_QA_ID: Boolean(envObj.AGENT_QA_ID),
      AGENT_DEVOPS_ID: Boolean(envObj.AGENT_DEVOPS_ID),
    },
    apiKeyLength: envObj.LANGDOCK_API_KEY?.length || 0,
  };
  console.log("[Diagnostic]", JSON.stringify(diag));
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
  path: string;
  content: string;
  language: string;
}

interface GeneratedProject {
  type: ProjectType;
  name: string;
  files: GeneratedFile[];
  previewHtml?: string;
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

class ConfigError extends Error {
  diag: Record<string, boolean>;
  constructor(message: string, diag: Record<string, boolean>) {
    super(message);
    this.name = "ConfigError";
    this.diag = diag;
  }
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

// ============= TOOL DEFINITIONS (Functions Agents Can Call) =============

const HANDOFF_TOOLS = {
  handoff_to_backend: {
    name: "handoff_to_backend",
    description: "Call this when plan is approved to delegate backend work to Agent 2",
    parameters: {
      type: "object",
      properties: {
        plan_json: { type: "object", description: "The structured plan" }
      },
      required: ["plan_json"]
    }
  },
  handoff_to_frontend: {
    name: "handoff_to_frontend",
    description: "Call this when backend is ready to delegate UI work to Agent 3",
    parameters: {
      type: "object",
      properties: {
        backend_artifacts: { type: "object", description: "Backend code and schema" }
      },
      required: ["backend_artifacts"]
    }
  },
  handoff_to_integrator: {
    name: "handoff_to_integrator",
    description: "Call this when frontend is ready to connect frontend to backend",
    parameters: {
      type: "object",
      properties: {
        frontend_artifacts: { type: "object", description: "Frontend components" },
        backend_artifacts: { type: "object", description: "Backend API" }
      },
      required: ["frontend_artifacts"]
    }
  },
  handoff_to_qa: {
    name: "handoff_to_qa",
    description: "Call this when integration is complete to run tests",
    parameters: {
      type: "object",
      properties: {
        project_artifacts: { type: "object", description: "Complete project" }
      },
      required: ["project_artifacts"]
    }
  },
  handoff_to_devops: {
    name: "handoff_to_devops",
    description: "Call this when QA passes to deploy the project",
    parameters: {
      type: "object",
      properties: {
        project_artifacts: { type: "object", description: "Tested project" }
      },
      required: ["project_artifacts"]
    }
  },
  complete_project: {
    name: "complete_project",
    description: "Call this when the project is fully deployed and ready",
    parameters: {
      type: "object",
      properties: {
        final_output: { type: "object", description: "Final project summary" }
      },
      required: ["final_output"]
    }
  }
};

// ============= AGENT CONFIGURATION =============

const AGENTS = {
  architect: {
    id: () => Deno.env.get("AGENT_ARCHITECT_ID"),
    name: "Planner",
    role: "System design and project structure",
    nextHandoff: "handoff_to_frontend", // For landing pages, skip backend
  },
  backend: {
    id: () => Deno.env.get("AGENT_BACKEND_ID"),
    name: "Backend",
    role: "API and database implementation",
    nextHandoff: "handoff_to_frontend",
  },
  frontend: {
    id: () => Deno.env.get("AGENT_FRONTEND_ID"),
    name: "Frontend",
    role: "UI components and styling",
    nextHandoff: "handoff_to_integrator",
  },
  integrator: {
    id: () => Deno.env.get("AGENT_INTEGRATOR_ID"),
    name: "Integrator",
    role: "Connect frontend to backend",
    nextHandoff: "handoff_to_qa",
  },
  qa: {
    id: () => Deno.env.get("AGENT_QA_ID"),
    name: "QA",
    role: "Testing and quality assurance",
    nextHandoff: "handoff_to_devops",
  },
  devops: {
    id: () => Deno.env.get("AGENT_DEVOPS_ID"),
    name: "DevOps",
    role: "Deployment and infrastructure",
    nextHandoff: "complete_project",
  },
};

// ============= PROMPTS =============

const PLANNER_SYSTEM_PROMPT = `You are a project planner for a code generation system. Analyze the user's request and create a project plan.

IMPORTANT: You have access to tools for delegating work. After creating the plan, you MUST call the appropriate handoff tool.

For landing pages: Call handoff_to_frontend() with the plan
For web apps: Call handoff_to_backend() with the plan (if backend needed) or handoff_to_frontend() if frontend-only

Output a JSON plan first, then call the handoff tool.

Plan format:
{
  "projectName": "string",
  "projectType": "landing" | "webapp" | "native",
  "description": "Brief description",
  "techStack": {
    "frontend": ["HTML", "CSS", "JavaScript"] or ["React", "TypeScript", "Tailwind"],
    "backend": ["None"] or ["Supabase"],
    "database": "None" or "PostgreSQL"
  },
  "steps": [
    {"id": "1", "agent": "frontend", "task": "Create structure", "dependencies": []}
  ],
  "estimatedTime": "X minutes"
}

After outputting the plan, ALWAYS end with:
TOOL_CALL: handoff_to_frontend({"plan_json": <the plan object>})`;

const CODE_GENERATION_PROMPT = `You are a code generator. Generate complete, working code.

RULES:
1. Generate complete, runnable code - no placeholders
2. Use modern best practices and Tailwind CSS
3. Make it visually stunning and responsive
4. Output code blocks with language tags

For landing pages:
- Complete HTML with Tailwind CDN
- Modern, professional design
- Mobile-responsive layout

Format:
\`\`\`html
<!-- your HTML code -->
\`\`\`

After generating code, call:
TOOL_CALL: handoff_to_qa({"project_artifacts": {"files": [...]}})`;

// ============= TOOL CALL DETECTION =============

function detectToolCalls(content: string): ToolCall[] {
  const detectedCalls: ToolCall[] = [];

  // Strategy 1: Explicit syntax - TOOL_CALL: function_name({...})
  const explicitPattern = /TOOL_CALL:\s*(\w+)\s*\(\s*(\{[\s\S]*?\})\s*\)/g;
  let match;
  
  while ((match = explicitPattern.exec(content)) !== null) {
    const [, functionName, paramsJson] = match;
    try {
      const parameters = JSON.parse(paramsJson);
      detectedCalls.push({ name: functionName, parameters });
      console.log(`[Tool Detection] Found explicit call: ${functionName}`);
    } catch (e) {
      console.log(`[Tool Detection] Failed to parse params for ${functionName}:`, e);
    }
  }

  // Strategy 2: Keyword fallback - natural language handoffs
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
        console.log(`[Tool Detection] Found keyword match: ${tool}`);
        break;
      }
    }
  }

  return detectedCalls;
}

// ============= LANGDOCK API CALL =============

async function callLangdockAgent(
  agentId: string, 
  message: string, 
  systemPrompt?: string,
  tools?: object[]
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  const apiKey = Deno.env.get("LANGDOCK_API_KEY");

  // Safe diagnostics (never include secret values)
  const envObj = Deno.env.toObject();
  const envDiag = {
    LANGDOCK_API_KEY: Boolean(envObj.LANGDOCK_API_KEY && envObj.LANGDOCK_API_KEY.trim() !== ""),
    AGENT_ARCHITECT_ID: Boolean(envObj.AGENT_ARCHITECT_ID && envObj.AGENT_ARCHITECT_ID.trim() !== ""),
    AGENT_BACKEND_ID: Boolean(envObj.AGENT_BACKEND_ID && envObj.AGENT_BACKEND_ID.trim() !== ""),
    AGENT_FRONTEND_ID: Boolean(envObj.AGENT_FRONTEND_ID && envObj.AGENT_FRONTEND_ID.trim() !== ""),
    AGENT_INTEGRATOR_ID: Boolean(envObj.AGENT_INTEGRATOR_ID && envObj.AGENT_INTEGRATOR_ID.trim() !== ""),
    AGENT_QA_ID: Boolean(envObj.AGENT_QA_ID && envObj.AGENT_QA_ID.trim() !== ""),
    AGENT_DEVOPS_ID: Boolean(envObj.AGENT_DEVOPS_ID && envObj.AGENT_DEVOPS_ID.trim() !== ""),
  };
  
  console.log("[Langdock] API Key:", apiKey ? `Found (${apiKey.length} chars)` : "NOT FOUND");
  console.log("[Langdock] Agent ID:", agentId || "NOT CONFIGURED");
  console.log("[Env] Required vars present:", envDiag);
  console.log("[Build]", BUILD_ID);
  
  if (!apiKey || apiKey.trim() === "") {
    throw new ConfigError(
      `LANGDOCK_API_KEY is not configured (build: ${BUILD_ID})`,
      envDiag
    );
  }

  if (!agentId || agentId.trim() === "") {
    throw new Error("Agent ID not configured");
  }

  // Langdock Assistant API doesn't support "system" role - embed system prompt in user message
  const userContent = systemPrompt 
    ? `${systemPrompt}\n\n---\n\nUser Request: ${message}`
    : message;
  
  const messages = [{ role: "user", content: userContent }];

  const requestBody: Record<string, unknown> = {
    assistantId: agentId, // Langdock requires assistantId in body, not URL
    messages,
    stream: false,
  };

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestBody.tools = tools;
    console.log("[Langdock] Passing tools:", tools.map((t: any) => t.name));
  }

  console.log("[Langdock] Calling API with assistantId:", agentId);

  const response = await fetch("https://api.langdock.com/assistant/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Langdock] Error ${response.status}:`, errorText);
    // Surface the actual error from Langdock so we can debug
    throw new Error(`Agent call failed: ${response.status} - ${errorText.slice(0, 500)}`);
  }

  const data = await response.json();
  console.log("[Langdock] Raw response keys:", Object.keys(data));
  
  // Langdock returns { result: [...], output: {} } format per their docs
  // Try multiple response formats for compatibility
  let content = "";
  if (data.result && Array.isArray(data.result)) {
    // Langdock format: result array with message objects
    const textParts = data.result
      .filter((r: any) => r.content)
      .flatMap((r: any) => r.content)
      .filter((c: any) => c.type === "text" && c.text)
      .map((c: any) => c.text);
    content = textParts.join("\n");
  } else if (data.choices?.[0]?.message?.content) {
    // OpenAI-compatible format
    content = data.choices[0].message.content;
  } else if (typeof data.output === "string") {
    content = data.output;
  }
  
  // Detect tool calls in the response
  const toolCalls = detectToolCalls(content);
  
  console.log("[Langdock] Response length:", content.length);
  console.log("[Langdock] Tool calls detected:", toolCalls.length);

  return { content, toolCalls };
}

// ============= CODE EXTRACTION =============

function extractCodeBlocks(content: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || "text";
    const code = match[2].trim();
    
    let path = "code";
    if (language === "html") path = "index.html";
    else if (language === "css") path = "styles.css";
    else if (language === "javascript" || language === "js") path = "script.js";
    else if (language === "typescript" || language === "ts") path = "app.ts";
    else if (language === "tsx") path = "App.tsx";
    else if (language === "jsx") path = "App.jsx";
    
    files.push({ path, content: code, language });
  }

  return files;
}

function buildPreviewHtml(files: GeneratedFile[], projectName: string): string {
  const htmlFile = files.find(f => f.path.endsWith(".html"));
  const cssFile = files.find(f => f.path.endsWith(".css"));
  const jsFile = files.find(f => f.language === "javascript" || f.language === "js");

  if (htmlFile) {
    let html = htmlFile.content;
    
    if (cssFile && !html.includes("<style>")) {
      html = html.replace("</head>", `<style>\n${cssFile.content}\n</style>\n</head>`);
    }
    
    if (jsFile && !html.includes("<script>")) {
      html = html.replace("</body>", `<script>\n${jsFile.content}\n</script>\n</body>`);
    }
    
    return html;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${cssFile ? `<style>\n${cssFile.content}\n</style>` : ""}
</head>
<body class="min-h-screen bg-gray-50">
  <div id="root"></div>
  ${jsFile ? `<script>\n${jsFile.content}\n</script>` : ""}
</body>
</html>`;
}

function parsePlanFromResponse(response: string): ProjectPlan | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*?"projectName"[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ProjectPlan;
    }
    return null;
  } catch {
    console.error("[Parse] Failed to parse plan");
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

  async handleToolCall(toolName: string, parameters: Record<string, unknown>): Promise<void> {
    console.log(`[Orchestration] Handling tool call: ${toolName}`);

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

    // Update agent status
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

    // Execute the agent
    await this.executeAgent(agentKey, context);
  }

  private async executeAgent(agentKey: string, context: Record<string, unknown>) {
    const agent = AGENTS[agentKey as keyof typeof AGENTS];
    if (!agent) {
      console.error(`[Orchestration] Unknown agent: ${agentKey}`);
      return;
    }

    const agentId = agent.id();
    if (!agentId) {
      console.error(`[Orchestration] No ID for agent: ${agentKey}`);
      // Auto-complete if agent not configured
      await this.autoHandoff(agentKey, context);
      return;
    }

    // Build agent-specific prompt
    const prompt = this.getAgentPrompt(agentKey, context);
    const tools = this.getToolsForAgent(agentKey);

    try {
      this.send({
        type: "agent_status",
        agent: agentKey,
        status: "creating",
        statusLabel: "Generating...",
      });

      const result = await callLangdockAgent(agentId, prompt, undefined, tools);

      // Extract any code from the response
      const files = extractCodeBlocks(result.content);
      if (files.length > 0) {
        this.state.files.push(...files);
        
        // Build preview
        const previewHtml = buildPreviewHtml(this.state.files, this.state.plan?.projectName || "Project");
        const project: GeneratedProject = {
          type: this.state.plan?.projectType || "webapp",
          name: this.state.plan?.projectName || "Project",
          files: this.state.files,
          previewHtml,
        };

        this.send({ type: "code_generated", project });
      }

      // Update agent status
      this.send({
        type: "agent_status",
        agent: agentKey,
        status: "complete",
        statusLabel: "Done",
        output: result.content,
        code: files.map(f => f.content).join("\n\n"),
      });

      // Handle tool calls from the response
      if (result.toolCalls.length > 0) {
        for (const toolCall of result.toolCalls) {
          await this.handleToolCall(toolCall.name, toolCall.parameters);
        }
      } else {
        // No tool call detected - auto-handoff to next agent
        await this.autoHandoff(agentKey, { ...context, output: result.content, files });
      }
    } catch (err) {
      console.error(`[Orchestration] Agent ${agentKey} error:`, err);
      this.send({
        type: "agent_status",
        agent: agentKey,
        status: "error",
        statusLabel: err instanceof Error ? err.message : "Failed",
      });
      // Continue to next agent anyway
      await this.autoHandoff(agentKey, context);
    }
  }

  private async autoHandoff(currentAgent: string, context: Record<string, unknown>) {
    const agent = AGENTS[currentAgent as keyof typeof AGENTS];
    if (agent?.nextHandoff) {
      console.log(`[Orchestration] Auto-handoff from ${currentAgent} via ${agent.nextHandoff}`);
      await this.handleToolCall(agent.nextHandoff, context);
    }
  }

  private getAgentPrompt(agentKey: string, context: Record<string, unknown>): string {
    const plan = this.state.plan;
    const planJson = JSON.stringify(plan, null, 2);

    const prompts: Record<string, string> = {
      backend: `You are a Backend Engineer. Build the backend based on this plan:
${planJson}

Create database schemas and API endpoints as needed.
When complete, call: TOOL_CALL: handoff_to_frontend({"backend_artifacts": {...}})`,

      frontend: `You are a Frontend Engineer. Build a stunning UI based on this plan:
${planJson}

Project Description: ${plan?.description || context.message}

IMPORTANT:
1. Generate COMPLETE, working HTML with Tailwind CSS (use CDN)
2. Make it visually stunning - modern gradients, shadows, animations
3. Mobile-responsive design
4. No placeholders - real content

Output your code in a code block:
\`\`\`html
<!DOCTYPE html>
...complete code...
\`\`\`

When complete, call: TOOL_CALL: handoff_to_qa({"project_artifacts": {...}})`,

      integrator: `You are an Integration Engineer. Connect the frontend to the backend.
Plan: ${planJson}

When complete, call: TOOL_CALL: handoff_to_qa({"project_artifacts": {...}})`,

      qa: `You are a QA Engineer. Test the project for:
- Responsive design
- Accessibility
- Performance

Plan: ${planJson}

When tests pass, call: TOOL_CALL: handoff_to_devops({"project_artifacts": {...}})`,

      devops: `You are a DevOps Engineer. The project is ready for deployment.
Plan: ${planJson}

When deployed, call: TOOL_CALL: complete_project({"final_output": {...}})`,
    };

    return prompts[agentKey] || `Execute task for: ${planJson}`;
  }

  private getToolsForAgent(agentKey: string): object[] {
    const toolMap: Record<string, string[]> = {
      architect: ["handoff_to_backend", "handoff_to_frontend"],
      backend: ["handoff_to_frontend"],
      frontend: ["handoff_to_integrator", "handoff_to_qa"],
      integrator: ["handoff_to_qa"],
      qa: ["handoff_to_devops"],
      devops: ["complete_project"],
    };

    const toolNames = toolMap[agentKey] || [];
    return toolNames.map(name => HANDOFF_TOOLS[name as keyof typeof HANDOFF_TOOLS]).filter(Boolean);
  }

  private async completeProject(context: Record<string, unknown>) {
    this.state.phase = "complete";
    this.log("orchestrator", "Project complete!");

    const finalProject: GeneratedProject = {
      type: this.state.plan?.projectType || "webapp",
      name: this.state.plan?.projectName || "Project",
      files: this.state.files,
      previewHtml: buildPreviewHtml(this.state.files, this.state.plan?.projectName || "Project"),
    };

    this.send({
      type: "complete",
      agents: this.agentTasks,
      summary: `## ${finalProject.name}\n\nYour ${finalProject.type} has been generated!\n\n**Files created:**\n${finalProject.files.map(f => `- ${f.path}`).join("\n")}\n\nView the preview on the right.`,
      project: finalProject,
    });
  }

  async startPlanning(message: string) {
    this.state.phase = "planning";
    this.log("architect", "Starting planning...");

    // Initialize architect
    this.agentTasks = {
      architect: {
        agentId: AGENTS.architect.id() || "",
        agentName: AGENTS.architect.name,
        role: AGENTS.architect.role,
        status: "thinking",
        statusLabel: "Analyzing requirements...",
      },
    };

    this.send({ type: "agents_init", agents: this.agentTasks });
    this.send({
      type: "agent_status",
      agent: "architect",
      status: "thinking",
      statusLabel: "Analyzing requirements...",
    });

    const architectId = AGENTS.architect.id();
    
    if (!architectId) {
      // Fallback: create a basic plan without calling the API
      console.log("[Orchestration] No architect ID, using fallback plan");
      const lowerMsg = message.toLowerCase();
      let projectType: ProjectType = "webapp";
      if (lowerMsg.includes("landing") || lowerMsg.includes("page") || lowerMsg.includes("homepage")) {
        projectType = "landing";
      } else if (lowerMsg.includes("mobile") || lowerMsg.includes("native") || lowerMsg.includes("app")) {
        projectType = "native";
      }

      const fallbackPlan: ProjectPlan = {
        projectName: "Generated Project",
        projectType,
        description: message,
        techStack: {
          frontend: ["HTML", "Tailwind CSS", "JavaScript"],
          backend: [],
          database: "None",
        },
        steps: [
          { id: "1", agent: "frontend", task: "Build UI", dependencies: [] },
          { id: "2", agent: "qa", task: "Test", dependencies: ["1"] },
        ],
        estimatedTime: "2-3 minutes",
      };

      this.state.plan = fallbackPlan;
      this.initAgentsFromPlan(fallbackPlan);

      this.send({
        type: "agent_status",
        agent: "architect",
        status: "complete",
        statusLabel: "Plan ready",
      });
      this.send({ type: "plan_ready", plan: fallbackPlan });
      return;
    }

    try {
      const tools = [HANDOFF_TOOLS.handoff_to_backend, HANDOFF_TOOLS.handoff_to_frontend];
      const result = await callLangdockAgent(
        architectId,
        `Create a project plan for: ${message}`,
        PLANNER_SYSTEM_PROMPT,
        tools
      );

      const plan = parsePlanFromResponse(result.content);
      
      if (plan) {
        this.state.plan = plan;
        this.initAgentsFromPlan(plan);
      } else {
        // Fallback plan
        const lowerMsg = message.toLowerCase();
        let projectType: ProjectType = "webapp";
        if (lowerMsg.includes("landing") || lowerMsg.includes("page")) {
          projectType = "landing";
        }

        this.state.plan = {
          projectName: "Project",
          projectType,
          description: message,
          techStack: {
            frontend: ["HTML", "Tailwind CSS"],
            backend: [],
            database: "None",
          },
          steps: [{ id: "1", agent: "frontend", task: "Build", dependencies: [] }],
          estimatedTime: "2 minutes",
        };
        this.initAgentsFromPlan(this.state.plan);
      }

      this.send({
        type: "agent_status",
        agent: "architect",
        status: "complete",
        statusLabel: "Plan ready",
        output: result.content,
      });
      this.send({ type: "plan_ready", plan: this.state.plan });

    } catch (err) {
      console.error("[Orchestration] Planning error:", err);
      const isConfig = err instanceof ConfigError;
      this.send({
        type: "agent_status",
        agent: "architect",
        status: "error",
        statusLabel: err instanceof Error ? err.message : "Planning failed",
        ...(isConfig ? { diag: err.diag, build: BUILD_ID } : { build: BUILD_ID }),
      });
      this.send({
        type: "error",
        message: err instanceof Error ? err.message : "Planning failed",
        ...(isConfig ? { diag: err.diag, build: BUILD_ID } : { build: BUILD_ID }),
      });
    }
  }

  private initAgentsFromPlan(plan: ProjectPlan) {
    const uniqueAgents = new Set(plan.steps.map(s => s.agent));
    
    for (const agentKey of uniqueAgents) {
      const agent = AGENTS[agentKey as keyof typeof AGENTS];
      if (agent) {
        this.agentTasks[agentKey] = {
          agentId: agent.id() || "",
          agentName: agent.name,
          role: agent.role,
          status: "idle",
        };
      }
    }
  }

  async startExecution(message: string, plan: ProjectPlan) {
    this.state.plan = plan;
    this.state.phase = "building_frontend";
    this.initAgentsFromPlan(plan);

    this.send({ type: "agents_init", agents: this.agentTasks });

    // Determine starting point
    const hasBackend = plan.steps.some(s => s.agent === "backend");
    
    if (hasBackend) {
      await this.handleToolCall("handoff_to_backend", { plan_json: plan, message });
    } else {
      await this.handleToolCall("handoff_to_frontend", { plan_json: plan, message });
    }
  }
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, message, plan } = await req.json();

    // Diagnostic endpoint - returns JSON showing secret presence
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
