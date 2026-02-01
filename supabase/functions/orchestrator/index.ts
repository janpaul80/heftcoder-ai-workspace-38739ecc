// Edge Function: orchestrator
// Multi-agent orchestration using Langdock Assistant API
// Lovable Cloud handles orchestration/state/UX, Langdock handles agent execution
// v7: Async job-based planning with EdgeRuntime.waitUntil for background processing

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const BUILD_ID = "orch-v7-async-jobs";

// Supabase client for job persistence
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============= AI PROVIDER CONFIGURATION =============

// Primary: Langdock Assistant API
const LANGDOCK_ASSISTANT_API_URL = "https://api.langdock.com/assistant/v1/chat/completions";

// Fallback: Lovable AI Gateway (auto-configured)
const LOVABLE_AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_AI_MODEL = "google/gemini-3-flash-preview";

const AGENT_ASSISTANT_ENV_VARS: Record<string, string> = {
  architect: "AGENT_ARCHITECT_ID",
  backend: "AGENT_BACKEND_ID",
  frontend: "AGENT_FRONTEND_ID",
  integrator: "AGENT_INTEGRATOR_ID",
  qa: "AGENT_QA_ID",
  devops: "AGENT_DEVOPS_ID",
};

// ============= ELITE DARK DESIGN SYSTEM =============
// Premium SaaS aesthetic: Vercel / Linear / Framer level quality
// NO neon, NO orange gradients, NO crypto-bro vibes

const ELITE_DESIGN_SYSTEM = `
## 🎨 ELITE DARK DESIGN STANDARDS — NON-NEGOTIABLE

You are a **senior product designer from Vercel, Linear, or Framer**.
Your output must feel: **Calm. Confident. Minimal. High-end.**

If it wouldn't fit on Vercel's homepage, don't ship it.

### 🚫 ABSOLUTELY FORBIDDEN (Instant Rejection):
- **NO neon colors** (no bright purple, pink, cyan glow)
- **NO orange/purple gradients** (looks cheap, crypto-bro vibes)
- **NO flashy gradient buttons** (tacky template-marketplace noise)
- **NO rainbow or multi-color gradients**
- **NO glowing orbs** in purple/pink/orange
- **NO dark mode with neon accents**
- Generic "Tailwind starter template" layouts
- Low-contrast, hard-to-read text
- Placeholder or AI-generated looking images
- Demo-looking content that feels fake
- Playful or gimmicky typography

### ✅ MANDATORY DARK THEME (Default for ALL Projects):

\`\`\`
BACKGROUNDS:
- Primary: #0a0a0a (pure near-black) or #0c0c0c
- Surface: #111111 to #141414 (subtle elevation)
- Cards: #161616 with subtle white/5 border

BORDERS:
- white/8 to white/12 (extremely subtle)
- Never bright or glowing

TEXT:
- Primary: #f5f5f5 (soft white, not harsh #fff)
- Secondary: #737373 (muted gray)
- Tertiary: #525252 (subtle labels)

ACCENTS (Choose ONE, use sparingly):
- Cool gray: #a3a3a3 → #e5e5e5 (safest, most premium)
- Subtle blue: #3b82f6 at 60% opacity (like Linear)
- Warm neutral: #d4d4d4 (clean, Vercel-style)

BUTTONS:
- Primary: White bg (#ffffff) with black text (#0a0a0a)
- Secondary: Transparent with white/10 border, white text
- Hover: Subtle opacity change, NO color shift
\`\`\`

### TYPOGRAPHY (Premium SaaS Fonts Only):

\`\`\`
FONT STACK:
font-family: 'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif;

SCALE:
- Hero Headline: text-5xl to text-7xl, font-semibold, tracking-tight
- Section Headers: text-3xl to text-4xl, font-medium
- Card Titles: text-xl, font-medium
- Body: text-base, font-normal, text-neutral-400
- Labels: text-sm, font-medium, uppercase, tracking-wide, text-neutral-500

RULES:
- Tracking-tight on ALL headlines (letters close together)
- Leading-tight on headlines, leading-relaxed on body
- Never use playful or decorative fonts
- No gradient text effects
\`\`\`

### SPACING & LAYOUT (Generous, Not Cramped):

\`\`\`
SECTIONS:
- Hero: py-24 md:py-32 lg:py-40 (massive breathing room)
- Content sections: py-20 md:py-24
- Card padding: p-6 to p-8

CONTAINERS:
- max-w-6xl mx-auto px-6 (tighter than 7xl for elegance)
- max-w-3xl for text-heavy content (optimal readability)

RHYTHM:
- Consistent 8px base: gap-2, gap-4, gap-8, gap-12, gap-16
- Large gaps between sections, tight gaps within cards
\`\`\`

### EFFECTS (Subtle, Never Flashy):

\`\`\`
SHADOWS:
- Cards: shadow-xl shadow-black/50 (deep, not colored)
- Elevated: shadow-2xl shadow-black/60
- NEVER use colored shadows (no shadow-purple-500/30)

HOVER STATES:
- Buttons: hover:opacity-90 transition-opacity
- Cards: hover:bg-white/5 hover:border-white/20 transition-all duration-300
- Links: hover:text-white transition-colors

GLASSMORPHISM (Use Sparingly):
- bg-white/5 backdrop-blur-xl border border-white/10
- NEVER use colored glass (no bg-purple-500/10)

ANIMATIONS:
- Subtle fade-in on scroll
- Smooth transitions (duration-300, ease-out)
- NO bouncy or playful animations
- NO pulsing neon glows
\`\`\`

### IMAGE REQUIREMENTS (Critical):

\`\`\`
SOURCES (Required):
- Unsplash: https://images.unsplash.com/photo-[ID]?w=1400&q=80
- Pexels: High-resolution professional shots
- Burst: E-commerce product photography

RULES:
- Images must look REAL and PRODUCTION-READY
- Match the niche (SaaS → office/tech, E-commerce → real products)
- White or neutral backgrounds for product shots
- NO AI-generated looking images
- NO generic stock photo vibes
- NO placeholder.com or via.placeholder
- If no perfect image exists, use subtle gradient mesh or solid dark bg

TREATMENT:
- rounded-xl or rounded-2xl
- shadow-2xl shadow-black/40
- Optional: subtle border border-white/10
\`\`\`

### COMPONENT PATTERNS:

\`\`\`
NAVIGATION:
- Sticky with backdrop-blur-xl bg-black/80
- Logo left, centered links, CTA right
- Border-b border-white/10
- Clean, minimal — no dropdowns unless necessary

HERO SECTIONS:
- Large headline left-aligned or centered
- Muted subheadline (text-neutral-400)
- Two CTAs: Primary (white bg) + Secondary (ghost)
- Trust badges or social proof below
- Optional: Product screenshot in dark frame

FEATURE SECTIONS:
- Bento grid layout (varying card sizes)
- Icon + Title + Description pattern
- Cards: bg-neutral-900 border border-white/10
- Subtle hover lift effect

TESTIMONIALS:
- Real Unsplash portrait photos
- Quoted text in text-neutral-300
- Name + Role in text-neutral-500
- Simple 3-column grid or carousel

PRICING:
- 3-tier layout, middle tier highlighted
- Highlighted: border-white/30 bg-white/5
- Clean checkmarks, muted X marks
- White primary CTA on featured tier

FOOTER:
- Dark bg-neutral-950
- 4-column layout on desktop
- Muted links in text-neutral-500
- Simple, clean, no clutter
\`\`\`

### FINAL QUALITY CHECK:

Before outputting ANY code, verify:
□ Zero neon or bright gradient colors anywhere
□ Background is pure black or near-black (#0a0a0a)
□ Text contrast is readable but not harsh
□ Buttons are white/black, not colorful
□ Images look real and professional
□ Typography is Inter or similar clean font
□ Hover states are subtle, not flashy
□ Overall vibe: "A serious founder would trust this"

If ANY of these fail → redo the design.
`;

