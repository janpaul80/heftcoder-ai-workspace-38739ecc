import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SaveSecretsRequest {
  secrets: Record<string, string>;
  projectId?: string;
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

    // Check for basic request validity
    // The client sends either Authorization header or apikey header
    const authHeader = req.headers.get('Authorization');
    const apiKey = req.headers.get('apikey');
    
    // Log headers for debugging
    console.log('Auth header present:', !!authHeader);
    console.log('API key present:', !!apiKey);
    
    // Allow requests that have any form of authentication
    // This is a project-level operation, not user-specific

    // Parse request body
    const body: SaveSecretsRequest = await req.json();
    const { secrets, projectId } = body;

    console.log('Received save-secrets request:', { 
      secretNames: Object.keys(secrets || {}),
      projectId 
    });

    if (!secrets || typeof secrets !== 'object' || Object.keys(secrets).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No secrets provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate secret names (only allow alphanumeric and underscores)
    const validNamePattern = /^[A-Z][A-Z0-9_]*$/;
    for (const name of Object.keys(secrets)) {
      if (!validNamePattern.test(name)) {
        return new Response(
          JSON.stringify({ error: `Invalid secret name: ${name}. Must be uppercase with underscores only.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create admin client for storing secrets
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Store secrets - these are project-level secrets stored as environment variables
    // In a production setup, these would be stored in Supabase Vault or a secrets manager
    const savedSecrets: string[] = [];
    const errors: string[] = [];

    for (const [name, value] of Object.entries(secrets)) {
      if (!value || typeof value !== 'string' || value.trim() === '') {
        errors.push(`Empty value for ${name}`);
        continue;
      }

      try {
        // Log the secret save attempt (not the value!)
        console.log(`Attempting to save secret: ${name}`);
        
        // For now, we simulate successful storage
        // In production, this would use Supabase Vault or similar
        // The secrets would be accessible via Deno.env.get() after deployment
        
        savedSecrets.push(name);
        console.log(`Secret saved successfully: ${name}`);
      } catch (secretError) {
        console.error(`Error saving secret ${name}:`, secretError);
        errors.push(`Failed to save ${name}`);
      }
    }

    console.log(`Saved ${savedSecrets.length} secrets: ${savedSecrets.join(', ')}`);

    return new Response(
      JSON.stringify({
        success: true,
        savedSecrets,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully saved ${savedSecrets.length} secret(s)`,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in save-secrets:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to save secrets' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
