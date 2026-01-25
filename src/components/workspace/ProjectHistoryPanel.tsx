import { useState } from 'react';
import { 
  Clock, 
  Trash2, 
  ExternalLink,
  MoreVertical,
  Globe,
  Smartphone,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProjectHistory, useDeleteProject, type ProjectHistoryItem } from '@/hooks/useProjectHistory';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PROJECT_TYPE_ICONS: Record<string, typeof Globe> = {
  landing: Globe,
  webapp: Layout,
  native: Smartphone,
};

const PROJECT_TYPE_COLORS: Record<string, string> = {
  landing: 'from-blue-500/20 to-cyan-500/20',
  webapp: 'from-purple-500/20 to-violet-500/20',
  native: 'from-green-500/20 to-emerald-500/20',
};

interface ProjectHistoryPanelProps {
  onSelectProject: (project: ProjectHistoryItem) => void;
}

export function ProjectHistoryPanel({ onSelectProject }: ProjectHistoryPanelProps) {
  const { data: projects, isLoading } = useProjectHistory();
  const deleteProject = useDeleteProject();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteProject.mutateAsync(deleteId);
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-medium text-foreground mb-1">No projects yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your generated projects will appear here. Start by creating a new project or using a template.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {projects.map((project) => {
          const TypeIcon = PROJECT_TYPE_ICONS[project.project_type] || Globe;
          const gradientClass = PROJECT_TYPE_COLORS[project.project_type] || 'from-gray-500/20 to-slate-500/20';
          
          return (
            <div
              key={project.id}
              className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-all cursor-pointer"
              onClick={() => onSelectProject(project)}
            >
              {/* Thumbnail */}
              <div className={cn(
                "w-16 h-16 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br",
                gradientClass
              )}>
                <TypeIcon className="h-6 w-6 text-muted-foreground/50" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(project);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(project.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {project.original_prompt}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The project will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
