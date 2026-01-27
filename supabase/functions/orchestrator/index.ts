// Edge Function: orchestrator
// Multi-agent orchestration using Langdock Assistant API
// Lovable Cloud handles orchestration/state/UX, Langdock handles agent execution

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const BUILD_ID = "orch-v2-competitive";

// ============= LANGDOCK ASSISTANT API CONFIGURATION =============

const LANGDOCK_ASSISTANT_API_URL = "https://api.langdock.com/assistant/v1/chat/completions";

const AGENT_ASSISTANT_ENV_VARS: Record<string, string> = {
  architect: "AGENT_ARCHITECT_ID",
  backend: "AGENT_BACKEND_ID",
  frontend: "AGENT_FRONTEND_ID",
  integrator: "AGENT_INTEGRATOR_ID",
  qa: "AGENT_QA_ID",
  devops: "AGENT_DEVOPS_ID",
};

// ============= COMPETITIVE DESIGN SYSTEM =============

const DESIGN_SYSTEM = `
## DESIGN EXCELLENCE GUIDELINES

You are competing with Lovable.dev, Bolt.new, and Claude Artifacts. Your output MUST be visually stunning.

### MANDATORY VISUAL ELEMENTS:

1. **HERO SECTIONS:**
   - Use large, bold typography (text-5xl to text-7xl for headings)
   - Gradient text effects: bg-gradient-to-r from-X to-Y bg-clip-text text-transparent
   - Animated backgrounds: subtle floating shapes, gradient orbs, or particles
   - Clear CTAs with hover effects and shadows

2. **COLOR PALETTE (pick one scheme per project):**
   - **Dark Mode Premium:** bg-slate-950, text-white, accent purple-500/pink-500
   - **Light Mode Clean:** bg-white, text-slate-900, accent blue-600/indigo-600  
   - **Warm Startup:** bg-orange-50, text-slate-800, accent orange-500/amber-500
   - **Green/Eco:** bg-emerald-50, text-slate-900, accent emerald-500/teal-500

3. **ANIMATIONS (use sparingly but effectively):**
   - Hover transforms: hover:-translate-y-1 hover:scale-105
   - Shadows that grow on hover: hover:shadow-xl hover:shadow-purple-500/20
   - Smooth transitions: transition-all duration-300
   - Entrance animations via CSS @keyframes

4. **CARDS & CONTAINERS:**
   - Glassmorphism: bg-white/10 backdrop-blur-lg border border-white/20
   - Gradient borders: border border-gradient-to-r
   - Rounded corners: rounded-2xl or rounded-3xl
   - Generous padding: p-8 to p-12

5. **TYPOGRAPHY:**
   - Headlines: font-bold tracking-tight
   - Body: text-gray-600 or text-slate-400 (on dark)
   - Use font-size hierarchy strictly

6. **IMAGES:**
   - Use Unsplash: https://images.unsplash.com/photo-XXXXX?w=1200&q=80
   - Or use gradient placeholders with icons/emojis
   - Always set loading="lazy" and proper alt text

7. **SECTIONS:**
   - Hero, Features (3-4 cards), Social Proof/Stats, Pricing (if applicable), CTA, Footer
   - Use py-20 to py-32 for vertical rhythm
   - max-w-7xl mx-auto for content width

8. **MOBILE FIRST:**
   - All layouts must be responsive
   - Use grid md:grid-cols-2 lg:grid-cols-3
   - Stack on mobile, expand on desktop

### CODE OUTPUT FORMAT:
Always wrap your HTML in proper fenced code blocks:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Name</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Add custom styles here -->
</head>
<body>
  <!-- Your stunning design here -->
</body>
</html>
\`\`\`
`;

// ============= AGENT PROMPTS - COMPETITIVE QUALITY =============

