import { useState } from 'react';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateGallery } from './TemplateGallery';
import { ProjectHistoryPanel } from './ProjectHistoryPanel';
import { useFeaturedTemplates, type Template } from '@/hooks/useTemplates';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ProjectHistoryItem } from '@/hooks/useProjectHistory';
import { cn } from '@/lib/utils';

interface StartPanelProps {
  onSelectTemplate: (template: Template) => void;
  onSelectProject: (project: ProjectHistoryItem) => void;
  onStartBlank: () => void;
  onSendPrompt?: (prompt: string) => void;
}

const QUICK_START_PROMPTS = [
  "Create a modern portfolio website with dark theme",
  "Build a SaaS pricing page with 3 tiers",
  "Design an e-commerce product page with reviews",
  "Make a restaurant landing page with menu section",
];

// Shorter prompts for mobile
const QUICK_START_PROMPTS_SHORT = [
  "Modern portfolio site",
  "SaaS pricing page",
  "E-commerce product page",
  "Restaurant landing page",
];

export function StartPanel({ onSelectTemplate, onSelectProject, onStartBlank, onSendPrompt }: StartPanelProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const { data: featuredTemplates } = useFeaturedTemplates();
  const isMobile = useIsMobile();

  const prompts = isMobile ? QUICK_START_PROMPTS_SHORT : QUICK_START_PROMPTS;
  const fullPrompts = QUICK_START_PROMPTS; // Always use full prompts for sending

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className={cn("border-b border-border", isMobile ? "p-4" : "p-6")}>
        <h2 className={cn("font-semibold text-foreground mb-1", isMobile ? "text-lg" : "text-xl")}>
          What would you like to build?
        </h2>
        <p className={cn("text-muted-foreground", isMobile && "text-sm")}>
          {isMobile 
            ? "Start from a template or describe your project."
            : "Start from a template, continue a project, or describe what you want to create."
          }
        </p>
      </div>

      {/* Quick start suggestions */}
      <div className={cn("border-b border-border", isMobile ? "p-4" : "p-6")}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Quick start</span>
        </div>
        <div className={cn(
          "grid gap-2",
          isMobile ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
        )}>
          {prompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                if (onSendPrompt) {
                  onSendPrompt(fullPrompts[index]);
                } else {
                  onStartBlank();
                }
              }}
              className={cn(
                "group flex items-center justify-between rounded-lg border border-border bg-secondary/30 hover:bg-secondary hover:border-primary/30 transition-all text-left",
                isMobile ? "p-2.5" : "p-3"
              )}
            >
              <span className={cn(
                "text-muted-foreground group-hover:text-foreground transition-colors",
                isMobile ? "text-xs line-clamp-2" : "text-sm"
              )}>
                {prompt}
              </span>
              <ArrowRight className={cn(
                "text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 ml-2",
                isMobile ? "h-3 w-3" : "h-4 w-4"
              )} />
            </button>
          ))}
        </div>
      </div>

      {/* Tabs for templates/history */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className={cn(
            "bg-secondary",
            isMobile ? "mx-4 mt-3" : "mx-6 mt-4"
          )}>
            <TabsTrigger value="templates" className={cn("gap-1.5", isMobile && "text-xs")}>
              <Sparkles className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className={cn("gap-1.5", isMobile && "text-xs")}>
              <Clock className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
              Recent
            </TabsTrigger>
          </TabsList>

          <div className={cn("flex-1 overflow-y-auto scrollbar-thin", isMobile ? "p-4" : "p-6")}>
            <TabsContent value="templates" className="mt-0 h-full">
              <TemplateGallery onSelectTemplate={onSelectTemplate} />
            </TabsContent>

            <TabsContent value="history" className="mt-0 h-full">
              <ProjectHistoryPanel onSelectProject={onSelectProject} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Featured templates footer (when on history tab) */}
      {activeTab === 'history' && featuredTemplates && featuredTemplates.length > 0 && (
        <div className={cn("border-t border-border bg-secondary/30", isMobile ? "p-3" : "p-4")}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Featured templates</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {featuredTemplates.slice(0, 3).map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={cn(
                  "shrink-0 rounded-lg border border-border bg-card",
                  "hover:border-primary/50 hover:bg-secondary transition-all text-left",
                  isMobile ? "px-3 py-1.5" : "px-4 py-2"
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
