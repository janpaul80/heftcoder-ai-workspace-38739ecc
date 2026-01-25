import { FolderOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import hcIcon from '@/assets/hc-icon.png';
import type { UserTier } from '@/types/workspace';
import { GitHubPopover } from './GitHubPopover';
import { PublishButton } from './PublishButton';

interface TopNavProps {
  onFileExplorerOpen: () => void;
  userTier: UserTier;
}

export function TopNav({ onFileExplorerOpen, userTier }: TopNavProps) {
  const canDownload = userTier === 'pro' || userTier === 'studio';

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img src={hcIcon} alt="HeftCoder" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-semibold text-foreground">HeftCoder</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onFileExplorerOpen}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          File Explorer
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <GitHubPopover 
          isConnected={true}
          repoName="janpaul80/heftcoder-project"
        />
        
        <Button
          variant="ghost"
          size="icon"
          disabled={!canDownload}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          title={canDownload ? "Download Code" : "Pro/Studio required"}
        >
          <Download className="h-5 w-5" />
        </Button>

        <PublishButton projectName="landing-page" />
      </div>
    </header>
  );
}