const AGENT_PROMPTS = {
  architect: `You are a world-class product architect. Your job is to analyze user requests and create actionable build plans.

## YOUR RESPONSIBILITIES:
1. Understand the user's INTENT, not just their words
2. Design a professional project structure
3. Create a clear, step-by-step execution plan
4. Identify what makes this project SPECIAL and unique

## OUTPUT FORMAT:
First, output a JSON plan in this exact format:
\`\`\`json
{
  "projectName": "Compelling name for the project",
  "projectType": "landing" | "webapp" | "native",
  "description": "2-3 sentence description of what we're building and WHY it's valuable",
  "techStack": {
    "frontend": ["HTML", "Tailwind CSS", "JavaScript"],
    "backend": ["None"],
    "database": "None"
  },
  "designDirection": "Brief description of the visual style (e.g., 'Dark mode premium with purple/pink gradients, glassmorphism effects, bold typography')",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "steps": [
    {"id": "1", "agent": "frontend", "task": "Build hero section with animated gradient background", "dependencies": []},
    {"id": "2", "agent": "frontend", "task": "Create feature cards with hover effects", "dependencies": ["1"]}
  ],
  "estimatedTime": "3-5 minutes"
}
\`\`\`

Then trigger the next phase:
TOOL_CALL: handoff_to_frontend({"plan_json": <your plan>})`,

  frontend: `You are an elite frontend developer competing with Lovable.dev, Bolt.new, and Claude Artifacts.

${DESIGN_SYSTEM}

## YOUR MISSION:
Create STUNNING, production-ready code that makes users say "wow!"

## REQUIREMENTS:
1. COMPLETE HTML with all sections fully implemented
2. Modern Tailwind CSS (use the CDN)
3. Smooth animations and transitions
4. Mobile-responsive design
5. NO placeholders or "TODO" comments
6. ALL images must use real Unsplash URLs or CSS gradients

## AFTER GENERATING CODE:
TOOL_CALL: handoff_to_qa({"project_artifacts": {"files": [...]}})`,

  backend: `You are a senior backend engineer. Create clean, secure API endpoints.

## OUTPUT:
- Supabase Edge Functions in TypeScript
- PostgreSQL schemas with proper RLS
- Clear API documentation

TOOL_CALL: handoff_to_frontend({"backend_artifacts": {...}})`,

  integrator: `You are an integration specialist. Connect frontend to backend seamlessly.

## REQUIREMENTS:
1. Proper error handling
2. Loading states
3. Type safety
4. Clean async/await patterns

TOOL_CALL: handoff_to_qa({"project_artifacts": {...}})`,

  qa: `You are a meticulous QA engineer. Review code for quality.

## CHECK FOR:
1. Visual bugs or layout issues
2. Mobile responsiveness
3. Accessibility issues
4. Code quality and best practices
5. Performance issues

## OUTPUT:
Provide a brief verdict:
- APPROVED: Code is production-ready
- NEEDS_FIXES: List specific issues

TOOL_CALL: handoff_to_devops({"qa_report": {...}})`,

  devops: `You are a DevOps engineer. Prepare for deployment.

## CONFIRM:
1. All files are complete
2. No security issues
3. Ready for production

TOOL_CALL: complete_project({"deployment_ready": true})`,
};

// ============= DIAGNOSTIC =============

