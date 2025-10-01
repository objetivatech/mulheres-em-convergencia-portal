// Cloudflare Pages Function to proxy RSS and Sitemap requests to Supabase Edge Functions
// This adds the required apikey header that _redirects cannot inject

interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

export async function onRequest(context: { request: Request; env: Env; next: () => Promise<Response> }) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Only handle RSS and Sitemap requests
  if (path === '/rss.xml' || path === '/sitemap.xml') {
    const supabaseUrl = context.env.VITE_SUPABASE_URL;
    const supabaseKey = context.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response('Configuration error: Missing Supabase credentials', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Determine which Edge Function to call
    const functionName = path === '/rss.xml' ? 'generate-rss' : 'generate-sitemap';
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/${functionName}`;

    try {
      // Fetch from Supabase Edge Function with apikey header
      const response = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (!response.ok) {
        console.error(`Edge Function ${functionName} returned status ${response.status}`);
        return new Response(`Error fetching ${path}`, { 
          status: response.status,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Get the XML content
      const xmlContent = await response.text();

      // Return with correct content type and caching headers
      return new Response(xmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      console.error(`Error proxying ${path}:`, error);
      return new Response(`Error generating ${path}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }

  // Pass through all other requests
  return context.next();
}
