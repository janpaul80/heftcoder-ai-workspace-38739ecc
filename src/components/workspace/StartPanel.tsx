import { useState } from "react";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateGallery } from "./TemplateGallery";
import { ProjectHistoryPanel } from "./ProjectHistoryPanel";
import { useFeaturedTemplates, type Template } from "@/hooks/useTemplates";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ProjectHistoryItem } from "@/hooks/useProjectHistory";
import { cn } from "@/lib/utils";

interface StartPanelProps {
  onSelectTemplate: (template: Template) => void;
  onSelectProject: (project: ProjectHistoryItem) => void;
  onStartBlank: () => void;
  onSendPrompt?: (prompt: string) => void;
}

/* Premium, high-signal prompts */
const QUICK_START_PROMPTS = [
  "Design a dark-mode SaaS landing page with pricing, testimonials, and real startup imagery",
  "Build a modern analytics dashboard for a SaaS product with charts and user management",
  "Create a premium e-commerce storefront with real product photography and checkout flow",
  "Generate a high-end startup website with bold typography, strong visuals, and smooth animations",
];

/* Short but still premium for mobile */
const QUICK_START_PROMPTS_SHORT = ["SaaS landing page", "Analytics dashboard", "E-commerce store", "Startup website"];

export function StartPanel({ onSelectTemplate, onSelectProject, onStartBlank, onSendPrompt }: StartPanelProps) {
  const [activeTab, setActiveTab] = useState<"templates" | "history">("templates");
  const { data: featuredTemplates } = useFeaturedTemplates();
  const isMobile = useIsMobile();

  const prompts = isMobile ? QUICK_START_PROMPTS_SHORT : QUICK_START_PROMPTS;

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className={cn("border-b border-border", isMobile ? "p-4" : "p-6")}>
        <h2 className={cn("font-semibold text-foreground", isMobile ? "text-lg" : "text-xl")}>
          One prompt. We build it.
        </h2>
        <p className={cn("text-muted-foreground mt-1", isMobile ? "text-sm" : "text-sm")}>
          Describe what you want. We plan, design, and build it.
          <span className="block text-xs mt-1"></span>
        </p>
      </div>

      {/* Quick start */}
      <div className={cn("border-b border-border", isMobile ? "p-4" : "p-6")}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Quick start</span>
        </div>

        <div className={cn("grid gap-2", isMobile ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
          {prompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                if (onSendPrompt) {
                  onSendPrompt(QUICK_START_PROMPTS[index]);
                } else {
                  onStartBlank();
                }
              }}
              className={cn(
                "group flex items-center justify-between rounded-lg border border-border",
                "bg-secondary/30 hover:bg-secondary hover:border-primary/40",
                "transition-all text-left",
                isMobile ? "p-2.5" : "p-3",
              )}
            >
              <span
                className={cn(
                  "text-muted-foreground group-hover:text-foreground transition-colors",
                  isMobile ? "text-xs line-clamp-2" : "text-sm",
                )}
              >
                {prompt}
              </span>
              <ArrowRight
                className={cn(
                  "shrink-0 ml-2 text-muted-foreground/50 group-hover:text-primary transition-colors",
                  isMobile ? "h-3 w-3" : "h-4 w-4",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Templates / History */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "templates" | "history")} className="h-full flex flex-col">
          <TabsList className={cn("bg-secondary", isMobile ? "mx-4 mt-3" : "mx-6 mt-4")}>
            <TabsTrigger value="templates" className={cn("gap-1.5", isMobile && "text-xs")}>
              <Sparkles className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className={cn("gap-1.5", isMobile && "text-xs")}>
              <Clock className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
              Recent
            </TabsTrigger>
          </TabsList>

          <div className={cn("flex-1 overflow-y-auto", isMobile ? "p-4" : "p-6")}>
            <TabsContent value="templates" className="mt-0 h-full">
              <TemplateGallery onSelectTemplate={onSelectTemplate} />
            </TabsContent>

            <TabsContent value="history" className="mt-0 h-full">
              <ProjectHistoryPanel onSelectProject={onSelectProject} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Featured templates footer */}
      {activeTab === "history" && featuredTemplates?.length > 0 && (
        <div className={cn("border-t border-border bg-secondary/30", isMobile ? "p-3" : "p-4")}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Featured templates</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {featuredTemplates.slice(0, 3).map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={cn(
                  "shrink-0 rounded-lg border border-border bg-card",
                  "hover:border-primary/50 hover:bg-secondary transition-all text-left",
                  isMobile ? "px-3 py-1.5" : "px-4 py-2",
                )}
              >
                <span className={cn("font-medium text-foreground", isMobile ? "text-xs" : "text-sm")}>
                  {template.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
