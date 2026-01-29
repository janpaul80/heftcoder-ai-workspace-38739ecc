import { useState, useEffect } from 'react';
import { Globe, Copy, Star, ArrowUpRight, Shield, AlertCircle, Eye, ChevronDown, Edit2, Settings, Loader2, Check, ExternalLink } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { GeneratedProject } from '@/types/workspace';
import { sanitizePublishedHtml } from '@/lib/publishing/sanitizePublishedHtml';

interface PublishButtonProps {
  projectName?: string;
  project?: GeneratedProject | null;
}

interface PublishedProject {
  id: string;
  slug: string;
  is_public: boolean;
  visitor_count: number;
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
}

export function PublishButton({ 
  projectName = 'my-project',
  project
}: PublishButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [urlSlug, setUrlSlug] = useState('');
  const [urlAccess, setUrlAccess] = useState<'anyone' | 'private'>('anyone');
  const [publishedData, setPublishedData] = useState<PublishedProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Generate default slug from project name
  useEffect(() => {
    if (project?.name && !urlSlug) {
      const defaultSlug = project.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
      setUrlSlug(defaultSlug || 'my-project');
    }
  }, [project?.name, urlSlug]);

  // Check if project is already published when dialog opens
  useEffect(() => {
    if (open && user && project) {
      checkExistingPublication();
    }
  }, [open, user, project]);

  const checkExistingPublication = async () => {
    if (!user || !project) return;
    
    setLoading(true);
    try {
      // Check if this user has a published version
      const { data, error } = await supabase
        .from('published_projects')
        .select('id, slug, is_public, visitor_count, published_at, seo_title, seo_description')
        .eq('user_id', user.id)
        .eq('name', project.name)
        .maybeSingle();

      if (data && !error) {
        setPublishedData(data);
        setUrlSlug(data.slug);
        setUrlAccess(data.is_public ? 'anyone' : 'private');
        setSeoTitle(data.seo_title || '');
        setSeoDescription(data.seo_description || '');
      }
    } catch (err) {
      console.error('Error checking publication:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateSlug = async (slug: string): Promise<boolean> => {
    if (!slug || slug.length < 3) {
      setSlugError('Slug must be at least 3 characters');
      return false;
    }
    
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Only lowercase letters, numbers, and hyphens allowed');
      return false;
    }

    // Check if slug is taken by another user
    const { data } = await supabase
      .from('published_projects')
      .select('id, user_id')
      .eq('slug', slug)
      .maybeSingle();

    if (data && data.user_id !== user?.id) {
      setSlugError('This URL is already taken');
      return false;
    }

    setSlugError(null);
    return true;
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error('Please sign in to publish');
      return;
    }

    if (!project || !project.previewHtml) {
      toast.error('No project to publish. Generate a project first!');
      return;
    }

    const isValid = await validateSlug(urlSlug);
    if (!isValid) return;

    setPublishing(true);

    try {
      const finalTitle = seoTitle.trim() || project.name;
      const finalDescription = seoDescription.trim() || undefined;
      
      const brandedHtml = sanitizePublishedHtml(project.previewHtml, {
        title: finalTitle,
        brandName: 'HeftCoder',
        description: finalDescription,
      });

      const projectData = {
        user_id: user.id,
        slug: urlSlug,
        name: project.name,
        html_content: brandedHtml,
        original_prompt: '', // Could be passed from parent
        project_type: project.type,
        is_public: urlAccess === 'anyone',
        published_at: new Date().toISOString(),
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      };

      if (publishedData) {
        // Update existing
        const { error } = await supabase
          .from('published_projects')
          .update(projectData)
          .eq('id', publishedData.id);

        if (error) throw error;
        toast.success('Project updated successfully!');
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('published_projects')
          .insert(projectData)
          .select('id, slug, is_public, visitor_count, published_at, seo_title, seo_description')
          .single();

        if (error) throw error;
        setPublishedData(data);
        toast.success('Project published successfully!');
      }
    } catch (err: any) {
      console.error('Publish error:', err);
      if (err.code === '23505') {
        setSlugError('This URL is already taken');
      } else {
        toast.error(err.message || 'Failed to publish');
      }
    } finally {
      setPublishing(false);
    }
  };

  const publishedUrl = `${window.location.origin}/p/${urlSlug}`;
  const hasProject = project && project.previewHtml;
  const isPublished = !!publishedData;

  const copyUrl = () => {
    navigator.clipboard.writeText(publishedUrl);
    toast.success('URL copied to clipboard!');
  };

  const openPublishedSite = () => {
    window.open(publishedUrl, '_blank');
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
              {isPublished && (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-500 rounded flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Live
                </span>
              )}
            </div>
            {isPublished && publishedData && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{publishedData.visitor_count} Visitors</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !hasProject ? (
          <div className="py-8 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Generate a project first before publishing.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Published URL Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">Published URL</label>
                <span className="text-muted-foreground cursor-help text-xs" title="Your public URL">ⓘ</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a unique URL for your published project.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-secondary rounded-lg">
                  <Input
                    value={urlSlug}
                    onChange={(e) => {
                      setUrlSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      setSlugError(null);
                    }}
                    className="border-0 bg-transparent focus-visible:ring-0"
                    placeholder="your-project-name"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyUrl}
                  className="shrink-0"
                  title="Copy URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {isPublished && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openPublishedSite}
                    className="shrink-0"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {slugError && (
                <p className="text-xs text-destructive">{slugError}</p>
              )}
              <p className="text-xs text-muted-foreground truncate">
                {publishedUrl}
              </p>
            </div>

            {/* SEO Fields */}
            <div className="space-y-3 p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Share Preview (SEO)</span>
                <span className="text-muted-foreground cursor-help text-xs" title="Customize how your page appears when shared on social media">ⓘ</span>
              </div>
              <div className="space-y-2">
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="bg-background border-border"
                  placeholder={`Title (default: ${project.name})`}
                  maxLength={60}
                />
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full min-h-[60px] p-2 text-sm bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Description for social sharing (max 160 chars)"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {seoTitle.length}/60 title · {seoDescription.length}/160 description
                </p>
              </div>
            </div>

            {/* URL Access Control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Who can visit?</span>
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

            {/* Project Info */}
            <div className="p-3 bg-secondary rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Project</span>
                <span className="text-foreground font-medium">{project.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground capitalize">{project.type}</span>
              </div>
              {isPublished && publishedData && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Published</span>
                  <span className="text-foreground">
                    {new Date(publishedData.published_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Publish Button */}
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handlePublish}
              disabled={publishing || !urlSlug}
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPublished ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  {isPublished ? 'Update' : 'Publish'}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