function handleDiagnostic(): Response {
  const envObj = Deno.env.toObject();
  
  const assistantStatus: Record<string, boolean> = {};
  for (const [agent, envVar] of Object.entries(AGENT_ASSISTANT_ENV_VARS)) {
    assistantStatus[agent] = Boolean(envObj[envVar] && envObj[envVar].length > 0);
  }

  const diag = {
    build: BUILD_ID,
    timestamp: new Date().toISOString(),
    executionLayer: "langdock-assistant-api",
    apiUrl: LANGDOCK_ASSISTANT_API_URL,
    secrets: {
      LANGDOCK_API_KEY: Boolean(envObj.LANGDOCK_API_KEY && envObj.LANGDOCK_API_KEY.length > 0),
    },
    assistants: assistantStatus,
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
  designDirection?: string;
  keyFeatures?: string[];
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

// ============= AGENT METADATA =============

const AGENTS = {
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

// ============= LANGDOCK API CALL =============

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      const response = await fetch(url, { 
        ...options, 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isRetryable = lastError.message.includes('connection reset') || 
                          lastError.message.includes('network') ||
                          lastError.message.includes('timeout') ||
                          lastError.message.includes('abort');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`[Langdock] Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

async function callLangdockAssistant(
  agentKey: string,
  message: string,
  additionalContext?: string
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  const apiKeyRaw = Deno.env.get("LANGDOCK_API_KEY");
  const apiKey = apiKeyRaw?.trim().replace(/^Bearer\s+/i, "");
  
  if (!apiKey) {
    throw new Error(`LANGDOCK_API_KEY is not configured (build: ${BUILD_ID})`);
  }

  const envVarName = AGENT_ASSISTANT_ENV_VARS[agentKey];
  if (!envVarName) {
    throw new Error(`No environment variable mapping for agent: ${agentKey}`);
  }

  const assistantId = Deno.env.get(envVarName)?.trim();
  if (!assistantId) {
    throw new Error(`${envVarName} is not configured for agent: ${agentKey} (build: ${BUILD_ID})`);
  }

  // Get the competitive prompt for this agent
  const agentPrompt = AGENT_PROMPTS[agentKey as keyof typeof AGENT_PROMPTS] || "";
  const fullMessage = `${agentPrompt}\n\n---\n\nUser Request:\n${message}${additionalContext ? `\n\nAdditional Context:\n${additionalContext}` : ""}`;

  console.log(`[Langdock] Calling assistant for agent: ${agentKey}, assistantId: ${assistantId.slice(0, 8)}...`);
  
  const response = await fetchWithRetry(LANGDOCK_ASSISTANT_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId: assistantId,
      messages: [
        { role: "user", content: fullMessage }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Langdock] Error ${response.status}:`, errorText);
    
    if (response.status === 429) {
      throw new Error("Langdock rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 401) {
      throw new Error("Langdock API key is invalid. Make sure you're using an Agent API key.");
    }
    if (response.status === 402) {
      throw new Error("Langdock payment required. Please check your account.");
    }
    if (response.status === 404) {
      throw new Error(`Langdock assistant not found: ${assistantId}. Check ${envVarName}.`);
    }
    throw new Error(`Langdock assistant call failed: ${response.status} - ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  console.log(`[Langdock] Raw response keys:`, Object.keys(data));
  
  let content = "";
  
  if (data.result && Array.isArray(data.result)) {
    const assistantMessage = data.result.find((m: { role: string }) => m.role === "assistant");
    
    if (assistantMessage?.content && Array.isArray(assistantMessage.content)) {
      const textBlocks = assistantMessage.content
        .filter((block: { type: string; text?: string }) => block.type === "text" && block.text)
        .map((block: { text: string }) => block.text);
      
      if (textBlocks.length > 0) {
        content = textBlocks.join("\n");
      } else {
        content = assistantMessage.content
          .filter((block: { text?: string }) => block.text)
          .map((block: { text: string }) => block.text)
          .join("\n");
      }
    } else if (typeof assistantMessage?.content === "string") {
      content = assistantMessage.content;
    }
  } else if (data.choices?.[0]?.message?.content) {
    content = data.choices[0].message.content;
  }
  
  console.log(`[Langdock] Extracted content length: ${content.length}`);
  
  const toolCalls = detectToolCalls(content);
  console.log(`[Langdock] Tool calls detected: ${toolCalls.length}`);

  return { content, toolCalls };
}

// ============= TOOL CALL DETECTION =============

function detectToolCalls(content: string): ToolCall[] {
  const detectedCalls: ToolCall[] = [];

  const explicitPattern = /TOOL_CALL:\s*(\w+)\s*\(\s*(\{[\s\S]*?\})\s*\)/g;
  let match;
  
  while ((match = explicitPattern.exec(content)) !== null) {
    const [, functionName, paramsJson] = match;
    try {
      const parameters = JSON.parse(paramsJson);
      detectedCalls.push({ name: functionName, parameters });
      console.log(`[Tool Detection] Found: ${functionName}`);
    } catch {
      console.log(`[Tool Detection] Parse failed for ${functionName}`);
    }
  }

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
    
    if (!code || code.length < 50) continue;
    if (language === "json") continue; // Skip JSON blocks (plans)
    
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
  // Look for JSON in code blocks first
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch {
      // Fall through to other methods
    }
  }
  
  // Look for raw JSON with projectName
  const jsonMatch = content.match(/\{[\s\S]*?"projectName"[\s\S]*?\}/);
  if (!jsonMatch) return null;
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

// ============= STUNNING FALLBACK HTML =============

function generateFallbackHtml(projectName: string, description: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(projectName)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          animation: {
            'float': 'float 6s ease-in-out infinite',
            'glow': 'glow 2s ease-in-out infinite alternate',
          }
        }
      }
    }
  </script>
  <style>
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(2deg); }
    }
    @keyframes glow {
      from { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
      to { box-shadow: 0 0 40px rgba(168, 85, 247, 0.8); }
    }
    .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); }
    .gradient-text { background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-x-hidden">
  <!-- Animated Background -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-20 left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-float"></div>
    <div class="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float" style="animation-delay: -3s;"></div>
    <div class="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-float" style="animation-delay: -1.5s;"></div>
  </div>

  <!-- Navigation -->
  <nav class="relative z-50 border-b border-white/10">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="text-2xl font-bold gradient-text">${escapeHtml(projectName)}</div>
      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-gray-300 hover:text-white transition">Features</a>
        <a href="#pricing" class="text-gray-300 hover:text-white transition">Pricing</a>
        <a href="#contact" class="text-gray-300 hover:text-white transition">Contact</a>
        <button class="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all">
          Get Started
        </button>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="relative z-10 min-h-[90vh] flex items-center">
    <div class="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-sm text-purple-300 mb-6">
          <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Now available worldwide
        </div>
        <h1 class="text-5xl md:text-7xl font-bold leading-tight mb-6">
          <span class="gradient-text">${escapeHtml(projectName)}</span>
        </h1>
        <p class="text-xl text-gray-400 mb-8 leading-relaxed">
          ${escapeHtml(description)}
        </p>
        <div class="flex flex-wrap gap-4">
          <button class="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 transition-all">
            Start Free Trial
          </button>
          <button class="px-8 py-4 glass border border-white/20 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all">
            Watch Demo →
          </button>
        </div>
        <div class="flex items-center gap-8 mt-12 text-sm text-gray-400">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Free 14-day trial
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            No credit card required
          </div>
        </div>
      </div>
      <div class="relative">
        <div class="glass rounded-3xl border border-white/20 p-8 animate-glow">
          <div class="aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl flex items-center justify-center">
            <div class="text-6xl">✨</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="relative z-10 py-20 border-y border-white/10">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div class="text-center">
          <div class="text-4xl md:text-5xl font-bold gradient-text mb-2">10K+</div>
          <div class="text-gray-400">Active Users</div>
        </div>
        <div class="text-center">
          <div class="text-4xl md:text-5xl font-bold gradient-text mb-2">99.9%</div>
          <div class="text-gray-400">Uptime</div>
        </div>
        <div class="text-center">
          <div class="text-4xl md:text-5xl font-bold gradient-text mb-2">50M+</div>
          <div class="text-gray-400">API Calls</div>
        </div>
        <div class="text-center">
          <div class="text-4xl md:text-5xl font-bold gradient-text mb-2">4.9★</div>
          <div class="text-gray-400">User Rating</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="relative z-10 py-32">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">Everything you need to build amazing products, all in one place.</p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="glass p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 hover:-translate-y-2 transition-all group">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">⚡</div>
          <h3 class="text-xl font-semibold mb-3">Lightning Fast</h3>
          <p class="text-gray-400">Built for speed with optimized performance at every level.</p>
        </div>
        <div class="glass p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 hover:-translate-y-2 transition-all group">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🔒</div>
          <h3 class="text-xl font-semibold mb-3">Enterprise Security</h3>
          <p class="text-gray-400">Bank-grade encryption and security protocols to protect your data.</p>
        </div>
        <div class="glass p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 hover:-translate-y-2 transition-all group">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🎨</div>
          <h3 class="text-xl font-semibold mb-3">Beautiful Design</h3>
          <p class="text-gray-400">Stunning interfaces that users love and remember.</p>
        </div>
        <div class="glass p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 hover:-translate-y-2 transition-all group">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🌍</div>
          <h3 class="text-xl font-semibold mb-3">Global Scale</h3>
          <p class="text-gray-400">Deploy worldwide with our global infrastructure.</p>
        </div>
        <div class="glass p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 hover:-translate-y-2 transition-all group">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">💬</div>
          <h3 class="text-xl font-semibold mb-3">24/7 Support</h3>
          <p class="text-gray-400">Expert help whenever you need it, day or night.</p>
        </div>
        <div class="glass p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 hover:-translate-y-2 transition-all group">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🔌</div>
          <h3 class="text-xl font-semibold mb-3">Easy Integration</h3>
          <p class="text-gray-400">Connect with your favorite tools in minutes.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="relative z-10 py-32">
    <div class="max-w-4xl mx-auto px-6">
      <div class="glass rounded-3xl border border-white/20 p-12 md:p-16 text-center relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
        <div class="relative z-10">
          <h2 class="text-4xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
          <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users and transform your workflow today.
          </p>
          <button class="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 transition-all">
            Start Your Free Trial →
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="relative z-10 border-t border-white/10 py-12">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-2xl font-bold gradient-text">${escapeHtml(projectName)}</div>
        <div class="flex gap-6 text-gray-400">
          <a href="#" class="hover:text-white transition">Privacy</a>
          <a href="#" class="hover:text-white transition">Terms</a>
          <a href="#" class="hover:text-white transition">Contact</a>
        </div>
        <div class="text-gray-500">© 2025 ${escapeHtml(projectName)}. All rights reserved.</div>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============= ORCHESTRATION ENGINE =============

class OrchestrationEngine {
  private state: OrchestrationState;
  private send: (data: object) => void;
  private agentTasks: Record<string, AgentTask> = {};
  private originalRequest: string = "";

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

    await this.executeAgent(agentKey, context, this.originalRequest);
  }

  private async executeAgent(agentKey: string, context: Record<string, unknown>, originalRequest?: string) {
    const agent = AGENTS[agentKey as keyof typeof AGENTS];
    if (!agent) {
      console.error(`[Orchestration] Unknown agent: ${agentKey}`);
      return;
    }

    try {
      let message = "";
      
      if (agentKey === "frontend") {
        // Build comprehensive frontend request
        const plan = this.state.plan;
        message = `Create a stunning, production-ready ${plan?.projectType || 'landing'} page.

PROJECT: ${plan?.projectName || 'Web Project'}
DESCRIPTION: ${plan?.description || originalRequest || 'A beautiful modern website'}
DESIGN DIRECTION: ${plan?.designDirection || 'Dark mode premium with purple/pink gradients and glassmorphism'}
KEY FEATURES: ${plan?.keyFeatures?.join(', ') || 'Hero section, Features, CTA, Footer'}

Original User Request: ${originalRequest || this.originalRequest}

CRITICAL: Output complete HTML code in a \`\`\`html code block. Make it STUNNING!`;
      } else if (agentKey === "qa") {
        const generatedCode = this.state.files.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n');
        message = `Review this generated code:\n\n${generatedCode || 'No code yet.'}\n\nProvide brief verdict.`;
      } else if (agentKey === "devops") {
        message = `Confirm deployment readiness for: ${this.state.plan?.projectName}. Files: ${this.state.files.length}`;
      } else {
        message = this.state.plan 
          ? `Build: ${JSON.stringify(this.state.plan, null, 2)}`
          : `Process: ${JSON.stringify(context, null, 2)}`;
      }

      const { content, toolCalls } = await callLangdockAssistant(agentKey, message);

      // Extract code
      const expectsCode = ["frontend", "backend", "integrator"].includes(agentKey);
      let files = extractCodeBlocks(content);

      // Fallback for frontend
      if (agentKey === "frontend" && files.length === 0) {
        console.log(`[Orchestration] Frontend returned no code, using stunning fallback...`);
        const fallbackHtml = generateFallbackHtml(
          this.state.plan?.projectName || "Generated Project",
          this.state.plan?.description || this.originalRequest || "A beautiful landing page"
        );
        files = [{ filename: "index.html", path: "index.html", content: fallbackHtml, language: "html" }];
      }

      if (expectsCode && agentKey !== "frontend" && files.length === 0) {
        throw new Error(`No code generated by ${agentKey} agent.`);
      }

      if (files.length > 0) {
        this.state.files.push(...files);
        
        for (const file of files) {
          this.send({ type: "file_generated", agent: agentKey, file });
        }

        const htmlFile = files.find(f => f.language === "html");
        if (htmlFile) {
          this.send({ type: "preview_ready", html: htmlFile.content });
        }
      }

      // Update status
      if (this.agentTasks[agentKey]) {
        this.agentTasks[agentKey].status = "complete";
        this.agentTasks[agentKey].statusLabel = "Done";
      }

      this.send({
        type: "agent_status",
        agent: agentKey,
        status: "complete",
        statusLabel: "Complete",
        progress: this.getProgress(),
      });

      // Handle tool calls
      if (toolCalls.length > 0) {
        for (const tc of toolCalls) {
          await this.handleToolCall(tc.name, tc.parameters);
        }
      } else {
        await this.autoHandoff(agentKey, context);
      }

    } catch (err) {
      console.error(`[Orchestration] Agent error:`, err);
      
      if (this.agentTasks[agentKey]) {
        this.agentTasks[agentKey].status = "error";
      }

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
      await this.completeProject(context);
      return;
    }
    await this.handleToolCall(agent.nextHandoff, context);
  }

  private async completeProject(_context: Record<string, unknown>) {
    this.state.phase = "complete";
    this.log("system", "Project complete!");

    for (const key of Object.keys(this.agentTasks)) {
      if (this.agentTasks[key].status !== "error") {
        this.agentTasks[key].status = "complete";
      }
    }

    this.send({
      type: "project_complete",
      files: this.state.files,
      plan: this.state.plan,
      progress: 100,
    });

    this.send({
      type: "complete",
      agents: this.agentTasks,
      summary: `✅ **${this.state.plan?.projectName || 'Project'}** is ready!\n\n${this.state.files.length} files generated. Use the refine panel below to make adjustments.`,
    });
  }

  async startPlanning(message: string) {
    this.originalRequest = message;
    this.state.phase = "planning";
    this.state.currentAgent = "architect";
    this.log("architect", "Starting planning...");

    this.agentTasks["architect"] = {
      agentId: "architect",
      agentName: AGENTS.architect.name,
      role: AGENTS.architect.role,
      status: "thinking",
      statusLabel: "Analyzing requirements...",
    };

    this.send({ type: "agents_init", agents: this.agentTasks });
    this.send({
      type: "agent_status",
      agent: "architect",
      status: "thinking",
      statusLabel: "Analyzing requirements...",
    });

    try {
      const { content, toolCalls } = await callLangdockAssistant("architect", message);

      const plan = extractPlan(content);
      if (plan) {
        this.state.plan = plan;
        this.initAgentsFromPlan(plan);
        this.send({ type: "plan_created", plan });
      }

      this.agentTasks["architect"].status = "complete";
      this.agentTasks["architect"].statusLabel = "Plan ready";

      this.send({
        type: "agent_status",
        agent: "architect",
        status: "complete",
        statusLabel: "Plan ready",
      });

      // IMPORTANT: Don't auto-handoff - wait for user approval
      // The frontend will show the plan and wait for approval
      
    } catch (err) {
      console.error("[Orchestration] Planning error:", err);
      this.send({
        type: "error",
        message: err instanceof Error ? err.message : "Planning failed",
        build: BUILD_ID,
      });
    }
  }

  async startExecution(message: string, plan: ProjectPlan) {
    this.originalRequest = message;
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

  async handleRefine(feedback: string, currentCode: string, plan: ProjectPlan) {
    this.originalRequest = feedback;
    this.state.plan = plan;
    this.state.files = [];
    
    this.agentTasks["frontend"] = {
      agentId: "frontend",
      agentName: AGENTS.frontend.name,
      role: "Refining design",
      status: "thinking",
      statusLabel: "Applying changes...",
    };

    this.send({ type: "agents_init", agents: this.agentTasks });

    const refineMessage = `Refine this existing code based on user feedback.

CURRENT CODE:
${currentCode}

USER FEEDBACK:
${feedback}

ORIGINAL PROJECT:
${plan.projectName} - ${plan.description}

Update the code to incorporate the feedback while keeping the overall structure. Output complete HTML.`;

    try {
      const { content } = await callLangdockAssistant("frontend", refineMessage);
      
      let files = extractCodeBlocks(content);
      if (files.length === 0) {
        // Keep the original code if refinement fails
        throw new Error("Refinement did not produce updated code. Please try different feedback.");
      }

      this.state.files = files;
      
      for (const file of files) {
        this.send({ type: "file_generated", agent: "frontend", file });
      }

      const htmlFile = files.find(f => f.language === "html");
      if (htmlFile) {
        this.send({ type: "preview_ready", html: htmlFile.content });
      }

      this.agentTasks["frontend"].status = "complete";
      
      this.send({
        type: "complete",
        agents: this.agentTasks,
        summary: `✨ **Design refined!** Applied your changes.`,
      });

    } catch (err) {
      this.send({
        type: "error",
        message: err instanceof Error ? err.message : "Refinement failed",
      });
    }
  }

  async answerQuestion(question: string, plan: ProjectPlan) {
    try {
      const message = `User question about the build plan: "${question}"

Current Plan:
${JSON.stringify(plan, null, 2)}

Provide a helpful, concise answer.`;

      const { content } = await callLangdockAssistant("architect", message);
      
      this.send({
        type: "agent_message",
        agent: "Planner",
        message: content,
      });

    } catch (err) {
      this.send({
        type: "error",
        message: err instanceof Error ? err.message : "Could not answer question",
      });
    }
  }
}

// ============= MAIN HANDLER =============

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

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
    const { action, message, plan, currentCode } = await req.json();

    if (action === "diag") {
      return handleDiagnostic();
    }

    if (!message && action !== "question") {
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
        } else if (action === "refine") {
          await orchestrator.handleRefine(message, currentCode, plan as ProjectPlan);
        } else if (action === "question") {
          await orchestrator.answerQuestion(message, plan as ProjectPlan);
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
