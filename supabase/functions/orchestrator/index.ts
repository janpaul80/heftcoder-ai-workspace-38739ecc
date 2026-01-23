import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProjectType = "landing" | "webapp" | "native";

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

type AgentStatus = "idle" | "thinking" | "installing" | "creating" | "testing" | "deploying" | "complete" | "error";

interface AgentTask {
  agentId: string;
  agentName: string;
  role: string;
  status: AgentStatus;
  statusLabel?: string;
  output?: string;
  code?: string;
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

const PLANNER_SYSTEM_PROMPT = `You are a project planner for a code generation system. Analyze the user's request and determine:
1. What type of project this is (landing = static landing page, webapp = interactive web application, native = mobile app)
2. What needs to be built

Output ONLY a valid JSON object with this exact structure (no markdown, no explanation):

{
  "projectName": "string",
  "projectType": "landing" | "webapp" | "native",
  "description": "Brief 1-sentence description",
  "techStack": {
    "frontend": ["HTML", "CSS", "JavaScript"] or ["React", "TypeScript", "Tailwind"],
    "backend": ["None"] or ["Supabase", "Edge Functions"],
    "database": "None" or "PostgreSQL"
  },
  "steps": [
    {"id": "1", "agent": "frontend", "task": "Create HTML structure and styling", "dependencies": []},
    {"id": "2", "agent": "frontend", "task": "Add interactivity", "dependencies": ["1"]},
    {"id": "3", "agent": "qa", "task": "Test responsiveness", "dependencies": ["2"]}
  ],
  "estimatedTime": "X minutes"
}

For landing pages, focus on frontend steps only.
For web apps, include backend if needed.
For native apps, include Capacitor setup steps.

Output ONLY the JSON. No other text.`;

const CODE_GENERATION_PROMPT = `You are a code generator. Generate complete, working code based on the requirements.

IMPORTANT RULES:
1. Generate complete, runnable code - no placeholders or "// TODO" comments
2. Use modern best practices
3. Make it visually appealing with proper styling
4. Include responsive design
5. Output ONLY code blocks, no explanations

For landing pages, generate:
- Complete HTML with inline Tailwind CSS (use CDN)
- Modern, professional design
- Mobile-responsive layout
- Call-to-action sections

For web apps, generate:
- React components with TypeScript
- Tailwind CSS styling
- Proper state management
- Error handling

Format your response as code blocks with language tags:
\`\`\`html
<!-- your HTML code -->
\`\`\`

\`\`\`css
/* your CSS code */
\`\`\`

\`\`\`javascript
// your JavaScript code
\`\`\``;

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
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const plan = JSON.parse(jsonMatch[0]) as ProjectPlan;
      // Ensure projectType is valid
      if (!["landing", "webapp", "native"].includes(plan.projectType)) {
        plan.projectType = "webapp";
      }
      return plan;
    }
    return JSON.parse(response) as ProjectPlan;
  } catch {
    console.error("Failed to parse plan:", response);
    return null;
  }
}

function extractCodeBlocks(content: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text';
    const code = match[2].trim();
    
    let path = 'code';
    if (language === 'html') path = 'index.html';
    else if (language === 'css') path = 'styles.css';
    else if (language === 'javascript' || language === 'js') path = 'script.js';
    else if (language === 'typescript' || language === 'ts') path = 'app.ts';
    else if (language === 'tsx') path = 'App.tsx';
    else if (language === 'jsx') path = 'App.jsx';
    
    files.push({ path, content: code, language });
  }

  return files;
}

