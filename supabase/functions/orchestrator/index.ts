// Edge Function: orchestrator
// Multi-agent orchestration using Langdock Assistant API
// Lovable Cloud handles orchestration/state/UX, Langdock handles agent execution

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const BUILD_ID = "orch-v6-fast-failover";

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

// ============= FRAMER/VERCEL-LEVEL DESIGN SYSTEM =============
// This is the core competitive advantage - outputs must rival top-tier templates

const ELITE_DESIGN_SYSTEM = `
## 🎨 FRAMER/VERCEL-LEVEL DESIGN STANDARDS

You are a **senior product designer + elite frontend engineer** from Framer, Vercel, or Linear.
Your output must make users say: "Wait... who built this? This is insanely good."

### ❌ STRICTLY FORBIDDEN (Instant Quality Failure):
- Generic layouts that look like "Tailwind starter templates"
- Boring, flat, lifeless hero sections
- Uniform spacing with no visual rhythm
- Low-contrast text that's hard to read
- Stock imagery vibes without intentional styling
- Demo-looking placeholder content
- Cookie-cutter feature grids with no personality
- Centered-everything-always layouts
- Missing micro-interactions and hover states

### ✅ MANDATORY DESIGN PATTERNS:

#### 1. HERO SECTIONS (Most Critical)
The hero makes or breaks first impressions. It MUST have:
- **Typography Hierarchy**: 
  - Headline: 56-80px (text-6xl to text-8xl), bold, tracking-tight
  - Subheadline: 20-24px (text-xl), lighter weight, muted color, max-w-2xl
  - Use gradient text for headlines: bg-gradient-to-r bg-clip-text text-transparent
- **Visual Anchor**: 
  - Animated gradient orbs/blobs in background (CSS keyframe animations)
  - Or: Large product screenshot with glassmorphism frame
  - Or: Abstract geometric patterns with brand colors
- **CTA Cluster**: 
  - Primary: Gradient button with hover:scale-105 hover:shadow-xl shadow-primary/30
  - Secondary: Ghost button with border, hover:bg-white/10
  - Social proof below CTAs (avatars, star ratings, or trust badges)
- **Asymmetric Layout**: Avoid perfect 50/50 splits. Use 60/40 or offset content.

#### 2. TYPOGRAPHY (Obsess Over This)
\`\`\`
SCALE:
- Display/Hero: 56-80px, font-bold, tracking-tighter, leading-none
- Section Headers: 36-48px, font-semibold, tracking-tight  
- Card Titles: 20-24px, font-semibold
- Body: 16-18px, font-normal, text-muted (60-70% contrast)
- Small/Labels: 12-14px, font-medium, uppercase tracking-wider

RHYTHM:
- Headlines get negative letter-spacing (tracking-tight/tighter)
- Body text gets normal/relaxed letter-spacing
- Use em-dashes (—) not hyphens for sophisticated copy
- Sentence case for headings, not Title Case
\`\`\`

#### 3. SPACING & LAYOUT (Visual Rhythm)
\`\`\`
SECTION PADDING:
- Hero: py-24 to py-32 (generous breathing room)
- Content sections: py-20 to py-24
- Inner card padding: p-8 to p-12

CONTAINER:
- max-w-7xl mx-auto px-6 (standard)
- Use max-w-4xl for text-heavy sections (better readability)
- Break the grid occasionally with full-bleed elements

SPACING RHYTHM:
- Use 8px base unit: gap-2, gap-4, gap-6, gap-8, gap-12, gap-16
- Large gaps between sections, tight gaps within components
\`\`\`

#### 4. COLOR PALETTES (Pick One, Commit Fully)

**DARK PREMIUM (Default for SaaS)**
\`\`\`
Background: slate-950 (#0a0a0f) or neutral-950
Surface: white/5 to white/10 (glassmorphism)
Border: white/10 to white/20
Text Primary: white
Text Secondary: slate-400
Accent Gradient: purple-500 → pink-500 → orange-500
Glow Effects: accent color at 20-40% opacity with blur-2xl/3xl
\`\`\`

**LIGHT MINIMAL (Clean, High-End)**
\`\`\`
Background: white or slate-50
Surface: slate-100 or white with border
Border: slate-200
Text Primary: slate-900
Text Secondary: slate-600
Accent: Single bold color (blue-600, violet-600, or emerald-600)
Shadows: slate-900/5 to slate-900/10, large blur radius
\`\`\`

**WARM GRADIENT (Creative/Startup)**
\`\`\`
Background: Gradient from rose-50 via orange-50 to amber-50
Surface: white with warm shadow
Border: rose-200/50
Text Primary: slate-900
Text Secondary: slate-600
Accent Gradient: rose-500 → orange-500 → amber-500
\`\`\`

#### 5. EFFECTS & MICRO-INTERACTIONS

**GLASSMORPHISM (Use Deliberately)**
\`\`\`css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
}
\`\`\`

**GRADIENT ORBS (Background Atmosphere)**
\`\`\`html
<div class="absolute top-20 left-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
<div class="absolute bottom-20 right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
\`\`\`

**HOVER STATES (Every Interactive Element)**
\`\`\`
Buttons: hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300
Cards: hover:-translate-y-2 hover:shadow-2xl hover:border-primary/50
Links: hover:text-primary transition-colors
Icons: group-hover:scale-110 transition-transform
\`\`\`

**ANIMATIONS (Subtle, Purposeful)**
\`\`\`css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-20px) rotate(2deg); }
}
@keyframes glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
\`\`\`

#### 6. COMPONENT PATTERNS

**FEATURE CARDS (Not Generic Grids)**
- Use varying card sizes (bento grid style)
- Add subtle gradient backgrounds per card
- Icon in colored rounded-2xl container
- Stagger animation on scroll
- Add "glow" effect on featured card

**TESTIMONIALS/SOCIAL PROOF**
- Real-looking avatar images from UI Faces or Unsplash portraits
- Star ratings with filled/unfilled states
- Company logos in grayscale, hover to color
- Metrics with animated counters

**PRICING TABLES**
- Highlighted "Popular" tier with gradient border/glow
- Monthly/Annual toggle with savings badge
- Checkmarks with brand color, X marks muted
- Sticky header with plan name on scroll

**NAVIGATION**
- Sticky with backdrop-blur on scroll
- Logo left, links center, CTA right
- Mobile: Hamburger with slide-in drawer
- Active state with underline or background pill

#### 7. IMAGE STRATEGY

**HERO IMAGES:**
- Use https://images.unsplash.com/photo-[ID]?w=1200&q=80
- Apply: rounded-2xl shadow-2xl shadow-black/20
- Wrap in glassmorphism frame for depth
- Add subtle rotation: rotate-2 or -rotate-1

**FALLBACK (No Good Images):**
- Gradient mesh backgrounds
- Abstract shapes with CSS
- Icon compositions
- 3D emoji at large scale (🚀, ✨, 💎)

#### 8. COPY GUIDELINES

**HEADLINES:**
- Lead with benefit, not feature
- Use power words: Instant, Effortless, Powerful, Beautiful
- Keep under 8 words
- Example: "Ship faster. Build better." not "A Tool For Building Apps"

**SUBHEADLINES:**
- Expand on the headline promise
- Address the pain point
- 15-25 words max
- Include credibility hint if possible

**CTAs:**
- Action-oriented: "Start free trial" not "Submit"
- Add urgency/benefit: "Get started free" "Try for 14 days"
- Secondary: "See how it works →" with arrow

### 📋 SELF-REVIEW CHECKLIST (Before Submitting)

□ Hero section would look great on ProductHunt
□ Typography has clear 3+ level hierarchy
□ Color palette is cohesive (picked ONE scheme)
□ Every interactive element has hover states
□ At least one animated/floating background element
□ Cards have rounded-2xl or rounded-3xl corners
□ Generous whitespace (not cramped)
□ Mobile layout is just as beautiful
□ Copy sounds premium, not generic
□ Overall impression: "Wow, this looks expensive"
`;

