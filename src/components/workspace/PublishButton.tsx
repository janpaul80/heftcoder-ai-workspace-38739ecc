import { useState } from 'react';
import { Globe, Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PublishButtonProps {
  projectName?: string;
  isPublished?: boolean;
  onPublish?: () => void;
}

function generateUserId(): string {
  return Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 10000);
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
  
  const publishedUrl = `https://heftcoder.icu/user${userId}`;

  const handlePublish = async () => {
    setPublishing(true);
    // Simulate publishing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPublishing(false);
    setPublished(true);
    onPublish?.();
    toast.success('Your project has been published!');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publishedUrl);
    toast.success('URL copied to clipboard!');
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
          <DialogTitle className="text-foreground">Publish your project</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Make your {projectName} live on the web with a heftcoder.icu URL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {published ? (
            <>
              {/* Published state */}
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <Check className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-emerald-500 font-medium">Published successfully!</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your live URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 p-3 bg-secondary rounded-lg">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate">{publishedUrl}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyUrl}
                    className="shrink-0 border-border"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => window.open(publishedUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit site
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Not published state */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preview URL</label>
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{publishedUrl}</span>
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Publish Now
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