// ============= QUALITY GATE PROMPT =============
// Enforces premium dark design standards — NO neon, NO orange, NO gradients

const DESIGN_QUALITY_GATE = `
## 🛡️ ELITE DESIGN QUALITY GATE

You are a RUTHLESS design critic from Vercel or Linear's design team.
Your job: Ensure ONLY premium, calm, dark designs reach users.

### 🚫 INSTANT REJECTION (Any of these = FAIL):

1. **Color Violations (Most Critical):**
   - ANY neon colors (bright purple, pink, cyan, lime)
   - ANY orange or purple gradients
   - Colored glow effects (shadow-purple-500, shadow-pink-500)
   - Rainbow or multi-color gradients
   - Buttons with bright colored backgrounds
   - This is NON-NEGOTIABLE. One neon element = rejection.

2. **Background Violations:**
   - Background is not near-black (#0a0a0a or similar)
   - Light theme when dark was expected
   - Colored tint on backgrounds (purple-tinted dark, etc.)

3. **Typography Violations:**
   - Playful or decorative fonts
   - Gradient text effects
   - All-caps headlines without tracking-wide
   - Low contrast (text not readable)

4. **Image Violations:**
   - Placeholder images or broken links
   - AI-generated looking imagery
   - Generic stock photo vibes
   - Images that don't match the niche

5. **Component Violations:**
   - Glowing buttons or cards
   - Neon hover effects
   - Pulsing animations with color
   - Tacky "template marketplace" patterns

### ✅ WHAT PASSES:

- Pure black/near-black backgrounds (#0a0a0a)
- White or neutral gray accents only
- White primary buttons, ghost secondary buttons
- Subtle hover states (opacity, not color)
- Real Unsplash/Pexels images
- Clean Inter/system font typography
- Calm, confident, minimal aesthetic

### REVIEW FORMAT:
\`\`\`
VERDICT: APPROVED | REJECTED

SCORE: X/10

IF REJECTED:
- Issue 1: [Specific violation]
- Issue 2: [Specific violation]
- Required fix: [Exact change needed]

IF APPROVED:
- Confirms: Dark theme, no neon, professional imagery
\`\`\`

Standard: "Would a Vercel or Linear PM approve this?"
If no → REJECT immediately.
`;

// ============= AGENT PROMPTS - OPTIMIZED FOR SPEED =============

// ============= FAST ARCHITECT PROMPT (OPTIMIZED FOR SPEED) =============
// The Architect prompt is intentionally MINIMAL to reduce AI latency
// Complex design guidelines moved to Frontend agent

const FAST_ARCHITECT_PROMPT = `You are a FAST project planner. Respond in under 10 seconds.

ANALYZE: Does the request need?
- Auth (login/OAuth) → ASK
- Database → ASK  
- APIs (payments/AI/email) → ASK
- None of above → SKIP TO PLAN

IF NEEDS BACKEND: Output this JSON immediately:
\`\`\`json
{"clarifying_questions":[
  {"id":"auth","question":"Authentication method?","options":["Email/Password","Google OAuth","None"],"type":"choice"},
  {"id":"database","question":"Data storage?","options":["User profiles","Products/content","None"],"type":"choice"},
  {"id":"payments","question":"Payments needed?","options":["Stripe","PayPal","None"],"type":"choice"}
]}
\`\`\`

IF STATIC SITE (no backend): Output plan directly:
\`\`\`json
{"projectName":"Name","projectType":"landing","description":"Brief","techStack":{"frontend":["HTML","Tailwind"],"backend":[],"database":"None"},"steps":[{"id":"1","agent":"frontend","task":"Build page","dependencies":[]}],"estimatedTime":"2 min"}
\`\`\`

Then: TOOL_CALL: handoff_to_frontend({"plan_json":{...}})

BE DECISIVE. NO EXPLANATIONS. JSON ONLY.`;