// ============= QUALITY GATE PROMPT =============
// This is injected into QA agent to enforce design standards

const DESIGN_QUALITY_GATE = `
## 🛡️ DESIGN QUALITY GATE

You are a RUTHLESS design critic from Framer or Vercel's design team.
Your job is to ensure ONLY premium-quality designs reach users.

### INSTANT REJECTION CRITERIA:
1. **Hero Section Failures:**
   - Headline smaller than text-5xl
   - No gradient, animation, or visual interest
   - Basic "centered text on solid color" layout
   - Missing social proof or trust signals

2. **Typography Failures:**
   - All text same size (no hierarchy)
   - Missing tracking-tight on headlines
   - Low contrast (less than 4.5:1)
   - Comic Sans, Papyrus, or system defaults

3. **Layout Failures:**
   - Everything perfectly centered (boring)
   - No breathing room (cramped spacing)
   - Cards are basic rectangles with no styling
   - No visual rhythm between sections

4. **Interaction Failures:**
   - Buttons without hover effects
   - Cards that don't respond to hover
   - No transitions on state changes

5. **Overall Vibe Failures:**
   - Looks like a "CSS tutorial example"
   - Could be confused with a WordPress theme
   - Doesn't match user's stated vision
   - You wouldn't put this in your portfolio

### REVIEW FORMAT:
\`\`\`
VERDICT: APPROVED | NEEDS_REVISION

SCORE: X/10

IF NEEDS_REVISION:
- Issue 1: [Specific problem with location]
- Issue 2: [Specific problem with location]
- Fix instructions: [Exact code changes needed]

IF APPROVED:
- Highlight 1: [What's excellent]
- Highlight 2: [What's excellent]
\`\`\`

Be harsh. Users are comparing us to $500 Framer templates.
`;

