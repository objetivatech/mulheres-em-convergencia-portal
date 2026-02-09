import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select(`
        title, slug, excerpt, content, published_at, updated_at,
        blog_categories(name),
        blog_authors!blog_posts_author_profile_id_fkey(display_name)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    const baseUrl = 'https://mulheresemconvergencia.com.br';
    const lines: string[] = [];

    lines.push('# Mulheres em Convergência - Blog Convergindo');
    lines.push('');
    lines.push('> Todos os artigos publicados no blog Convergindo do portal Mulheres em Convergência.');
    lines.push(`> Gerado em: ${new Date().toISOString()}`);
    lines.push(`> Total de artigos: ${posts?.length || 0}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const post of posts || []) {
      const author = (post as any).blog_authors?.display_name || 'Mulheres em Convergência';
      const category = (post as any).blog_categories?.name || 'Sem categoria';
      const url = `${baseUrl}/convergindo/${post.slug}`;

      lines.push(`## ${post.title}`);
      lines.push('');
      lines.push(`- **URL:** ${url}`);
      lines.push(`- **Autor:** ${author}`);
      lines.push(`- **Categoria:** ${category}`);
      lines.push(`- **Publicado em:** ${post.published_at}`);
      if (post.updated_at && post.updated_at > post.published_at) {
        lines.push(`- **Atualizado em:** ${post.updated_at}`);
      }
      lines.push('');

      if (post.excerpt) {
        lines.push(`**Resumo:** ${post.excerpt}`);
        lines.push('');
      }

      // Strip HTML tags from content
      const plainContent = (post.content || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

      if (plainContent) {
        lines.push(plainContent);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    return new Response(lines.join('\n'), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      },
    });

  } catch (error) {
    console.error('LLMs full generation error:', error);
    return new Response(
      `Error generating content: ${error.message}`,
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      }
    );
  }
});