const AGENT_PROMPTS = {
  architect: FAST_ARCHITECT_PROMPT,

  frontend: `Elite frontend developer. Build premium designs FAST.

${ELITE_DESIGN_SYSTEM}

OUTPUT: Complete HTML with Tailwind CDN. All sections, hover states, mobile responsive.
No placeholders. Premium quality.

TOOL_CALL: handoff_to_qa({"project_artifacts": {"files": [...]}})`,

  backend: `Backend Agent. Generate production infrastructure.

Output JSON:
\`\`\`json
{"files":[{"filename":"migrations/001.sql","type":"migration","content":"SQL"},{"filename":"functions/api/index.ts","type":"edge_function","content":"TS"}],"secrets_required":[],"handoff":"TOOL_CALL: handoff_to_frontend"}
\`\`\`

PATTERNS: UUID PKs, timestamps, soft deletes, RLS policies.
Static sites: {"files":[],"secrets_required":[],"handoff":"TOOL_CALL: handoff_to_frontend"}`,

  integrator: `Integration. Connect frontend to backend. Handle errors, loading, types.
TOOL_CALL: handoff_to_qa({"project_artifacts": {...}})`,

  qa: `Quick design review. Score 1-10. Need 8+.
TOOL_CALL: handoff_to_devops({"qa_report": {...}})`,

  devops: `Verify complete. No broken links.
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
    executionLayer: "langdock-with-fallback",
    primaryApi: LANGDOCK_ASSISTANT_API_URL,
    fallbackApi: LOVABLE_AI_GATEWAY_URL,
    secrets: {
      LANGDOCK_API_KEY: Boolean(envObj.LANGDOCK_API_KEY && envObj.LANGDOCK_API_KEY.length > 0),
      LOVABLE_API_KEY: Boolean(envObj.LOVABLE_API_KEY && envObj.LOVABLE_API_KEY.length > 0),
    },
    assistants: assistantStatus,
  };
  return new Response(JSON.stringify(diag, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============= TYPES =============

type ProjectType = "landing" | "webapp" | "native";
type AgentPhase = "idle" | "planning" | "clarifying" | "awaiting_approval" | "building_backend" | "building_frontend" | "integrating" | "qa_testing" | "deploying" | "complete" | "error";
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
  type?: "migration" | "edge_function" | "docker" | "config" | "frontend";
}

interface BackendArtifacts {
  files: Array<{
    filename: string;
    type: "migration" | "edge_function" | "docker" | "config";
    content: string;
  }>;
  secrets_required?: string[];
  handoff?: string;
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

async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs = 30000 // 30s timeout - more time for complex agents
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { 
      ...options, 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err instanceof Error ? err : new Error(String(err));
  }
}

// ============= LOVABLE AI FALLBACK =============

async function callLovableAI(
  agentKey: string,
  message: string,
  additionalContext?: string
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY")?.trim();
  
  if (!apiKey) {
    throw new Error(`LOVABLE_API_KEY is not configured for fallback (build: ${BUILD_ID})`);
  }

  const agentPrompt = AGENT_PROMPTS[agentKey as keyof typeof AGENT_PROMPTS] || "";
  const fullMessage = `${agentPrompt}\n\n---\n\nUser Request:\n${message}${additionalContext ? `\n\nAdditional Context:\n${additionalContext}` : ""}`;

  console.log(`[Lovable AI] Fallback call for agent: ${agentKey}`);
  
  const response = await fetchWithTimeout(LOVABLE_AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: LOVABLE_AI_MODEL,
      messages: [
        { role: "user", content: fullMessage }
      ],
      max_tokens: 8000,
    }),
  }, 45000); // 45s for Lovable AI (more time for generation)

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Lovable AI] Error ${response.status}:`, errorText);
    
    if (response.status === 429) {
      throw new Error("AI rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add funds to your workspace.");
    }
    throw new Error(`Lovable AI call failed: ${response.status} - ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  console.log(`[Lovable AI] Response length: ${content.length}`);
  
  const toolCalls = detectToolCalls(content);
  console.log(`[Lovable AI] Tool calls detected: ${toolCalls.length}`);

  return { content, toolCalls };
}

// ============= PRIMARY LANGDOCK API CALL =============
// Agent-specific timeouts - INCREASED to allow complex e-commerce/SaaS builds

const AGENT_TIMEOUTS: Record<string, number> = {
  architect: 15000,  // 15s - allow time for proper planning
  backend: 45000,    // 45s - complex DB schemas and edge functions need time
  frontend: 60000,   // 60s - full e-commerce UI takes time
  integrator: 30000, // 30s - wiring frontend to backend
  qa: 15000,         // 15s - code review
  devops: 10000,     // 10s - deployment checks
};

// Maximum total execution time for the entire pipeline
const MAX_PIPELINE_TIMEOUT = 180000; // 3 minutes for complex projects

async function callLangdockAssistant(
  agentKey: string,
  message: string,
  additionalContext?: string,
  sendStatus?: (msg: string) => void
): Promise<{ content: string; toolCalls: ToolCall[]; provider: 'langdock' | 'lovable' }> {
  const apiKeyRaw = Deno.env.get("LANGDOCK_API_KEY");
  const apiKey = apiKeyRaw?.trim().replace(/^Bearer\s+/i, "");
  
  const notify = (msg: string) => {
    console.log(`[Agent:${agentKey}] ${msg}`);
    if (sendStatus) sendStatus(msg);
  };
  
  if (!apiKey) {
    notify("⚠️ No Langdock API key, using Lovable AI...");
    const result = await callLovableAI(agentKey, message, additionalContext);
    return { ...result, provider: 'lovable' };
  }

  const envVarName = AGENT_ASSISTANT_ENV_VARS[agentKey];
  if (!envVarName) {
    throw new Error(`No environment variable mapping for agent: ${agentKey}`);
  }

  const assistantId = Deno.env.get(envVarName)?.trim();
  if (!assistantId) {
    notify(`⚠️ No assistant ID for ${agentKey}, using Lovable AI fallback...`);
    const result = await callLovableAI(agentKey, message, additionalContext);
    return { ...result, provider: 'lovable' };
  }

  const agentPrompt = AGENT_PROMPTS[agentKey as keyof typeof AGENT_PROMPTS] || "";
  const fullMessage = `${agentPrompt}\n\n---\n\nUser Request:\n${message}${additionalContext ? `\n\nAdditional Context:\n${additionalContext}` : ""}`;

  const timeout = AGENT_TIMEOUTS[agentKey] || 30000;
  notify(`🚀 Calling Langdock (timeout: ${timeout/1000}s)...`);
  
  try {
    const response = await fetchWithTimeout(LANGDOCK_ASSISTANT_API_URL, {
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
    }, timeout);

    // Check for errors that should trigger fallback
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Langdock] Error ${response.status}:`, errorText);
      
      // These errors trigger fallback to Lovable AI
      const fallbackErrors = [500, 502, 503, 504, 520, 521, 522, 523, 524];
      if (fallbackErrors.includes(response.status)) {
        notify(`⚠️ Langdock server error ${response.status}, switching to Lovable AI...`);
        const result = await callLovableAI(agentKey, message, additionalContext);
        return { ...result, provider: 'lovable' };
      }
      
      // Non-fallback errors
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 401) {
        notify(`⚠️ Langdock auth error, trying Lovable AI...`);
        const result = await callLovableAI(agentKey, message, additionalContext);
        return { ...result, provider: 'lovable' };
      }
      if (response.status === 402) {
        throw new Error("Payment required. Please check your account.");
      }
      if (response.status === 404) {
        notify(`⚠️ Langdock assistant not found, trying Lovable AI...`);
        const result = await callLovableAI(agentKey, message, additionalContext);
        return { ...result, provider: 'lovable' };
      }
      throw new Error(`AI call failed: ${response.status} - ${errorText.slice(0, 200)}`);
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
    
    // If no content from Langdock, fallback
    if (!content || content.length < 10) {
      notify(`⚠️ Empty Langdock response, switching to Lovable AI...`);
      const result = await callLovableAI(agentKey, message, additionalContext);
      return { ...result, provider: 'lovable' };
    }
    
    notify(`✅ Langdock responded (${content.length} chars)`);
    
    const toolCalls = detectToolCalls(content);
    console.log(`[Langdock] Tool calls detected: ${toolCalls.length}`);

    return { content, toolCalls, provider: 'langdock' };
  } catch (error) {
    // Network errors, timeouts, etc. -> fallback
    console.error(`[Langdock] Error:`, error);
    notify(`⚠️ Langdock timeout/error, switching to Lovable AI...`);
    const result = await callLovableAI(agentKey, message, additionalContext);
    return { ...result, provider: 'lovable' };
  }
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

