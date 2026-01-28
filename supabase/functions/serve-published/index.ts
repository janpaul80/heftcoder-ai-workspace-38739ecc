import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role for public access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the published project by slug
    const { data: project, error } = await supabase
      .from("published_projects")
      .select("*")
      .eq("slug", slug)
      .eq("is_public", true)
      .single();

    if (error || !project) {
      // Return a nice 404 page
      const notFoundHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found - HeftCoder</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-900 flex items-center justify-center">
  <div class="text-center">
    <h1 class="text-6xl font-bold text-white mb-4">404</h1>
    <p class="text-xl text-gray-400 mb-8">This page doesn't exist or has been unpublished.</p>
    <a href="https://heftcoder-workspace.lovable.app" class="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
      Create Your Own
    </a>
  </div>
</body>
</html>`;
      return new Response(notFoundHtml, {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    // Increment visitor count (fire and forget)
    supabase
      .from("published_projects")
      .update({ visitor_count: project.visitor_count + 1 })
      .eq("id", project.id)
      .then(() => {});

    // Return the HTML content
    return new Response(project.html_content, {
      status: 200,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });

  } catch (err) {
    console.error("Error serving published page:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
