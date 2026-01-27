import { useState } from 'react';
import { Globe, Check, Copy, ExternalLink, Star, ArrowUpRight, Shield, AlertCircle, Eye, ChevronDown, Edit2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface PublishButtonProps {
  projectName?: string;
  isPublished?: boolean;
  onPublish?: () => void;
}

function generateUserId(): string {
  return Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 10000);
}

interface CustomDomain {
  domain: string;
  isVerified: boolean;
  isPrimary: boolean;
}

export function PublishButton({ 
  projectName = 'my-project',
  isPublished = false,
  onPublish 
}: PublishButtonProps) {
  const [open, setOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(isPublished);
  const [userId] = useState(() => generateUserId());
  const [urlSlug, setUrlSlug] = useState('heftcoder-workspace');
  const [urlAccess, setUrlAccess] = useState<'anyone' | 'private'>('anyone');
  const [securityStatus, setSecurityStatus] = useState<'scanning' | 'updating' | 'done'>('done');
  const [securityErrors, setSecurityErrors] = useState(1);
  const [visitors] = useState(48);
  
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([
    { domain: 'workspace.heftcoder.icu', isVerified: true, isPrimary: true },
  ]);
  
  const publishedUrl = `https://${urlSlug}.heftcoder.icu`;
  const primaryDomain = customDomains.find(d => d.isPrimary);

  const handlePublish = async () => {
    setPublishing(true);
    setSecurityStatus('updating');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPublishing(false);
    setPublished(true);
    setSecurityStatus('done');
    onPublish?.();
    toast.success('Your project has been published!');
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  const handleEditDomain = () => {
    toast.info('Opening domain editor...');
  };

  const handleManageDomains = () => {
    toast.info('Opening domain management...');
  };

  const handleReviewSecurity = () => {
    setSecurityStatus('scanning');
    setTimeout(() => {
      setSecurityStatus('done');
      toast.success('Security scan complete');
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          size="sm"
        >
          <Globe className="h-4 w-4" />
          Publish
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-foreground">Publish your app</DialogTitle>
              {published && (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-500 rounded">
                  Live
                </span>
              )}
            </div>
            {published && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{visitors} Visitors</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Published URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Published URL</label>
              <span className="text-muted-foreground cursor-help" title="Your public URL">ⓘ</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your URL, or leave empty to auto-generate.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-secondary rounded-lg">
                <Input
                  value={urlSlug}
                  onChange={(e) => setUrlSlug(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0"
                  placeholder="your-project-name"
                />
                <span className="text-sm text-muted-foreground pr-3 whitespace-nowrap">.heftcoder.icu</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyUrl(publishedUrl)}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Custom Domain */}
          {primaryDomain && (
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">{primaryDomain.domain}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => {
                  const newDomains = customDomains.map(d => ({
                    ...d,
                    isPrimary: d.domain === primaryDomain.domain ? !d.isPrimary : false,
                  }));
                  setCustomDomains(newDomains);
                }}
              >
                <Star className={`h-4 w-4 ${primaryDomain.isPrimary ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => window.open(`https://${primaryDomain.domain}`, '_blank')}
              >
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Domain management buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-sm"
              onClick={handleEditDomain}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit domain
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-sm"
              onClick={handleManageDomains}
            >
              <Settings className="h-3 w-3 mr-1" />
              Manage domains
            </Button>
          </div>

          {/* URL Access */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">Who can visit the URL?</span>
              <span className="text-muted-foreground cursor-help" title="Control who can access your published app">ⓘ</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-border gap-1">
                  <span className="capitalize">{urlAccess}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={() => setUrlAccess('anyone')}>
                  Anyone
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUrlAccess('private')}>
                  Private
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Website info section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Website info</h4>
          </div>

          {/* Security status */}
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className={`h-4 w-4 ${securityStatus === 'scanning' ? 'animate-pulse text-blue-500' : 'text-muted-foreground'}`} />
                <span className="text-sm text-foreground">Security Scan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${securityStatus === 'updating' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                  {securityStatus === 'updating' ? '○ Updating' : securityStatus === 'scanning' ? '○ Scanning...' : ''}
                </span>
              </div>
            </div>
            {securityErrors > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-destructive/20 text-destructive rounded text-xs font-medium">
                <AlertCircle className="h-3 w-3" />
                {securityErrors} Error{securityErrors > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-blue-500 text-blue-500 hover:bg-blue-500/10"
              onClick={handleReviewSecurity}
            >
              Review security
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
