// Simple diagnostic function to test deployment and secrets
Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const envObj = Deno.env.toObject();
  const diag = {
    build: "test-diag-v1",
    timestamp: new Date().toISOString(),
    secrets: {
      LANGDOCK_API_KEY: Boolean(envObj.LANGDOCK_API_KEY && envObj.LANGDOCK_API_KEY.length > 0),
      AGENT_ARCHITECT_ID: Boolean(envObj.AGENT_ARCHITECT_ID),
      AGENT_BACKEND_ID: Boolean(envObj.AGENT_BACKEND_ID),
      AGENT_FRONTEND_ID: Boolean(envObj.AGENT_FRONTEND_ID),
      AGENT_INTEGRATOR_ID: Boolean(envObj.AGENT_INTEGRATOR_ID),
      AGENT_QA_ID: Boolean(envObj.AGENT_QA_ID),
      AGENT_DEVOPS_ID: Boolean(envObj.AGENT_DEVOPS_ID),
    },
    apiKeyLength: envObj.LANGDOCK_API_KEY?.length || 0,
    envKeys: Object.keys(envObj).filter(k => !k.includes("SECRET") && !k.includes("KEY") && !k.includes("PASSWORD")),
  };

  return new Response(JSON.stringify(diag, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