function extractBackendArtifacts(content: string): BackendArtifacts | null {
  // Try to find JSON with "files" array (new Backend agent format)
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      if (parsed.files && Array.isArray(parsed.files)) {
        console.log(`[Backend Extraction] Found ${parsed.files.length} backend files`);
        return parsed as BackendArtifacts;
      }
    } catch {
      // Fall through
    }
  }
  
  // Try raw JSON
  const rawJsonMatch = content.match(/\{[\s\S]*?"files"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/);
  if (rawJsonMatch) {
    try {
      const parsed = JSON.parse(rawJsonMatch[0]);
      if (parsed.files && Array.isArray(parsed.files)) {
        console.log(`[Backend Extraction] Found ${parsed.files.length} backend files (raw)`);
        return parsed as BackendArtifacts;
      }
    } catch {
      // Fall through
    }
  }
  
  return null;
}

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
    
    files.push({ filename, path: filename, content: code, language, type: "frontend" });
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
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      // Check if it's clarifying questions (not a plan)
      if (parsed.clarifying_questions) {
        return null; // This is not a plan, it's clarifying questions
      }
      // Validate it has required plan fields
      if (parsed.projectName && parsed.steps && Array.isArray(parsed.steps)) {
        return parsed;
      }
    } catch {
      // Fall through to other methods
    }
  }
  
  // Look for raw JSON with projectName
  const jsonMatch = content.match(/\{[\s\S]*?"projectName"[\s\S]*?\}/);
  if (!jsonMatch) return null;
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    // Validate it has required plan fields
    if (parsed.projectName && parsed.steps && Array.isArray(parsed.steps)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  options?: string[];
  type: 'text' | 'choice' | 'confirm';
}

