import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errorDescription = url.searchParams.get('error_description');

        if (errorDescription) {
          toast.error(decodeURIComponent(errorDescription));
          navigate('/auth', { replace: true });
          return;
        }

        if (!code) {
          toast.error('Missing OAuth code');
          navigate('/auth', { replace: true });
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast.error(error.message);
          navigate('/auth', { replace: true });
          return;
        }

        // Clean up URL so refresh doesn't try to re-exchange.
        window.history.replaceState({}, document.title, '/');
        navigate('/', { replace: true });
      } catch (e: any) {
        toast.error(e?.message || 'Authentication failed');
        navigate('/auth', { replace: true });
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Finishing sign in…</p>
      </div>
    </div>
  );
}
