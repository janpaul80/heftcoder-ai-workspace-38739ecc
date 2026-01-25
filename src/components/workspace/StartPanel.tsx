import { useState } from 'react';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateGallery } from './TemplateGallery';
import { ProjectHistoryPanel } from './ProjectHistoryPanel';
import { useFeaturedTemplates, type Template } from '@/hooks/useTemplates';
import type { ProjectHistoryItem } from '@/hooks/useProjectHistory';
import { cn } from '@/lib/utils';

interface StartPanelProps {
  onSelectTemplate: (template: Template) => void;
  onSelectProject: (project: ProjectHistoryItem) => void;
  onStartBlank: () => void;
}

const QUICK_START_PROMPTS = [
  "Create a modern portfolio website with dark theme",
  "Build a SaaS pricing page with 3 tiers",
  "Design an e-commerce product page with reviews",
  "Make a restaurant landing page with menu section",
];

export function StartPanel({ onSelectTemplate, onSelectProject, onStartBlank }: StartPanelProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const { data: featuredTemplates } = useFeaturedTemplates();

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          What would you like to build?
        </h2>
        <p className="text-muted-foreground">
          Start from a template, continue a project, or describe what you want to create.
        </p>
      </div>

      {/* Quick start suggestions */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Quick start</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUICK_START_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                // This would trigger the chat with this prompt
                onStartBlank();
              }}
              className="group flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary hover:border-primary/30 transition-all text-left"
            >
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {prompt}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Tabs for templates/history */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4 bg-secondary">
            <TabsTrigger value="templates" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              Recent Projects
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
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
        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Featured templates</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {featuredTemplates.slice(0, 3).map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-lg border border-border bg-card",
                  "hover:border-primary/50 hover:bg-secondary transition-all text-left"
                )}
              >
                <span className="text-sm font-medium text-foreground">{template.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