// ============= AGENT PROMPTS - OPTIMIZED FOR SPEED =============

const AGENT_PROMPTS = {
  architect: `You are a fast, decisive product architect. Generate a build plan in under 30 seconds.

OUTPUT ONLY THIS JSON (no explanation):
\`\`\`json
{
  "projectName": "Name",
  "projectType": "landing",
  "description": "Brief description",
  "designDirection": "Dark Premium | Light Minimal | Warm Gradient",
  "techStack": {"frontend": ["HTML", "Tailwind CSS"], "backend": ["None"], "database": "None"},
  "steps": [
    {"id": "1", "agent": "frontend", "task": "Build complete landing page", "dependencies": []}
  ],
  "estimatedTime": "1-2 minutes"
}
\`\`\`

TOOL_CALL: handoff_to_frontend({"plan_json": <plan>})`,

  frontend: `You are an elite frontend developer. Build FAST but beautiful.

${ELITE_DESIGN_SYSTEM}

OUTPUT: Complete HTML file with Tailwind CDN, all sections, hover states, animations.
No placeholders. Mobile responsive. Premium feel.

TOOL_CALL: handoff_to_qa({"project_artifacts": {"files": [...]}})`,

  backend: `You are the Backend Agent for HeftCoder's full-stack orchestrator.
Generate production-ready backend infrastructure based on the plan.

CRITICAL: You MUST respond with a JSON code block in this EXACT format:

\`\`\`json
{
  "files": [
    {"filename": "migrations/001_create_tables.sql", "type": "migration", "content": "-- SQL here"},
    {"filename": "functions/api/index.ts", "type": "edge_function", "content": "// TS here"}
  ],
  "secrets_required": [],
  "handoff": "TOOL_CALL: handoff_to_frontend"
}
\`\`\`

FILE TYPES: migration (SQL), edge_function (Deno TypeScript)

DATABASE PATTERNS (ALWAYS):
- UUID Primary Keys: id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- Timestamps: created_at/updated_at TIMESTAMPTZ DEFAULT now()
- Soft Deletes: deleted_at TIMESTAMPTZ DEFAULT NULL
- RLS: Enable on ALL tables with SELECT/INSERT/UPDATE/DELETE policies
- User: user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL

For static landing pages with no backend needs:
\`\`\`json
{"files": [], "secrets_required": [], "handoff": "TOOL_CALL: handoff_to_frontend"}
\`\`\`

ALWAYS include handoff in your JSON response.`,

  integrator: `Integration specialist. Connect frontend to backend.
Handle errors, loading states, type safety.
TOOL_CALL: handoff_to_qa({"project_artifacts": {...}})`,

  qa: `Design critic. Quick review.
Score 1-10 (need 8+). If pass, approve. If fail, list fixes.
TOOL_CALL: handoff_to_devops({"qa_report": {...}})`,

  devops: `DevOps. Verify files complete, no broken links.
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

async function callLangdockAssistant(
  agentKey: string,
  message: string,
  additionalContext?: string
): Promise<{ content: string; toolCalls: ToolCall[] }> {
  const apiKeyRaw = Deno.env.get("LANGDOCK_API_KEY");
  const apiKey = apiKeyRaw?.trim().replace(/^Bearer\s+/i, "");
  
  if (!apiKey) {
    console.log(`[Langdock] No API key, using Lovable AI fallback...`);
    return callLovableAI(agentKey, message, additionalContext);
  }

  const envVarName = AGENT_ASSISTANT_ENV_VARS[agentKey];
  if (!envVarName) {
    throw new Error(`No environment variable mapping for agent: ${agentKey}`);
  }

  const assistantId = Deno.env.get(envVarName)?.trim();
  if (!assistantId) {
    console.log(`[Langdock] No assistant ID for ${agentKey}, using Lovable AI fallback...`);
    return callLovableAI(agentKey, message, additionalContext);
  }

  const agentPrompt = AGENT_PROMPTS[agentKey as keyof typeof AGENT_PROMPTS] || "";
  const fullMessage = `${agentPrompt}\n\n---\n\nUser Request:\n${message}${additionalContext ? `\n\nAdditional Context:\n${additionalContext}` : ""}`;

  console.log(`[Langdock] Calling assistant for agent: ${agentKey}, assistantId: ${assistantId.slice(0, 8)}...`);
  
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
    }, 45000); // 45s timeout - backend/frontend agents need more time

    // Check for errors that should trigger fallback
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Langdock] Error ${response.status}:`, errorText);
      
      // These errors trigger fallback to Lovable AI
      const fallbackErrors = [500, 502, 503, 504, 520, 521, 522, 523, 524];
      if (fallbackErrors.includes(response.status)) {
        console.log(`[Langdock] Server error ${response.status}, switching to Lovable AI fallback...`);
        return callLovableAI(agentKey, message, additionalContext);
      }
      
      // Non-fallback errors
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 401) {
        console.log(`[Langdock] Auth error, trying Lovable AI fallback...`);
        return callLovableAI(agentKey, message, additionalContext);
      }
      if (response.status === 402) {
        throw new Error("Payment required. Please check your account.");
      }
      if (response.status === 404) {
        console.log(`[Langdock] Assistant not found, trying Lovable AI fallback...`);
        return callLovableAI(agentKey, message, additionalContext);
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
      console.log(`[Langdock] Empty response, switching to Lovable AI fallback...`);
      return callLovableAI(agentKey, message, additionalContext);
    }
    
    console.log(`[Langdock] Extracted content length: ${content.length}`);
    
    const toolCalls = detectToolCalls(content);
    console.log(`[Langdock] Tool calls detected: ${toolCalls.length}`);

    return { content, toolCalls };
  } catch (error) {
    // Network errors, timeouts, etc. -> fallback
    console.error(`[Langdock] Error:`, error);
    console.log(`[Langdock] Network/timeout error, switching to Lovable AI fallback...`);
    return callLovableAI(agentKey, message, additionalContext);
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

      // Fallback for frontend
      if (agentKey === "frontend" && files.length === 0) {
        console.log(`[Orchestration] Frontend returned no code, using stunning fallback...`);
        const fallbackHtml = generateFallbackHtml(
          this.state.plan?.projectName || "Generated Project",
          this.state.plan?.description || this.originalRequest || "A beautiful landing page"
        );
        files = [{ filename: "index.html", path: "index.html", content: fallbackHtml, language: "html", type: "frontend" }];
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
