import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

interface AyrsharePostData {
  post: string;
  platforms: string[];
  media_urls?: string[];
  profiles?: string[];
  scheduled_date?: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
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
    const { postId } = await req.json();

    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get AYRSHARE API key from secrets
    const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY');
    if (!ayrshareApiKey) {
      console.error('AYRSHARE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AYRSHARE API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the blog post data
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        profiles:author_id (
          full_name
        ),
        blog_categories:category_id (
          name
        )
      `)
      .eq('id', postId)
      .eq('status', 'published')
      .single();

    if (postError || !post) {
      console.error('Error fetching post:', postError);
      return new Response(
        JSON.stringify({ error: 'Post not found or not published' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const typedPost = post as unknown as BlogPost;
    const baseUrl = 'https://mulhereemconvergeencia.com.br';
    const postUrl = `${baseUrl}/convergindo/${typedPost.slug}`;
    
    // Create social media post content
    const postTitle = typedPost.title;
    const postExcerpt = typedPost.excerpt || '';
    const authorName = typedPost.author?.full_name || 'Mulheres em Convergência';
    const categoryName = typedPost.category?.name || '';

    // Generate different content for different platforms
    const generatePostContent = (platform: string) => {
      const hashtags = '#MulheresEmConvergencia #Empreendedorismo #MulheresEmpreendedoras #BlogConvergindo';
      
      switch (platform) {
        case 'facebook':
          return `🌟 Novo post no Blog Convergindo!

${postTitle}

${postExcerpt}

${categoryName ? `📂 Categoria: ${categoryName}` : ''}
✍️ Por: ${authorName}

Leia o post completo: ${postUrl}

${hashtags}`;

        case 'linkedin':
          return `🚀 Novo artigo publicado no Blog Convergindo

${postTitle}

${postExcerpt}

Este conteúdo foi criado para inspirar e empoderar mulheres empreendedoras em sua jornada de crescimento.

${categoryName ? `#${categoryName.replace(/\s+/g, '')}` : ''} ${hashtags}

Leia mais: ${postUrl}`;

        case 'twitter':
          const shortContent = `✨ ${postTitle}

${postExcerpt.length > 100 ? postExcerpt.substring(0, 100) + '...' : postExcerpt}

${postUrl}

${hashtags}`;
          
          // Twitter has character limit
          return shortContent.length > 280 ? 
            `✨ ${postTitle}\n\n${postUrl}\n\n${hashtags}` : 
            shortContent;

        case 'instagram':
          return `🌟 ${postTitle}

${postExcerpt}

${categoryName ? `📂 ${categoryName}` : ''}
✍️ ${authorName}

Link no nosso perfil! 👆

${hashtags}`;

        default:
          return `🌟 ${postTitle}

${postExcerpt}

${categoryName ? `📂 ${categoryName}` : ''}
✍️ ${authorName}

${postUrl}

${hashtags}`;
      }
    };

    // Configure platforms to post to (can be made configurable per post later)
    const platforms = ['facebook', 'linkedin', 'twitter'];
    const mediaUrls = typedPost.featured_image_url ? [typedPost.featured_image_url] : undefined;

    // Prepare AYRSHARE API data
    const ayrshareData: AyrsharePostData = {
      post: generatePostContent('default'), // Default content
      platforms: platforms,
      media_urls: mediaUrls,
      // Can add scheduling for later posting
      // scheduled_date: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes delay
    };

    // Add platform-specific content
    const platformSpecificData = {
      ...ayrshareData,
      facebookOptions: {
        post: generatePostContent('facebook')
      },
      linkedInOptions: {
        post: generatePostContent('linkedin')
      },
      twitterOptions: {
        post: generatePostContent('twitter')
      },
      instagramOptions: {
        post: generatePostContent('instagram')
      }
    };

    console.log('Sending to AYRSHARE:', { postId, platforms, hasImage: !!mediaUrls });

    // Send to AYRSHARE API
    const ayrshareResponse = await fetch('https://app.ayrshare.com/api/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ayrshareApiKey}`,
      },
      body: JSON.stringify(platformSpecificData),
    });

    const ayrshareResult = await ayrshareResponse.json();

    if (!ayrshareResponse.ok) {
      console.error('AYRSHARE API error:', ayrshareResult);
      throw new Error(`AYRSHARE API error: ${ayrshareResult.message || 'Unknown error'}`);
    }

    console.log('AYRSHARE success:', ayrshareResult);

    // Log the social media post activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: 'system', // Use system user ID or the author's ID
        activity_type: 'blog_auto_posted',
        activity_description: `Post "${postTitle}" automatically shared to social media`,
        metadata: {
          post_id: postId,
          platforms: platforms,
          ayrshare_response: ayrshareResult
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Post successfully shared to social media',
        platforms: platforms,
        ayrshare_result: ayrshareResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Auto-post error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to auto-post to social media',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});