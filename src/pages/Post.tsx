import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Eye, Share2, ChevronRight, Home, Clock, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { SchemaOrg } from '@/components/blog/SchemaOrg';
import DOMPurify from 'dompurify';
import { AuthorBlock } from '@/components/blog/AuthorBlock';
import { CommentForm } from '@/components/blog/CommentForm';
import { CommentList } from '@/components/blog/CommentList';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  status: string;
  published_at: string;
  created_at: string;
  views_count: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  author: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  author_profile: {
    display_name: string;
    photo_url: string | null;
    bio: string | null;
    instagram_url: string | null;
    linkedin_url: string | null;
    website_url: string | null;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

const Post = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (!slug) return;

    const loadPost = async () => {
      try {
        // Load post data
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            id,
            title,
            slug,
            excerpt,
            content,
            featured_image_url,
            status,
            published_at,
            created_at,
            views_count,
            seo_title,
            seo_description,
            seo_keywords,
            blog_categories:category_id (
              id,
              name,
              slug
            ),
            profiles:author_id (
              full_name,
              avatar_url
            ),
            blog_authors:author_profile_id (
              display_name,
              photo_url,
              bio,
              instagram_url,
              linkedin_url,
              website_url
            ),
            blog_post_tags (
              blog_tags (
                id,
                name,
                slug
              )
            )
          `)
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error) {
          console.error('Error loading post:', error);
          setNotFound(true);
          return;
        }

        const formattedPost = {
          ...data,
          category: data.blog_categories,
          author: data.profiles,
          author_profile: data.blog_authors || null,
          tags: data.blog_post_tags?.map(pt => pt.blog_tags).filter(Boolean) || []
        };

        setPost(formattedPost);

        // Increment view count using RPC for security
        await supabase.rpc('increment_blog_post_views', { p_slug: slug });

        // Load related posts
        if (data.blog_categories?.id) {
          const { data: related } = await supabase
            .from('blog_posts')
            .select(`
              id,
              title,
              slug,
              excerpt,
              featured_image_url,
              published_at,
              created_at,
              blog_categories:category_id (
                id,
                name,
                slug
              ),
              profiles:author_id (
                full_name
              )
            `)
            .eq('category_id', data.blog_categories.id)
            .eq('status', 'published')
            .neq('id', data.id)
            .order('published_at', { ascending: false })
            .limit(3);

          if (related) {
            const formattedRelated = related.map(post => ({
              id: post.id,
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              content: '',
              featured_image_url: post.featured_image_url,
              status: 'published',
              published_at: post.published_at,
              created_at: post.created_at,
              views_count: 0,
              seo_title: null,
              seo_description: null,
              seo_keywords: null,
              category: post.blog_categories,
              author: post.profiles ? { 
                full_name: post.profiles.full_name,
                avatar_url: null 
              } : null,
              author_profile: null,
              tags: []
            }));
            setRelatedPosts(formattedRelated);
          }
        }
      } catch (error) {
        console.error('Error loading post:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  const handleShare = async () => {
    const postUrl = `https://mulheresemconvergencia.com.br/convergindo/${post?.slug}`;
    
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: postUrl,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(postUrl);
      }
    } else {
      navigator.clipboard.writeText(postUrl);
    }
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-8" />
            <div className="aspect-video bg-muted rounded mb-8" />
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-4/6" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (notFound || !post) {
    return <Navigate to="/convergindo" replace />;
  }

  return (
    <Layout>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{post.seo_title || post.title} | Mulheres em Convergência</title>
        <meta name="description" content={post.seo_description || post.excerpt} />
        {post.seo_keywords && (
          <meta name="keywords" content={post.seo_keywords.join(', ')} />
        )}
        
        {/* Open Graph */}
        <meta property="og:title" content={post.seo_title || post.title} />
        <meta property="og:description" content={post.seo_description || post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://mulheresemconvergencia.com.br/convergindo/${post.slug}`} />
        <meta property="og:site_name" content="Mulheres em Converg\u00eancia" />
        {post.featured_image_url ? (
          <>
            <meta property="og:image" content={post.featured_image_url} />
            <meta property="og:image:secure_url" content={post.featured_image_url} />
            <meta property="og:image:type" content="image/jpeg" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={post.title} />
          </>
        ) : (
          <>
            <meta property="og:image" content="https://mulheresemconvergencia.com.br/og-default.jpg" />
            <meta property="og:image:secure_url" content="https://mulheresemconvergencia.com.br/og-default.jpg" />
          </>
        )}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@mulheresemconvergencia" />
        <meta name="twitter:title" content={post.seo_title || post.title} />
        <meta name="twitter:description" content={post.seo_description || post.excerpt} />
        {post.featured_image_url ? (
          <>
            <meta name="twitter:image" content={post.featured_image_url} />
            <meta name="twitter:image:alt" content={post.title} />
          </>
        ) : (
          <meta name="twitter:image" content="https://mulheresemconvergencia.com.br/og-default.jpg" />
        )}
        
        {/* Article specific */}
        <meta property="article:published_time" content={post.published_at} />
        {post.author?.full_name && (
          <meta property="article:author" content={post.author.full_name} />
        )}
        {post.category && (
          <meta property="article:section" content={post.category.name} />
        )}
        {post.tags.map(tag => (
          <meta key={tag.id} property="article:tag" content={tag.name} />
        ))}
        {/* Canonical URL */}
        <link 
          rel="canonical" 
          href={`https://mulheresemconvergencia.com.br/convergindo/${post.slug}`} 
        />
      </Helmet>

      {/* Schema.org structured data */}
      <SchemaOrg post={post} />

      {/* Breadcrumbs */}
      <div className="bg-tertiary/20 py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="flex items-center text-muted-foreground hover:text-primary">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/convergindo" className="text-muted-foreground hover:text-primary">
              Convergindo
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {post.category && (
              <>
                <Link 
                  to={`/convergindo?categoria=${post.category.slug}`}
                  className="text-muted-foreground hover:text-primary"
                >
                  {post.category.name}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
            <span className="font-medium text-secondary line-clamp-1">
              {post.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <article className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Category & Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {post.category && (
                <Badge variant="secondary" className="text-sm">
                  {post.category.name}
                </Badge>
              )}
              <div className="flex items-center text-muted-foreground text-sm gap-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(post.published_at || post.created_at), 'dd \'de\' MMMM \'de\' yyyy', {
                    locale: ptBR,
                  })}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {calculateReadingTime(post.content)} min de leitura
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {post.views_count} visualizações
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary leading-tight mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                {post.excerpt}
              </p>
            )}

            {/* Author & Share */}
            <div className="flex items-center justify-between border-y py-4 mb-8">
              <div className="flex items-center gap-3">
                {(post.author_profile?.photo_url || post.author?.avatar_url) ? (
                  <img
                    src={post.author_profile?.photo_url || post.author?.avatar_url || ''}
                    alt={post.author_profile?.display_name || post.author?.full_name || ''}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">
                    {post.author_profile?.display_name || post.author?.full_name || 'Equipe Editorial'}
                  </p>
                  <p className="text-xs text-muted-foreground">Autora</p>
                </div>
              </div>
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>

            {/* Social Share Buttons (Top) */}
            <div className="mb-8 pb-8 border-b border-border">
              <ShareButtons
                title={post.title}
                url={`https://mulheresemconvergencia.com.br/convergindo/${post.slug}`}
                description={post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 160)}
                imageUrl={post.featured_image_url}
              />
            </div>

            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="aspect-video rounded-lg overflow-hidden mb-8">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-secondary prose-a:text-primary prose-strong:text-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
            />

            {/* Social Share Buttons */}
            <div className="mt-8 pt-8 border-t border-border">
              <ShareButtons
                title={post.title}
                url={`https://mulheresemconvergencia.com.br/convergindo/${post.slug}`}
                description={post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 160)}
                imageUrl={post.featured_image_url}
              />
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
                <span className="text-sm font-medium text-muted-foreground mr-2">Tags:</span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/convergindo?busca=${tag.name}`}
                    className="inline-block"
                  >
                    <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                      #{tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Author Block */}
            {post.author_profile && (
              <AuthorBlock
                displayName={post.author_profile.display_name}
                photoUrl={post.author_profile.photo_url}
                bio={post.author_profile.bio}
                instagramUrl={post.author_profile.instagram_url}
                linkedinUrl={post.author_profile.linkedin_url}
                websiteUrl={post.author_profile.website_url}
              />
            )}

            {/* Comments Section */}
            <div className="mt-10 pt-8 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comentários
              </h2>
              <CommentList postId={post.id} />
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Deixe seu comentário</h3>
                <CommentForm postId={post.id} />
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 bg-tertiary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-secondary mb-8">
                Posts relacionados
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} to={`/convergindo/${relatedPost.slug}`}>
                    <div className="bg-background rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {relatedPost.featured_image_url && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={relatedPost.featured_image_url}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg line-clamp-2 mb-2 hover:text-primary transition-colors">
                          {relatedPost.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {relatedPost.excerpt}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(relatedPost.published_at || relatedPost.created_at), 'dd MMM yyyy', {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default Post;