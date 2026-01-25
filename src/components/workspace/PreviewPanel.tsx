import { useMemo, useState } from 'react';
import { Smartphone, Monitor, Tablet, ExternalLink, Code, Eye, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import hcIcon from '@/assets/hc-icon.png';
import type { ProjectStatus, GeneratedProject, ProjectType } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface PreviewPanelProps {
  status: ProjectStatus;
  project?: GeneratedProject | null;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'preview' | 'code';

const DEVICE_SIZES: Record<DeviceType, { width: string; height: string }> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: '768px', height: '1024px' },
  mobile: { width: '375px', height: '667px' },
};

function WorkingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150 animate-pulse-subtle" />
        <img
          src={hcIcon}
          alt="HeftCoder"
          className="relative w-24 h-24 rounded-2xl animate-pulse-glow status-glow"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-medium text-foreground">Building your project</span>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">Preview will appear when ready...</p>
    </div>
  );
}

function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="mb-6 opacity-60">
        <img
          src={hcIcon}
          alt="HeftCoder"
          className="w-20 h-20 rounded-2xl"
        />
      </div>
      <p className="text-lg text-muted-foreground text-center max-w-md">
        Your project preview will appear here once generation starts
      </p>
    </div>
  );
}

function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-destructive text-lg font-medium mb-2">
        Something went wrong
      </div>
      {message && (
        <p className="text-muted-foreground text-sm">{message}</p>
      )}
    </div>
  );
}

function ProjectTypeBadge({ type }: { type: ProjectType }) {
  const labels: Record<ProjectType, { label: string; color: string }> = {
    landing: { label: 'Landing Page', color: 'bg-emerald-500/20 text-emerald-400' },
    webapp: { label: 'Web App', color: 'bg-blue-500/20 text-blue-400' },
    native: { label: 'Native App', color: 'bg-purple-500/20 text-purple-400' },
  };
  
  const { label, color } = labels[type];
  
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", color)}>
      {label}
    </span>
  );
}

function LivePreview({ project, device }: { project: GeneratedProject; device: DeviceType }) {
  const previewHtml = useMemo(() => {
    if (project.previewHtml) {
      return project.previewHtml;
    }
    
    // Build HTML from generated files
    const htmlFile = project.files.find(f => f.path.endsWith('.html') || f.path === 'index.html');
    const cssFile = project.files.find(f => f.path.endsWith('.css'));
    const jsFile = project.files.find(f => f.path.endsWith('.js') || f.path.endsWith('.jsx'));
    
    if (htmlFile) {
      let html = htmlFile.content;
      
      // Inject CSS if separate
      if (cssFile && !html.includes(cssFile.content)) {
        html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
      }
      
      // Inject JS if separate
      if (jsFile && !html.includes(jsFile.content)) {
        html = html.replace('</body>', `<script>${jsFile.content}</script></body>`);
      }
      
      return html;
    }
    
    // Fallback: create basic HTML wrapper
    const css = cssFile?.content || '';
    const js = jsFile?.content || '';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script>${js}</script>
</body>
</html>`;
  }, [project]);

  const deviceSize = DEVICE_SIZES[device];

  return (
    <div className="h-full w-full flex items-center justify-center bg-[#1a1a1a] p-4">
      <div 
        className={cn(
          "bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300",
          device !== 'desktop' && "border-8 border-gray-800 rounded-3xl"
        )}
        style={{ 
          width: deviceSize.width, 
          height: deviceSize.height,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        <iframe
          srcDoc={previewHtml}
          title="Project Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}

function CodeView({ project }: { project: GeneratedProject }) {
  const [selectedFile, setSelectedFile] = useState(0);
  
  return (
    <div className="h-full flex">
      {/* File list */}
      <div className="w-48 bg-secondary/50 border-r border-border overflow-y-auto">
        <div className="p-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Files
        </div>
        {project.files.map((file, index) => (
          <button
            key={file.path}
            onClick={() => setSelectedFile(index)}
            className={cn(
              "w-full text-left px-3 py-2 text-sm truncate transition-colors",
              selectedFile === index 
                ? "bg-primary/20 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {file.path}
          </button>
        ))}
      </div>
      
      {/* Code content */}
      <div className="flex-1 overflow-auto bg-black/40 p-4">
        <pre className="text-sm font-mono text-foreground/90 whitespace-pre-wrap">
          <code>{project.files[selectedFile]?.content}</code>
        </pre>
      </div>
    </div>
  );
}

export function PreviewPanel({ status, project }: PreviewPanelProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasProject = project && project.files.length > 0;

  const handleDownload = () => {
    if (!project) return;
    
    // Create a simple HTML file for download
    const htmlContent = project.previewHtml || project.files.find(f => f.path.endsWith('.html'))?.content || '';
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn(
      "h-full bg-workspace-bg flex flex-col",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Toolbar */}
      {hasProject && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <ProjectTypeBadge type={project.type} />
            <span className="text-sm font-medium text-foreground">{project.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="preview" className="h-6 px-2 text-xs gap-1">
                  <Eye className="h-3 w-3" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="h-6 px-2 text-xs gap-1">
                  <Code className="h-3 w-3" />
                  Code
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Device selector (only in preview mode) */}
            {viewMode === 'preview' && (
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                <Button
                  variant={device === 'desktop' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setDevice('desktop')}
                  title="Desktop"
                >
                  <Monitor className="h-3 w-3" />
                </Button>
                <Button
                  variant={device === 'tablet' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setDevice('tablet')}
                  title="Tablet"
                >
                  <Tablet className="h-3 w-3" />
                </Button>
                <Button
                  variant={device === 'mobile' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setDevice('mobile')}
                  title="Mobile"
                >
                  <Smartphone className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Actions */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        {status.status === 'idle' && !hasProject && <IdleState />}
        {status.status === 'working' && !hasProject && <WorkingIndicator />}
        {status.status === 'error' && !hasProject && <ErrorState message={status.message} />}
        
        {hasProject && (
          viewMode === 'preview' 
            ? <LivePreview project={project} device={device} />
            : <CodeView project={project} />
        )}
      </div>
    </div>
  );
}
