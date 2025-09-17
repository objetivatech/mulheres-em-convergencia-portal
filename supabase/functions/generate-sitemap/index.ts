import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

interface BlogPost {
  slug: string;
  published_at: string;
  updated_at: string;
}

interface BlogCategory {
  slug: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch published blog posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .eq('status', 'published');

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      throw postsError;
    }

    // Fetch blog categories
    const { data: categories, error: categoriesError } = await supabase
      .from('blog_categories')
      .select('slug');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      throw categoriesError;
    }

    const baseUrl = 'https://mulheresemconvergencia.com.br';
    const currentDate = new Date().toISOString();

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/sobre', priority: '0.8', changefreq: 'monthly' },
      { url: '/convergindo', priority: '0.9', changefreq: 'daily' },
      { url: '/contato', priority: '0.7', changefreq: 'monthly' },
      { url: '/planos', priority: '0.6', changefreq: 'weekly' },
    ];

    // Generate sitemap XML
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
  ${posts?.map((post: BlogPost) => {
    const lastmod = post.updated_at > post.published_at ? post.updated_at : post.published_at;
    return `
  <url>
    <loc>${baseUrl}/convergindo/${post.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('') || ''}
  ${categories?.map((category: BlogCategory) => `
  <url>
    <loc>${baseUrl}/convergindo/categoria/${category.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('') || ''}
</urlset>`;

    return new Response(sitemapXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      },
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});