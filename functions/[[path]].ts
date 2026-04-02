// Cloudflare Pages Function to:
// 1. Proxy RSS/Sitemap/llms-full.txt requests to Supabase Edge Functions
// 2. Serve pre-rendered HTML to crawlers/bots for SEO

interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

// Crawler and bot User-Agent patterns
const BOT_USER_AGENTS = [
  // Search engines
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'baiduspider',
  'sogou', 'exabot', 'facebot', 'ia_archiver',
  // Social media
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'pinterest',
  'slackbot', 'telegrambot', 'whatsapp', 'discordbot',
  // AI crawlers
  'gptbot', 'chatgpt-user', 'claudebot', 'anthropic-ai',
  'perplexitybot', 'cohere-ai', 'bytespider', 'petalbot',
  'ccbot', 'semrushbot', 'ahrefsbot', 'dotbot', 'rogerbot',
  'screaming frog', 'mj12bot', 'blexbot',
  // Generic bots
  'python-requests', 'python-urllib', 'node-fetch', 'axios',
  'go-http-client', 'java/', 'wget', 'curl/',
  'applebot', 'seznambot', 'archive.org_bot',
];

// File extensions that should never be pre-rendered
const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|webp|avif|mp4|webm|pdf|xml|json|txt|mp3|wav|ogg)$/i;

function isBot(userAgent: string): boolean {
  if (!userAgent) return true; // Empty UA = likely a bot
  const ua = userAgent.toLowerCase();

  // Check known bot patterns
  for (const bot of BOT_USER_AGENTS) {
    if (ua.includes(bot)) return true;
  }

  // If it looks like a real browser, it's not a bot
  if (ua.includes('mozilla/') && (ua.includes('chrome/') || ua.includes('firefox/') || ua.includes('safari/') || ua.includes('edg/'))) {
    return false;
  }

  return false;
}

// Routes that have dynamic content worth pre-rendering
function isPrerenderableRoute(path: string): boolean {
  if (path === '/' || path === '') return true;
  const prerenderPrefixes = [
    '/convergindo', '/diretorio', '/eventos', '/academy',
    '/embaixadoras', '/sobre', '/contato', '/planos',
    '/comunidades', '/criar-converter', '/pagina/', '/lp/',
    '/termos-de-uso', '/politica-de-privacidade', '/politica-de-cookies',
  ];
  return prerenderPrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

export async function onRequest(context: { request: Request; env: Env; next: () => Promise<Response> }) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Never intercept static assets
  if (STATIC_EXTENSIONS.test(path)) {
    return context.next();
  }

  const supabaseUrl = context.env.VITE_SUPABASE_URL;
  const supabaseKey = context.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // ── RSS, Sitemap, llms-full.txt proxy ──
  if (path === '/rss.xml' || path === '/sitemap.xml' || path === '/llms-full.txt') {
    if (!supabaseUrl || !supabaseKey) {
      return new Response('Configuration error', { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }

    const functionMap: Record<string, string> = {
      '/rss.xml': 'generate-rss',
      '/sitemap.xml': 'generate-sitemap',
      '/llms-full.txt': 'generate-llms-full',
    };

    const functionName = functionMap[path];
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/${functionName}`;

    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (!response.ok) {
        return new Response(`Error fetching ${path}`, { status: response.status, headers: { 'Content-Type': 'text/plain' } });
      }

      const content = await response.text();
      const contentType = path === '/llms-full.txt' ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8';

      return new Response(content, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      console.error(`Error proxying ${path}:`, error);
      return new Response(`Error generating ${path}`, { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }
  }

  // ── SEO Pre-rendering for crawlers ──
  const userAgent = context.request.headers.get('user-agent') || '';

  if (isBot(userAgent) && isPrerenderableRoute(path) && supabaseUrl && supabaseKey) {
    try {
      const prerenderUrl = `${supabaseUrl}/functions/v1/seo-prerender?path=${encodeURIComponent(path)}`;
      const response = await fetch(prerenderUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (response.ok) {
        const html = await response.text();
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=43200',
            'X-Prerendered': 'true',
          },
        });
      }

      // If prerender fails, fall through to SPA
      console.error(`Prerender failed for ${path}: ${response.status}`);
    } catch (error) {
      console.error(`Prerender error for ${path}:`, error);
    }
  }

  // ── Pass through to SPA for real browsers ──
  return context.next();
}
