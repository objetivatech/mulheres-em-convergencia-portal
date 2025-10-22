import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  published_at: string;
  author: {
    full_name: string;
  };
  category: {
    name: string;
  };
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
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        featured_image_url,
        published_at,
        profiles:author_id (
          full_name
        ),
        blog_categories:category_id (
          name
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    const typedPosts = posts as unknown as BlogPost[];
    const baseUrl = 'https://mulheresemconvergencia.com.br';
    const rssDate = new Date().toUTCString();

    // Generate RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Mulheres em Convergência - Blog Convergindo</title>
    <description>Portal dedicado ao empoderamento e conexão de mulheres empreendedoras</description>
    <link>${baseUrl}</link>
    <language>pt-BR</language>
    <lastBuildDate>${rssDate}</lastBuildDate>
    <pubDate>${rssDate}</pubDate>
    <managingEditor>contato@mulheresemconvergencia.com.br (Mulheres em Convergência)</managingEditor>
    <webMaster>contato@mulheresemconvergencia.com.br (Mulheres em Convergência)</webMaster>
    <ttl>60</ttl>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/assets/logo-horizontal.png</url>
      <title>Mulheres em Convergência</title>
      <link>${baseUrl}</link>
    </image>
    ${typedPosts.map(post => {
      const postUrl = `${baseUrl}/convergindo/${post.slug}`;
      const pubDate = new Date(post.published_at).toUTCString();
      const author = post.author?.full_name || 'Mulheres em Convergência';
      const category = post.category?.name || 'Geral';
      
      // Clean content for RSS (remove HTML tags for description)
      const cleanExcerpt = post.excerpt?.replace(/<[^>]*>/g, '') || '';
      const cleanContent = post.content?.replace(/<[^>]*>/g, '') || '';
      
      // Prepare content with featured image
      let fullContent = '';
      if (post.featured_image_url) {
        fullContent = `<p><img src="${post.featured_image_url}" alt="${post.title}" style="max-width: 100%; height: auto;" /></p>`;
      }
      fullContent += post.content || '';
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${cleanExcerpt || cleanContent.substring(0, 300) + '...'}]]></description>
      <content:encoded><![CDATA[${fullContent}]]></content:encoded>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>contato@mulheresemconvergencia.com.br (${author})</author>
      <category><![CDATA[${category}]]></category>
      ${post.featured_image_url ? `
      <enclosure url="${post.featured_image_url}" type="image/jpeg" length="0" />
      <media:content url="${post.featured_image_url}" medium="image" type="image/jpeg">
        <media:title>${post.title}</media:title>
      </media:content>` : ''}
    </item>`;
    }).join('')}
  </channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      },
    });

  } catch (error) {
    console.error('RSS generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate RSS feed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});