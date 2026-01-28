import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Main app auth URL - users will be redirected here if not authenticated
const MAIN_APP_AUTH_URL = 'https://app.heftcoder.icu/auth';

export default function Auth() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      // User is authenticated, go to workspace
      console.log('User authenticated, redirecting to workspace');
      navigate('/', { replace: true });
    } else {
      // User not authenticated, redirect to main app's auth page
      console.log('User not authenticated, redirecting to main app auth');
      window.location.href = MAIN_APP_AUTH_URL;
    }
  }, [user, isLoading, navigate]);

  // Show loading while checking auth state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  );
}
