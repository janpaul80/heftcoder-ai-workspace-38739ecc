import { useState } from 'react';
import { Github, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface GitHubPopoverProps {
  isConnected?: boolean;
  repoName?: string;
  onConnect?: () => void;
  onConfigure?: () => void;
}

export function GitHubPopover({ 
  isConnected = false, 
  repoName = 'user/project-repo',
  onConnect,
  onConfigure 
}: GitHubPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
          title="GitHub"
        >
          <Github className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        className="w-72 bg-card border-border p-0"
        sideOffset={8}
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5 text-foreground" />
              <span className="font-semibold text-foreground">GitHub</span>
            </div>
            {isConnected && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                <Check className="h-3.5 w-3.5" />
                <span>Connected</span>
              </div>
            )}
          </div>

          {isConnected ? (
            <>
              {/* Connected state */}
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <Github className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-foreground font-medium truncate flex-1">
                  {repoName}
                </span>
              </div>

              {/* Edit in VS Code */}
              <button 
                className="flex items-center gap-2 w-full p-3 hover:bg-secondary rounded-lg transition-colors text-left"
                onClick={() => window.open(`vscode://vscode.git/clone?url=https://github.com/${repoName}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Edit in VS Code</span>
              </button>

              {/* Configure button */}
              <Button 
                variant="outline" 
                className="w-full border-primary text-primary hover:bg-primary/10"
                onClick={onConfigure}
              >
                Configure
              </Button>
            </>
          ) : (
            <>
              {/* Not connected state */}
              <p className="text-sm text-muted-foreground">
                Connect your GitHub account to push your project to a repository.
              </p>
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={onConnect}
              >
                Connect GitHub
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
