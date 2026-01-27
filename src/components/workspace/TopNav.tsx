import { useState } from 'react';
import { FolderOpen, Download, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import hcIcon from '@/assets/hc-icon.png';
import type { UserTier } from '@/types/workspace';
import { GitHubPopover } from './GitHubPopover';
import { PublishButton } from './PublishButton';
import { cn } from '@/lib/utils';

interface TopNavProps {
  onFileExplorerOpen: () => void;
  userTier: UserTier;
  isMobile?: boolean;
}

export function TopNav({ onFileExplorerOpen, userTier, isMobile }: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const canDownload = userTier === 'pro' || userTier === 'studio';

  // Mobile Navigation
  if (isMobile) {
    return (
      <header className="h-12 border-b border-border bg-card flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <img src={hcIcon} alt="HeftCoder" className="h-7 w-7 rounded-lg" />
          <span className="text-base font-semibold text-foreground">HeftCoder</span>
        </div>

        <div className="flex items-center gap-1">
          <PublishButton projectName="landing-page" />
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-semibold">Menu</span>
                </div>
                
                <div className="flex-1 p-4 space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    onClick={() => {
                      onFileExplorerOpen();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <FolderOpen className="h-5 w-5 mr-3" />
                    File Explorer
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    disabled={!canDownload}
                  >
                    <Download className="h-5 w-5 mr-3" />
                    Download Code
                    {!canDownload && (
                      <span className="ml-auto text-xs text-muted-foreground">Pro</span>
                    )}
                  </Button>
                  
                  <div className="pt-4 border-t border-border mt-4">
                    <GitHubPopover 
                      isConnected={true}
                      repoName="janpaul80/heftcoder-project"
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    );
  }

  // Desktop Navigation
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
