import { useState, useEffect } from 'react';
import { Settings, Key, Check, AlertCircle, Loader2, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SecretInfo {
  name: string;
  category: string;
  isConfigured: boolean;
}

interface SecretsResponse {
  success: boolean;
  secrets: SecretInfo[];
  grouped: Record<string, SecretInfo[]>;
  totalCount: number;
  error?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Payments': '💳',
  'AI Services': '🤖',
  'Email': '📧',
  'Database': '🗄️',
  'Authentication': '🔐',
  'Custom': '⚙️',
};

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [secrets, setSecrets] = useState<SecretInfo[]>([]);
  const [groupedSecrets, setGroupedSecrets] = useState<Record<string, SecretInfo[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSecrets = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<SecretsResponse>('list-secrets');

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.success) {
        setSecrets(data.secrets || []);
        setGroupedSecrets(data.grouped || {});
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Error fetching secrets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load secrets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSecrets();
    }
  }, [open]);

  const categoryOrder = ['Payments', 'AI Services', 'Email', 'Database', 'Authentication', 'Custom'];
  const sortedCategories = Object.keys(groupedSecrets).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workspace Settings
          </DialogTitle>
          <DialogDescription>
            Manage your workspace configuration and secrets
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="secrets" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="secrets" className="gap-2">
              <Key className="h-4 w-4" />
              Secrets
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="secrets" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Configured Secrets</h3>
                  <p className="text-xs text-muted-foreground">
                    API keys and secrets stored in HeftCoder Cloud
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSecrets}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>

              <Separator />

              {loading && secrets.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="ghost" size="sm" onClick={fetchSecrets} className="mt-2">
                    Try again
                  </Button>
                </div>
              ) : secrets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Key className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No secrets configured yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Secrets will appear here when you add them during project generation
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedCategories.map((category) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <span>{CATEGORY_ICONS[category] || '🔑'}</span>
                        {category}
                        <Badge variant="secondary" className="text-xs">
                          {groupedSecrets[category].length}
                        </Badge>
                      </h4>
                      <div className="grid gap-2">
                        {groupedSecrets[category].map((secret) => (
                          <div
                            key={secret.name}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              "bg-card/50 hover:bg-card/80 transition-colors"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Check className="h-4 w-4 text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-sm font-mono font-medium">{secret.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ••••••••••••••••
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                              Configured
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Secrets are encrypted and stored securely in HeftCoder Cloud
                    </p>
                    <p>
                      Total: {secrets.length} secret{secrets.length !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="security" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Security Settings</h3>
                <p className="text-xs text-muted-foreground">
                  Manage security and access settings
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">End-to-End Encryption</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        All secrets are encrypted at rest and in transit using industry-standard AES-256 encryption.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Secret Isolation</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Secrets are only accessible to backend functions and are never exposed to client-side code.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