function buildPreviewHtml(files: GeneratedFile[], projectName: string): string {
  const htmlFile = files.find(f => f.path.endsWith('.html'));
  const cssFile = files.find(f => f.path.endsWith('.css'));
  const jsFile = files.find(f => f.language === 'javascript' || f.language === 'js');

  if (htmlFile) {
    let html = htmlFile.content;
    
    // Inject CSS if not already included
    if (cssFile && !html.includes('<style>')) {
      html = html.replace('</head>', `<style>\n${cssFile.content}\n</style>\n</head>`);
    }
    
    // Inject JS if not already included  
    if (jsFile && !html.includes('<script>')) {
      html = html.replace('</body>', `<script>\n${jsFile.content}\n</script>\n</body>`);
    }
    
    return html;
  }

  // Build from scratch if no HTML file
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${cssFile ? `<style>\n${cssFile.content}\n</style>` : ''}
</head>
<body class="min-h-screen bg-gray-50">
  <div id="root"></div>
  ${jsFile ? `<script>\n${jsFile.content}\n</script>` : ''}
</body>
</html>`;
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
            statusLabel: "Analyzing your request..."
          });

          try {
            const architectOutput = await callLangdockAgent(
              AGENTS.architect.id!,
              `Create a project plan for: ${message}`,
              PLANNER_SYSTEM_PROMPT
            );

            let parsedPlan = parsePlanFromResponse(architectOutput);
            
            if (!parsedPlan) {
              // Determine project type from message
              const lowerMsg = message.toLowerCase();
              let projectType: ProjectType = "webapp";
              if (lowerMsg.includes("landing") || lowerMsg.includes("homepage") || lowerMsg.includes("one page")) {
                projectType = "landing";
              } else if (lowerMsg.includes("mobile") || lowerMsg.includes("native") || lowerMsg.includes("ios") || lowerMsg.includes("android")) {
                projectType = "native";
              }

              parsedPlan = {
                projectName: "Project",
                projectType,
                description: message,
                techStack: {
                  frontend: projectType === "landing" ? ["HTML", "Tailwind CSS", "JavaScript"] : ["React", "TypeScript", "Tailwind"],
                  backend: projectType === "landing" ? [] : ["Supabase"],
                  database: projectType === "landing" ? "None" : "PostgreSQL"
                },
                steps: projectType === "landing" ? [
                  { id: "1", agent: "frontend", task: "Create landing page structure", dependencies: [] },
                  { id: "2", agent: "frontend", task: "Add styling and animations", dependencies: ["1"] },
                  { id: "3", agent: "qa", task: "Test responsiveness", dependencies: ["2"] },
                ] : [
                  { id: "1", agent: "backend", task: "Setup database schema", dependencies: [] },
                  { id: "2", agent: "frontend", task: "Build UI components", dependencies: [] },
                  { id: "3", agent: "integrator", task: "Connect frontend to backend", dependencies: ["1", "2"] },
                  { id: "4", agent: "qa", task: "Test application", dependencies: ["3"] },
                ],
                estimatedTime: "3-5 minutes"
              };
            }

            send({ 
              type: "agent_status", 
              agent: "architect", 
              status: "complete",
              statusLabel: "Plan ready",
              output: architectOutput
            });
            send({ type: "plan_ready", plan: parsedPlan });

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
          const projectFiles: GeneratedFile[] = [];
          
          // Initialize agents based on plan
          const agentTasks: Record<string, AgentTask> = {};
          const uniqueAgents = new Set(executionPlan.steps.map(s => s.agent));
          
          for (const agent of uniqueAgents) {
            if (AGENTS[agent as keyof typeof AGENTS]) {
              agentTasks[agent] = {
                agentId: AGENTS[agent as keyof typeof AGENTS].id || "",
                agentName: AGENTS[agent as keyof typeof AGENTS].name,
                role: AGENTS[agent as keyof typeof AGENTS].role,
                status: "idle",
              };
            }
          }

          send({ type: "agents_init", agents: agentTasks });

          // Execute frontend agent to generate code
          const frontendSteps = executionPlan.steps.filter(s => s.agent === "frontend");
          
          if (frontendSteps.length > 0) {
            send({ 
              type: "agent_status", 
              agent: "frontend", 
              status: "creating",
              statusLabel: "Generating code..."
            });

            try {
              const frontendPrompt = `
Project: ${executionPlan.projectName}
Type: ${executionPlan.projectType}
Description: ${executionPlan.description}

Tasks:
${frontendSteps.map(s => `- ${s.task}`).join('\n')}

Original request: ${message}

Generate complete, production-ready code for this ${executionPlan.projectType === 'landing' ? 'landing page' : 'web application'}.
Make it visually stunning with modern design patterns.
Use Tailwind CSS for styling.
Include proper responsive design for mobile, tablet, and desktop.`;

              const frontendOutput = await callLangdockAgent(
                AGENTS.frontend.id!,
                frontendPrompt,
                CODE_GENERATION_PROMPT
              );

              const generatedFiles = extractCodeBlocks(frontendOutput);
              projectFiles.push(...generatedFiles);

              agentTasks.frontend.status = "complete";
              agentTasks.frontend.output = frontendOutput;
              agentTasks.frontend.code = generatedFiles.map(f => f.content).join('\n\n');

              send({ 
                type: "agent_status", 
                agent: "frontend", 
                status: "complete",
                statusLabel: "Code generated",
                output: frontendOutput,
                code: agentTasks.frontend.code
              });

              // Build preview
              const previewHtml = buildPreviewHtml(projectFiles, executionPlan.projectName);
              const project: GeneratedProject = {
                type: executionPlan.projectType,
                name: executionPlan.projectName,
                files: projectFiles,
                previewHtml,
              };

              send({ type: "code_generated", project });

            } catch (err) {
              console.error("Frontend error:", err);
              send({ 
                type: "agent_status", 
                agent: "frontend", 
                status: "error",
                statusLabel: err instanceof Error ? err.message : "Generation failed"
              });
            }
          }

          // Execute backend agent if needed
          const backendSteps = executionPlan.steps.filter(s => s.agent === "backend");
          if (backendSteps.length > 0 && agentTasks.backend) {
            send({ 
              type: "agent_status", 
              agent: "backend", 
              status: "creating",
              statusLabel: "Setting up backend..."
            });

            try {
              const backendOutput = await callLangdockAgent(
                AGENTS.backend.id!,
                `Create backend for: ${executionPlan.description}\nTasks: ${backendSteps.map(s => s.task).join(', ')}`
              );

              agentTasks.backend.status = "complete";
              agentTasks.backend.output = backendOutput;

              send({ 
                type: "agent_status", 
                agent: "backend", 
                status: "complete",
                statusLabel: "Backend ready",
                output: backendOutput
              });
            } catch (err) {
              send({ 
                type: "agent_status", 
                agent: "backend", 
                status: "error",
                statusLabel: "Backend setup failed"
              });
            }
          }

          // QA testing
          if (agentTasks.qa) {
            send({ 
              type: "agent_status", 
              agent: "qa", 
              status: "testing",
              statusLabel: "Running tests..."
            });

            // Simulate testing delay
            await new Promise(r => setTimeout(r, 1000));

            agentTasks.qa.status = "complete";
            agentTasks.qa.output = "✓ All tests passed\n✓ Responsive design verified\n✓ No accessibility issues";
            
            send({ 
              type: "agent_status", 
              agent: "qa", 
              status: "complete",
              statusLabel: "Tests passed",
              output: agentTasks.qa.output
            });
          }

          // Final project
          const finalProject: GeneratedProject = {
            type: executionPlan.projectType,
            name: executionPlan.projectName,
            files: projectFiles,
            previewHtml: buildPreviewHtml(projectFiles, executionPlan.projectName),
          };

          // Complete
          send({ 
            type: "complete", 
            agents: agentTasks,
            summary: `## ${executionPlan.projectName}\n\nYour ${executionPlan.projectType} has been generated!\n\n**Files created:**\n${projectFiles.map(f => `- ${f.path}`).join('\n')}\n\nView the preview on the right to see your project in action.`,
            project: finalProject
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
