import { useState } from 'react';
import { AlertTriangle, Key, Plus, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SecretsRequiredCardProps {
  secrets: string[];
  onSecretsAdded?: (secrets: Record<string, string>) => void;
  onSkip?: () => void;
}

export function SecretsRequiredCard({ secrets, onSecretsAdded, onSkip }: SecretsRequiredCardProps) {
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [addedSecrets, setAddedSecrets] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSecretChange = (secretName: string, value: string) => {
    setSecretValues(prev => ({ ...prev, [secretName]: value }));
  };

  const handleAddSecret = (secretName: string) => {
    if (secretValues[secretName]?.trim()) {
      setAddedSecrets(prev => new Set([...prev, secretName]));
    }
  };

  const allSecretsAdded = secrets.every(s => addedSecrets.has(s));

  const handleSubmit = () => {
    if (!allSecretsAdded) return;
    setIsSubmitting(true);
    onSecretsAdded?.(secretValues);
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
    };
    return descriptions[secretName] || `API key or secret for ${secretName}`;
  };

  const getSecretLink = (secretName: string): { url: string; label: string } | null => {
    const links: Record<string, { url: string; label: string }> = {
      'STRIPE_SECRET_KEY': { url: 'https://dashboard.stripe.com/apikeys', label: 'Get from Stripe Dashboard' },
      'STRIPE_WEBHOOK_SECRET': { url: 'https://dashboard.stripe.com/webhooks', label: 'Get from Stripe Webhooks' },
      'OPENAI_API_KEY': { url: 'https://platform.openai.com/api-keys', label: 'Get from OpenAI' },
      'ANTHROPIC_API_KEY': { url: 'https://console.anthropic.com/', label: 'Get from Anthropic' },
      'SENDGRID_API_KEY': { url: 'https://app.sendgrid.com/settings/api_keys', label: 'Get from SendGrid' },
    };
    return links[secretName] || null;
  };

  if (secrets.length === 0) return null;

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
        {secrets.map((secretName) => {
          const isAdded = addedSecrets.has(secretName);
          const link = getSecretLink(secretName);
          
          return (
            <div key={secretName} className="space-y-2">
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
                  disabled={isAdded}
                  className={cn(
                    "flex-1 bg-background/50 border-border/50",
                    isAdded && "opacity-50"
                  )}
                />
                <Button
                  variant={isAdded ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleAddSecret(secretName)}
                  disabled={isAdded || !secretValues[secretName]?.trim()}
                  className="shrink-0"
                >
                  {isAdded ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Added
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

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!allSecretsAdded || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Continue with Secrets'}
          </Button>
          {onSkip && (
            <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
              Skip for now
            </Button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Secrets are stored securely and never exposed in client-side code.
        </p>
      </CardContent>
    </Card>
  );
}