function extractClarifyingQuestions(content: string): ClarifyingQuestion[] | null {
  // Look for JSON in code blocks
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      if (parsed.clarifying_questions && Array.isArray(parsed.clarifying_questions)) {
        return parsed.clarifying_questions;
      }
    } catch {
      // Fall through
    }
  }
  
  // Look for clarifying_questions key in raw JSON
  const match = content.match(/\{[\s\S]*?"clarifying_questions"[\s\S]*?\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0] + "}");
      if (parsed.clarifying_questions && Array.isArray(parsed.clarifying_questions)) {
        return parsed.clarifying_questions;
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  return null;
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
  private sendFn: (data: object) => void;
  private agentTasks: Record<string, AgentTask> = {};
  private originalRequest: string = "";
  private isClosed: boolean = false;

  constructor(send: (data: object) => void) {
    this.sendFn = send;
    this.state = {
      phase: "idle",
      currentAgent: null,
      plan: null,
      files: [],
      executionLog: [],
    };
  }

  // Safe send that prevents errors after stream closure
  private send(data: object): void {
    if (this.isClosed) {
      console.log(`[Orchestration] Ignoring send after close:`, (data as { type?: string }).type || 'unknown');
      return;
    }
    try {
      this.sendFn(data);
    } catch (err) {
      console.error(`[Orchestration] Send error, marking closed:`, err);
      this.isClosed = true;
    }
  }

  // Call this to mark engine as done (prevents further sends)
  public close(): void {
    this.isClosed = true;
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
      clarifying: 12,
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
    // Safety check - ensure plan and steps exist
    if (!plan || !plan.steps || !Array.isArray(plan.steps)) {
      console.error("[Orchestration] Invalid plan passed to initAgentsFromPlan:", plan);
      // Initialize with just frontend as fallback
      this.agentTasks["architect"] = {
        agentId: "architect",
        agentName: AGENTS.architect.name,
        role: AGENTS.architect.role,
        status: "complete",
      };
      this.agentTasks["frontend"] = {
        agentId: "frontend",
        agentName: AGENTS.frontend.name,
        role: AGENTS.frontend.role,
        status: "idle",
      };
      return;
    }
    
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
    
    const agentName = AGENTS[agentKey as keyof typeof AGENTS]?.name || agentKey;
    
    // Verbose phase-specific messages
    const phaseMessages: Record<AgentPhase, string> = {
      idle: "Preparing...",
      planning: "Designing architecture...",
      clarifying: "Gathering requirements...",
      awaiting_approval: "Waiting for approval...",
      building_backend: `🔧 ${agentName} is creating database schema, API endpoints, and security policies...`,
      building_frontend: `🎨 ${agentName} is crafting the UI with premium design patterns...`,
      integrating: `🔗 ${agentName} is connecting frontend to backend services...`,
      qa_testing: `🧪 ${agentName} is reviewing code quality and design standards...`,
      deploying: `🚀 ${agentName} is finalizing deployment configuration...`,
      complete: "Build complete!",
      error: "Error occurred.",
    };
    
    const statusMessage = phaseMessages[phase] || `${agentName} working...`;
    this.log(agentKey, statusMessage);

    if (this.agentTasks[agentKey]) {
      this.agentTasks[agentKey].status = "thinking";
      this.agentTasks[agentKey].statusLabel = statusMessage;
    }

    // Send both agent_status AND agent_message for visibility
    this.send({
      type: "agent_status",
      agent: agentKey,
      status: "thinking",
      statusLabel: statusMessage,
      progress: this.getProgress(),
    });
    
    // Send a chat message so user sees what's happening
    this.send({
      type: "agent_message",
      agent: agentName,
      message: statusMessage,
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
      
      if (agentKey === "backend") {
        // Build comprehensive backend request
        const plan = this.state.plan;
        message = `Generate full-stack backend infrastructure for this project:

PROJECT: ${plan?.projectName || 'Web Project'}
TYPE: ${plan?.projectType || 'webapp'}
DESCRIPTION: ${plan?.description || originalRequest || 'A modern web application'}
TECH STACK: ${JSON.stringify(plan?.techStack || {})}

REQUIREMENTS:
- Database tables with RLS policies
- Edge Functions for API endpoints
- Authentication support if needed
- Proper security patterns

Original User Request: ${originalRequest || this.originalRequest}

OUTPUT REQUIRED: JSON with "files" array containing migrations and edge functions.`;
      } else if (agentKey === "frontend") {
        // Build comprehensive frontend request
        const plan = this.state.plan;
        const backendFiles = this.state.files.filter(f => f.type === "migration" || f.type === "edge_function");
        const backendContext = backendFiles.length > 0 
          ? `\n\nBACKEND INFRASTRUCTURE AVAILABLE:\n${backendFiles.map(f => `- ${f.filename} (${f.type})`).join('\n')}`
          : '';
        
        message = `Create a stunning, production-ready ${plan?.projectType || 'landing'} page.

PROJECT: ${plan?.projectName || 'Web Project'}
DESCRIPTION: ${plan?.description || originalRequest || 'A beautiful modern website'}
DESIGN DIRECTION: ${plan?.designDirection || 'Dark mode premium with purple/pink gradients and glassmorphism'}
KEY FEATURES: ${plan?.keyFeatures?.join(', ') || 'Hero section, Features, CTA, Footer'}
${backendContext}

Original User Request: ${originalRequest || this.originalRequest}

CRITICAL: Output complete HTML code in a \`\`\`html code block. Make it STUNNING!`;
      } else if (agentKey === "qa") {
        const generatedCode = this.state.files.map(f => `--- ${f.path} (${f.type || 'unknown'}) ---\n${f.content}`).join('\n\n');
        message = `Review this generated code:\n\n${generatedCode || 'No code yet.'}\n\nProvide brief verdict.`;
      } else if (agentKey === "devops") {
        const migrations = this.state.files.filter(f => f.type === "migration").length;
        const edgeFns = this.state.files.filter(f => f.type === "edge_function").length;
        const frontend = this.state.files.filter(f => f.type === "frontend" || f.language === "html").length;
        message = `Confirm deployment readiness for: ${this.state.plan?.projectName}.
Files: ${this.state.files.length} total (${migrations} migrations, ${edgeFns} edge functions, ${frontend} frontend)`;
      } else {
        message = this.state.plan 
          ? `Build: ${JSON.stringify(this.state.plan, null, 2)}`
          : `Process: ${JSON.stringify(context, null, 2)}`;
      }

      const { content, toolCalls } = await callLangdockAssistant(agentKey, message);

      // Handle backend agent's structured JSON output
      if (agentKey === "backend") {
        const backendArtifacts = extractBackendArtifacts(content);
        
        if (backendArtifacts && backendArtifacts.files.length > 0) {
          console.log(`[Orchestration] Backend generated ${backendArtifacts.files.length} infrastructure files`);
          
          // Emit secrets_required event if any
          if (backendArtifacts.secrets_required && backendArtifacts.secrets_required.length > 0) {
            this.send({
              type: "secrets_required",
              secrets: backendArtifacts.secrets_required,
            });
          }
          
          // Convert to GeneratedFile format and emit events
          for (const file of backendArtifacts.files) {
            const language = file.type === "migration" ? "sql" : "typescript";
            const generatedFile: GeneratedFile = {
              filename: file.filename,
              path: file.filename,
              content: file.content,
              language,
              type: file.type,
            };
            
            this.state.files.push(generatedFile);
            
            // Emit specific events for different file types
            if (file.type === "migration") {
              this.send({ 
                type: "migration_generated", 
                agent: agentKey, 
                file: generatedFile,
                filename: file.filename,
              });
            } else if (file.type === "edge_function") {
              this.send({ 
                type: "edge_function_generated", 
                agent: agentKey, 
                file: generatedFile,
                filename: file.filename,
              });
            } else {
              this.send({ type: "file_generated", agent: agentKey, file: generatedFile });
            }
          }
          
          // Update agent status
          if (this.agentTasks[agentKey]) {
            this.agentTasks[agentKey].status = "complete";
            this.agentTasks[agentKey].statusLabel = `Generated ${backendArtifacts.files.length} files`;
          }
          
          this.send({
            type: "agent_status",
            agent: agentKey,
            status: "complete",
            statusLabel: `${backendArtifacts.files.length} backend files ready`,
            progress: this.getProgress(),
          });
          
          // Check for handoff in artifacts or tool calls
          if (backendArtifacts.handoff || toolCalls.length > 0) {
            const calls = toolCalls.length > 0 ? toolCalls : detectToolCalls(backendArtifacts.handoff || "");
            for (const tc of calls) {
              await this.handleToolCall(tc.name, { ...tc.parameters, backend_artifacts: backendArtifacts });
            }
          } else {
            await this.autoHandoff(agentKey, { backend_artifacts: backendArtifacts });
          }
          
          return; // Exit early, we've handled backend
        } else {
          console.log(`[Orchestration] Backend returned no structured files, falling back to code blocks`);
          
          // Try extracting SQL/TypeScript code blocks as fallback
          const codeFiles = extractCodeBlocks(content);
          const backendCodeFiles = codeFiles.filter(f => 
            f.language === "sql" || f.language === "typescript" || f.language === "ts"
          );
          
          if (backendCodeFiles.length > 0) {
            console.log(`[Orchestration] Backend fallback: found ${backendCodeFiles.length} code blocks`);
            for (const file of backendCodeFiles) {
              file.type = file.language === "sql" ? "migration" : "edge_function";
              this.state.files.push(file);
              this.send({ type: "file_generated", agent: agentKey, file });
            }
            
            if (this.agentTasks[agentKey]) {
              this.agentTasks[agentKey].status = "complete";
              this.agentTasks[agentKey].statusLabel = `${backendCodeFiles.length} files extracted`;
            }
            
            await this.autoHandoff(agentKey, {});
            return;
          }
          
          // If no backend infrastructure needed (e.g., static landing page), skip to frontend
          console.log(`[Orchestration] Backend agent produced no code - likely not needed for this project type`);
          if (this.agentTasks[agentKey]) {
            this.agentTasks[agentKey].status = "complete";
            this.agentTasks[agentKey].statusLabel = "No backend needed";
          }
          this.send({
            type: "agent_status",
            agent: agentKey,
            status: "complete",
            statusLabel: "No backend needed for this project",
            progress: this.getProgress(),
          });
          
          // Skip directly to frontend
          await this.handleToolCall("handoff_to_frontend", {});
          return;
        }
      }

      // Extract code (for frontend/other agents)
      const expectsCode = ["frontend", "integrator"].includes(agentKey);
      let files = extractCodeBlocks(content);

      // Fallback for frontend - NEVER allow blank preview
      if (agentKey === "frontend" && files.length === 0) {
        console.log(`[Orchestration] Frontend returned no code, using stunning fallback...`);
        
        // Notify user we're using fallback
        this.send({
          type: "agent_message",
          agent: "Frontend",
          message: "⚠️ The AI didn't generate code in expected format. Using a premium fallback template. You can refine it with specific requests.",
        });
        
        const fallbackHtml = generateFallbackHtml(
          this.state.plan?.projectName || "Generated Project",
          this.state.plan?.description || this.originalRequest || "A beautiful landing page"
        );
        files = [{ filename: "index.html", path: "index.html", content: fallbackHtml, language: "html", type: "frontend" }];
      }

      // Double-check: If we still have no files for frontend, generate error HTML
      if (agentKey === "frontend" && files.length === 0) {
        const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generation Error</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 flex items-center justify-center">
  <div class="text-center p-8">
    <div class="text-6xl mb-6">⚠️</div>
    <h1 class="text-3xl font-bold text-white mb-4">Generation Issue</h1>
    <p class="text-slate-400 mb-6 max-w-md">The AI couldn't generate your design this time. Try being more specific or use the Refine panel to describe what you want.</p>
    <button onclick="location.reload()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Try Again</button>
  </div>
</body>
</html>`;
        files = [{ filename: "index.html", path: "index.html", content: errorHtml, language: "html", type: "frontend" }];
      }

      if (expectsCode && files.length === 0) {
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
    console.log(`[Orchestration] autoHandoff from ${agentKey}, nextHandoff: ${agent?.nextHandoff || 'none'}`);
    
    if (!agent?.nextHandoff) {
      console.log(`[Orchestration] No next handoff, completing project`);
      await this.completeProject(context);
      return;
    }
    
    console.log(`[Orchestration] Triggering ${agent.nextHandoff}...`);
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

      // First check for clarifying questions
      const questions = extractClarifyingQuestions(content);
      if (questions && questions.length > 0) {
        this.state.phase = "clarifying";
        this.agentTasks["architect"].status = "complete";
        this.agentTasks["architect"].statusLabel = "Gathering requirements...";
        
        this.send({
          type: "agent_status",
          agent: "architect",
          status: "complete",
          statusLabel: "Gathering requirements...",
        });
        
        this.send({ type: "clarifying_questions", questions });
        return; // Wait for user to answer questions
      }

      // Extract and validate plan
      const plan = extractPlan(content);
      if (plan && plan.steps && Array.isArray(plan.steps)) {
        this.state.plan = plan;
        this.initAgentsFromPlan(plan);
        this.send({ type: "plan_created", plan });
        
        this.agentTasks["architect"].status = "complete";
        this.agentTasks["architect"].statusLabel = "Plan ready";

        this.send({
          type: "agent_status",
          agent: "architect",
          status: "complete",
          statusLabel: "Plan ready",
        });
      } else {
        // No valid plan or questions - generate a default plan
        const defaultPlan: ProjectPlan = {
          projectName: "Generated Project",
          projectType: "landing",
          description: message,
          techStack: { frontend: ["HTML", "Tailwind CSS"], backend: [], database: "None" },
          steps: [{ id: "1", agent: "frontend", task: "Build the project", dependencies: [] }],
          estimatedTime: "2-3 minutes"
        };
        
        this.state.plan = defaultPlan;
        this.initAgentsFromPlan(defaultPlan);
        this.send({ type: "plan_created", plan: defaultPlan });
        
        this.agentTasks["architect"].status = "complete";
        this.agentTasks["architect"].statusLabel = "Plan ready";

        this.send({
          type: "agent_status",
          agent: "architect",
          status: "complete",
          statusLabel: "Plan ready",
        });
      }

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

    // Wrap execution in a global timeout to prevent infinite stalls
    const executionPromise = (async () => {
      const hasBackend = plan.steps.some(s => s.agent === "backend");
      
      if (hasBackend) {
        await this.handleToolCall("handoff_to_backend", { plan_json: plan, message });
      } else {
        await this.handleToolCall("handoff_to_frontend", { plan_json: plan, message });
      }
    })();

    // Race against global timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Pipeline execution timed out after 90 seconds")), MAX_PIPELINE_TIMEOUT);
    });

    try {
      await Promise.race([executionPromise, timeoutPromise]);
    } catch (err) {
      console.error("[Orchestration] Execution timeout or error:", err);
      this.send({
        type: "error",
        message: err instanceof Error ? err.message : "Execution failed - please try again",
        build: BUILD_ID,
      });
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

    const refineMessage = `You are refining an existing landing page based on user feedback.

IMPORTANT: You MUST output the complete updated HTML code wrapped in a \`\`\`html code block.

CURRENT CODE:
\`\`\`html
${currentCode}
\`\`\`

USER FEEDBACK:
"${feedback}"

ORIGINAL PROJECT:
${plan.projectName} - ${plan.description}

Instructions:
1. Read the current code carefully
2. Apply the user's feedback to improve the design
3. Output the COMPLETE updated HTML in a \`\`\`html code block
4. Preserve all existing sections unless specifically asked to change them
5. Enhance based on feedback while maintaining the design system

Output ONLY the complete HTML code wrapped in \`\`\`html ... \`\`\` - no explanations needed.`;

    try {
      const { content } = await callLangdockAssistant("frontend", refineMessage);
      
      console.log("[Refine] AI response length:", content.length);
      
      let files = extractCodeBlocks(content);
      
      // If no code blocks found, try to extract raw HTML
      if (files.length === 0) {
        console.log("[Refine] No code blocks found, trying raw HTML extraction...");
        
        // Try to find HTML content even without code fences
        const htmlMatch = content.match(/<!DOCTYPE html[\s\S]*<\/html>/i);
        if (htmlMatch) {
          console.log("[Refine] Found raw HTML content");
          files = [{
            filename: "index.html",
            path: "index.html",
            content: htmlMatch[0].trim(),
            language: "html"
          }];
        }
      }
      
      // If still no files, apply the feedback directly to original code as fallback
      if (files.length === 0) {
        console.log("[Refine] Using enhanced fallback - modifying original code");
        
        // Use the original code but let user know we couldn't apply AI changes
        this.send({
          type: "agent_message",
          agent: "Frontend",
          message: `I couldn't generate refined code for "${feedback}". Try being more specific, like:\n- "Make the headline text larger and add a gradient"\n- "Change the button color to blue"\n- "Add more spacing between sections"`,
        });
        
        // Still return the original so user doesn't lose their work
        files = [{
          filename: "index.html",
          path: "index.html",
          content: currentCode,
          language: "html"
        }];
        
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
          summary: `⚠️ **Could not apply refinement.** Try a more specific request. Your original design is preserved.`,
        });
        
        return;
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
      console.error("[Refine] Error:", err);
      
      // On error, preserve original code instead of failing completely
      const files = [{
        filename: "index.html",
        path: "index.html",
        content: currentCode,
        language: "html"
      }];
      
      this.state.files = files;
      
      for (const file of files) {
        this.send({ type: "file_generated", agent: "frontend", file });
      }
      
      this.send({ type: "preview_ready", html: currentCode });
      
      this.agentTasks["frontend"].status = "complete";
      
      this.send({
        type: "complete",
        agents: this.agentTasks,
        summary: `⚠️ **Refinement had an issue.** Your original design is preserved. Try a different request.`,
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

// ============= ASYNC JOB PROCESSING =============

interface PlanningJob {
  id: string;
  prompt: string;
  status: string;
  progress: number;
  plan?: ProjectPlan;
  clarifying_questions?: ClarifyingQuestion[];
  error?: string;
}

async function processPlanningJob(jobId: string, prompt: string): Promise<void> {
  console.log(`[Background] Processing job ${jobId}`);
  
  try {
    // Update job status to processing
    await supabaseAdmin
      .from("planning_jobs")
      .update({ status: "processing", progress: 10 })
      .eq("id", jobId);

    // Call the architect agent
    const { content } = await callLangdockAssistant("architect", prompt);
    
    // Update progress
    await supabaseAdmin
      .from("planning_jobs")
      .update({ progress: 70 })
      .eq("id", jobId);

    // Check for clarifying questions first
    const questions = extractClarifyingQuestions(content);
    if (questions && questions.length > 0) {
      console.log(`[Background] Job ${jobId} needs clarification - ${questions.length} questions`);
      await supabaseAdmin
        .from("planning_jobs")
        .update({ 
          status: "clarifying", 
          progress: 100,
          clarifying_questions: questions,
        })
        .eq("id", jobId);
      return;
    }

    // Try to extract plan
    const plan = extractPlan(content);
    if (plan && plan.steps && Array.isArray(plan.steps)) {
      console.log(`[Background] Job ${jobId} complete with plan: ${plan.projectName}`);
      await supabaseAdmin
        .from("planning_jobs")
        .update({ 
          status: "awaiting_approval", 
          progress: 100,
          plan: plan,
        })
        .eq("id", jobId);
      return;
    }

    // Fallback: create default plan
    const defaultPlan: ProjectPlan = {
      projectName: "Generated Project",
      projectType: "landing",
      description: prompt,
      techStack: { frontend: ["HTML", "Tailwind CSS"], backend: [], database: "None" },
      steps: [{ id: "1", agent: "frontend", task: "Build the project", dependencies: [] }],
      estimatedTime: "2-3 minutes"
    };
    
    console.log(`[Background] Job ${jobId} using default plan`);
    await supabaseAdmin
      .from("planning_jobs")
      .update({ 
        status: "awaiting_approval", 
        progress: 100,
        plan: defaultPlan,
      })
      .eq("id", jobId);

  } catch (error) {
    console.error(`[Background] Job ${jobId} failed:`, error);
    await supabaseAdmin
      .from("planning_jobs")
      .update({ 
        status: "failed", 
        error: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", jobId);
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
    const { action, message, plan, currentCode, jobId } = await req.json();

    if (action === "diag") {
      return handleDiagnostic();
    }

    // ============= NEW: Async Job-Based Planning =============
    if (action === "plan_async") {
      // Create job record immediately (returns in <100ms)
      const { data: job, error: insertError } = await supabaseAdmin
        .from("planning_jobs")
        .insert({ 
          prompt: message, 
          status: "pending", 
          progress: 0 
        })
        .select()
        .single();

      if (insertError || !job) {
        console.error("[Orchestrator] Failed to create job:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create planning job" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Orchestrator] Created job ${job.id}, starting background processing...`);

      // Start background processing (non-blocking)
      // EdgeRuntime.waitUntil keeps function alive after response is sent
      // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(processPlanningJob(job.id, message));
      } else {
        // Fallback: process inline (but still return quickly)
        processPlanningJob(job.id, message).catch(console.error);
      }

      // Return immediately with job ID (<100ms response time!)
      return new Response(JSON.stringify({
        jobId: job.id,
        status: "pending",
        message: "Planning started. Poll /status endpoint or subscribe to realtime updates.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============= Job Status Check =============
    if (action === "job_status" && jobId) {
      const { data: job, error } = await supabaseAdmin
        .from("planning_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error || !job) {
        return new Response(
          JSON.stringify({ error: "Job not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify(job), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============= Original Streaming Implementation (kept for execute/refine) =============
    if (!message && action !== "question") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    let streamClosed = false;
    
    const body = new ReadableStream({
      async start(controller) {
        // Safe send function that checks if stream is closed
        const send = (data: object) => {
          if (streamClosed) {
            console.log(`[Stream] Ignoring send after close:`, (data as { type?: string }).type || 'unknown');
            return;
          }
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (err) {
            console.error(`[Stream] Enqueue error:`, err);
            streamClosed = true;
          }
        };

        const orchestrator = new OrchestrationEngine(send);
        
        // Pipeline timeout wrapper to prevent indefinite stalls
        const pipelineTimeout = new Promise<void>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Pipeline execution timed out after 60 seconds"));
          }, MAX_PIPELINE_TIMEOUT);
        });

        try {
          const executeAction = async () => {
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
          };

          // Race between execution and timeout
          await Promise.race([executeAction(), pipelineTimeout]);
          
        } catch (err) {
          console.error(`[Orchestration] Execution timeout or error:`, err);
          orchestrator.close(); // Mark engine as closed to prevent further sends
          send({ 
            type: "error", 
            message: err instanceof Error ? err.message : "Execution failed",
            build: BUILD_ID,
          });
        }

        // Mark orchestrator as done before closing stream
        orchestrator.close();
        
        // Safely close the stream
        if (!streamClosed) {
          send({ type: "[DONE]" });
          streamClosed = true;
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      },
      cancel() {
        console.log(`[Stream] Client cancelled connection`);
        streamClosed = true;
      }
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
