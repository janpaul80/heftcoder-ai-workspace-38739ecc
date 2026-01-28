import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Published() {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    async function fetchPublishedPage() {
      if (!slug) {
        setError('No project specified');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('published_projects')
          .select('html_content, name, is_public')
          .eq('slug', slug)
          .single();

        if (fetchError || !data) {
          setError('Page not found or has been unpublished');
          setLoading(false);
          return;
        }

        if (!data.is_public) {
          setError('This page is private');
          setLoading(false);
          return;
        }

        setHtml(data.html_content);
        setProjectName(data.name);
      } catch (err) {
        console.error('Error fetching published page:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    }

    fetchPublishedPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">{error}</p>
          <Link to="/">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Create Your Own
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Floating badge */}
      <div className="fixed bottom-4 right-4 z-50">
        <Link 
          to="/" 
          className="flex items-center gap-2 px-4 py-2 bg-card/90 backdrop-blur border border-border rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-card transition shadow-lg"
        >
          Built with HeftCoder
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Render the published HTML in an iframe for isolation */}
      <iframe
        srcDoc={html || ''}
        title={projectName || 'Published Page'}
        className="w-full h-screen border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
