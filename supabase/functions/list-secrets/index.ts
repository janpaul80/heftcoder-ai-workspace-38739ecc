import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Known secret categories for better organization
const SECRET_CATEGORIES: Record<string, string[]> = {
  'Payments': ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PUBLISHABLE_KEY'],
  'AI Services': ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'LANGDOCK_API_KEY', 'LOVABLE_API_KEY'],
  'Email': ['SENDGRID_API_KEY', 'RESEND_API_KEY', 'MAILGUN_API_KEY'],
  'Database': ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'SUPABASE_URL', 'SUPABASE_DB_URL'],
  'Authentication': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'NEXTAUTH_SECRET'],
};

interface SecretInfo {
  name: string;
  category: string;
  isConfigured: boolean;
  lastUpdated?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration');
      throw new Error('Missing Supabase configuration');
    }

    // Check for basic request validity - allow API key or auth header
    // This is a project-level operation, not user-specific
    const authHeader = req.headers.get('Authorization');
    const apiKey = req.headers.get('apikey');
    
    console.log('List-secrets request - Auth header present:', !!authHeader, 'API key present:', !!apiKey);

    // Check which secrets are configured by checking environment variables
    // Note: We only return names, never values
    const configuredSecrets: SecretInfo[] = [];
    const allKnownSecrets = Object.entries(SECRET_CATEGORIES).flatMap(([category, names]) => 
      names.map(name => ({ name, category }))
    );

    for (const { name, category } of allKnownSecrets) {
      const value = Deno.env.get(name);
      if (value && value.trim() !== '') {
        configuredSecrets.push({
          name,
          category,
          isConfigured: true,
        });
      }
    }

    // Also check for any other env vars that look like secrets (uppercase with underscores)
    // This catches user-added secrets not in our predefined list
    const envKeys = Object.keys(Deno.env.toObject());
    const customSecrets = envKeys.filter(key => {
      // Skip known secrets and system vars
      if (allKnownSecrets.some(s => s.name === key)) return false;
      if (key.startsWith('DENO_') || key.startsWith('HOME') || key === 'PATH') return false;
      // Only include uppercase keys that look like secrets
      return /^[A-Z][A-Z0-9_]*(_KEY|_SECRET|_TOKEN|_API|_ID)$/.test(key);
    });

    for (const name of customSecrets) {
      configuredSecrets.push({
        name,
        category: 'Custom',
        isConfigured: true,
      });
    }

    // Group by category for easier display
    const groupedSecrets: Record<string, SecretInfo[]> = {};
    for (const secret of configuredSecrets) {
      if (!groupedSecrets[secret.category]) {
        groupedSecrets[secret.category] = [];
      }
      groupedSecrets[secret.category].push(secret);
    }

    return new Response(
      JSON.stringify({
        success: true,
        secrets: configuredSecrets,
        grouped: groupedSecrets,
        totalCount: configuredSecrets.length,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in list-secrets:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to list secrets' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
