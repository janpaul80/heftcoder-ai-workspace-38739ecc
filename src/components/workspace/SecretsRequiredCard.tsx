import { useState, useEffect } from 'react';
import { AlertTriangle, Key, Plus, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecretsRequiredCardProps {
  secrets: string[];
  onSecretsAdded?: (secrets: Record<string, string>) => void;
  onSkip?: () => void;
}

interface SaveSecretsResponse {
  success: boolean;
  savedSecrets: string[];
  errors?: string[];
  message: string;
  error?: string;
}

interface ListSecretsResponse {
  success: boolean;
  secrets: { name: string; category: string; isConfigured: boolean }[];
  error?: string;
}

export function SecretsRequiredCard({ secrets, onSecretsAdded, onSkip }: SecretsRequiredCardProps) {
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [addedSecrets, setAddedSecrets] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingSecret, setSavingSecret] = useState<string | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);

  // Check which secrets are already configured on mount
  useEffect(() => {
    const checkExistingSecrets = async () => {
      try {
        const { data, error } = await supabase.functions.invoke<ListSecretsResponse>('list-secrets');
        
        if (!error && data?.success && data.secrets) {
          const existingSecretNames = new Set(
            data.secrets
              .filter(s => s.isConfigured)
              .map(s => s.name)
          );
          
          // Mark any required secrets that are already configured
          const alreadyConfigured = secrets.filter(s => existingSecretNames.has(s));
          if (alreadyConfigured.length > 0) {
            setAddedSecrets(new Set(alreadyConfigured));
          }
        }
      } catch (err) {
        console.error('Error checking existing secrets:', err);
      } finally {
        setIsCheckingExisting(false);
      }
    };

    checkExistingSecrets();
  }, [secrets]);

  const handleSecretChange = (secretName: string, value: string) => {
    setSecretValues(prev => ({ ...prev, [secretName]: value }));
  };

  const handleAddSecret = async (secretName: string) => {
    const value = secretValues[secretName]?.trim();
    if (!value) return;

    setSavingSecret(secretName);

    try {
      // Save individual secret to backend
      const { data, error } = await supabase.functions.invoke<SaveSecretsResponse>('save-secrets', {
        body: { secrets: { [secretName]: value } }
      });

      if (error) {
        console.error('Error saving secret:', error);
        toast.error(`Failed to save ${secretName}: ${error.message}`);
        return;
      }

      if (data?.success) {
        setAddedSecrets(prev => new Set([...prev, secretName]));
        toast.success(`${secretName} saved securely`);
      } else if (data?.error) {
        toast.error(`Failed to save ${secretName}: ${data.error}`);
      }
    } catch (err) {
      console.error('Error saving secret:', err);
      toast.error(`Failed to save ${secretName}`);
    } finally {
      setSavingSecret(null);
    }
  };

  const allSecretsAdded = secrets.every(s => addedSecrets.has(s));

  const handleSubmit = async () => {
    if (!allSecretsAdded) return;
    setIsSubmitting(true);

    try {
      // All secrets already saved individually, just notify parent
      onSecretsAdded?.(secretValues);
      toast.success('All secrets saved successfully!');
    } catch (err) {
      console.error('Error completing secrets:', err);
      toast.error('Failed to complete secrets setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAll = async () => {
    // Collect all unsaved secrets with values
    const unsavedSecrets: Record<string, string> = {};
    for (const secretName of secrets) {
      if (!addedSecrets.has(secretName) && secretValues[secretName]?.trim()) {
        unsavedSecrets[secretName] = secretValues[secretName].trim();
      }
    }

    if (Object.keys(unsavedSecrets).length === 0) {
      toast.error('Please enter values for all required secrets');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke<SaveSecretsResponse>('save-secrets', {
        body: { secrets: unsavedSecrets }
      });

      if (error) {
        console.error('Error saving secrets:', error);
        toast.error(`Failed to save secrets: ${error.message}`);
        return;
      }

      if (data?.success && data.savedSecrets) {
        // Mark all saved secrets
        setAddedSecrets(prev => new Set([...prev, ...data.savedSecrets]));
        
        if (data.errors && data.errors.length > 0) {
          toast.warning(`Saved ${data.savedSecrets.length} secrets, but had issues: ${data.errors.join(', ')}`);
        } else {
          toast.success(data.message);
        }

        // If all secrets are now added, notify parent
        const allNowAdded = secrets.every(s => 
          addedSecrets.has(s) || data.savedSecrets.includes(s)
        );
        
        if (allNowAdded) {
          onSecretsAdded?.(secretValues);
        }
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Error saving secrets:', err);
      toast.error('Failed to save secrets');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSecretDescription = (secretName: string): string => {
    const descriptions: Record<string, string> = {
      'STRIPE_SECRET_KEY': 'Your Stripe secret key (starts with sk_)',
      'STRIPE_WEBHOOK_SECRET': 'Stripe webhook signing secret (starts with whsec_)',
      'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key for admin operations',
      'OPENAI_API_KEY': 'Your OpenAI API key for AI features',
      'ANTHROPIC_API_KEY': 'Your Anthropic/Claude API key',
      'SENDGRID_API_KEY': 'SendGrid API key for email services',
      'TWILIO_AUTH_TOKEN': 'Twilio auth token for SMS/voice',
      'RESEND_API_KEY': 'Resend API key for email services',
      'MAILGUN_API_KEY': 'Mailgun API key for email services',
    };
    return descriptions[secretName] || `API key or secret for ${secretName}`;
  };

  const getSecretLink = (secretName: string): { url: string; label: string } | null => {
    const links: Record<string, { url: string; label: string }> = {
      'STRIPE_SECRET_KEY': { url: 'https://dashboard.stripe.com/apikeys', label: 'Get from Stripe' },
      'STRIPE_WEBHOOK_SECRET': { url: 'https://dashboard.stripe.com/webhooks', label: 'Get from Stripe' },
      'OPENAI_API_KEY': { url: 'https://platform.openai.com/api-keys', label: 'Get from OpenAI' },
      'ANTHROPIC_API_KEY': { url: 'https://console.anthropic.com/', label: 'Get from Anthropic' },
      'SENDGRID_API_KEY': { url: 'https://app.sendgrid.com/settings/api_keys', label: 'Get from SendGrid' },
      'RESEND_API_KEY': { url: 'https://resend.com/api-keys', label: 'Get from Resend' },
      'MAILGUN_API_KEY': { url: 'https://app.mailgun.com/app/account/security/api_keys', label: 'Get from Mailgun' },
    };
    return links[secretName] || null;
  };

  if (secrets.length === 0) return null;

  // If still checking existing secrets, show skeleton loading state
  if (isCheckingExisting) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5 backdrop-blur-sm animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            API Keys Required
          </CardTitle>
          <Skeleton className="h-4 w-3/4 bg-muted/30" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skeleton for secret inputs */}
          {[1, 2, 3].slice(0, Math.min(secrets.length, 3)).map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 rounded bg-muted/30" />
                  <Skeleton className="h-4 w-32 bg-muted/30" />
                </div>
                <Skeleton className="h-3 w-20 bg-muted/30" />
              </div>
              <Skeleton className="h-3 w-2/3 bg-muted/30" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 bg-muted/30" />
                <Skeleton className="h-10 w-20 bg-muted/30" />
              </div>
            </div>
          ))}
          
          {/* Skeleton for buttons */}
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-10 flex-1 bg-muted/30" />
            <Skeleton className="h-10 w-24 bg-muted/30" />
          </div>
          
          <div className="flex justify-center">
            <Skeleton className="h-3 w-48 bg-muted/30" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyValues = secrets.some(s => secretValues[s]?.trim() && !addedSecrets.has(s));

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-amber-400">
          <AlertTriangle className="h-5 w-5" />
          API Keys Required
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          This project requires the following secrets to function properly. Add them to continue.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="max-h-[300px] pr-3">
          <div className="space-y-4">
            {secrets.map((secretName) => {
              const isAdded = addedSecrets.has(secretName);
              const isSaving = savingSecret === secretName;
              const link = getSecretLink(secretName);
              
              return (
                <div key={secretName} className="space-y-2 relative focus-within:z-10">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={secretName} className="flex items-center gap-2 text-sm font-medium">
                      <Key className="h-3.5 w-3.5 text-muted-foreground" />
                      {secretName}
                      {isAdded && <Check className="h-4 w-4 text-emerald-400" />}
                    </Label>
                    {link && (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {getSecretDescription(secretName)}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id={secretName}
                      type="password"
                      placeholder={`Enter ${secretName}...`}
                      value={secretValues[secretName] || ''}
                      onChange={(e) => handleSecretChange(secretName, e.target.value)}
                      disabled={isAdded || isSaving}
                      className={cn(
                        "flex-1 bg-background/50 border-border/50 focus:relative focus:z-10",
                        isAdded && "opacity-50"
                      )}
                    />
                    <Button
                      variant={isAdded ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleAddSecret(secretName)}
                      disabled={isAdded || isSaving || !secretValues[secretName]?.trim()}
                      className="shrink-0 min-w-[80px]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Saving
                        </>
                      ) : isAdded ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-2">
          {allSecretsAdded ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Continuing...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSaveAll}
              disabled={isSubmitting || !hasAnyValues}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving All...
                </>
              ) : (
                'Save All & Continue'
              )}
            </Button>
          )}
          {onSkip && (
            <Button 
              variant="ghost" 
              onClick={onSkip} 
              className="text-muted-foreground"
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Secrets are encrypted and stored securely in HeftCoder Cloud.
        </p>
      </CardContent>
    </Card>
  );
}
