import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, User, ChevronRight, Home } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featured_image_url: string | null;
  status?: string;
  published_at: string;
  created_at: string;
  views_count: number;
  seo_title?: string | null;
  seo_description?: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  author: {
    full_name?: string;
    display_name?: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const POSTS_PER_PAGE = 9;

const Convergindo = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial filters from URL
  useEffect(() => {
    const category = searchParams.get('categoria') || 'all';
    const search = searchParams.get('busca') || '';
    setSelectedCategory(category);
    setSearchTerm(search);
  }, [searchParams]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await supabase
          .from('blog_categories')
          .select('id, name, slug')
          .order('name');
        
        if (data) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Load posts
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('blog_posts')
          .select(`
            id,
            title,
            slug,
            excerpt,
            featured_image_url,
            published_at,
            created_at,
            views_count,
            seo_title,
            seo_description,
            blog_categories:category_id (
              id,
              name,
              slug
            ),
            profiles:author_id (
              full_name
            ),
            blog_authors:author_profile_id (
              display_name
            ),
            blog_post_tags (
              blog_tags (
                id,
                name,
                slug
              )
            )
          `)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(POSTS_PER_PAGE);

        // Apply category filter
        if (selectedCategory !== 'all') {
          const categoryData = categories.find(cat => cat.slug === selectedCategory);
          if (categoryData) {
            query = query.eq('category_id', categoryData.id);
          }
        }

        // Apply search filter
        if (searchTerm.trim()) {
          query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        const formattedPosts = data?.map(post => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          featured_image_url: post.featured_image_url,
          published_at: post.published_at,
          created_at: post.created_at,
          views_count: post.views_count,
          seo_title: post.seo_title,
          seo_description: post.seo_description,
          category: post.blog_categories,
          author: post.blog_authors || post.profiles,
          tags: post.blog_post_tags?.map(pt => pt.blog_tags).filter(Boolean) || []
        })) || [];

        setPosts(formattedPosts);
        setHasMore(formattedPosts.length === POSTS_PER_PAGE);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [selectedCategory, searchTerm, categories]);

  const loadMorePosts = async () => {
    setLoadingMore(true);
    try {
      let query = supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image_url,
          published_at,
          created_at,
          views_count,
          seo_title,
          seo_description,
            blog_categories:category_id (
              id,
              name,
              slug
            ),
            profiles:author_id (
              full_name
            ),
            blog_authors:author_profile_id (
              display_name
            ),
            blog_post_tags (
              blog_tags (
                id,
                name,
                slug
              )
            )
          `)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .range(posts.length, posts.length + POSTS_PER_PAGE - 1);

      // Apply filters
      if (selectedCategory !== 'all') {
        const categoryData = categories.find(cat => cat.slug === selectedCategory);
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedPosts = data?.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featured_image_url: post.featured_image_url,
        published_at: post.published_at,
        created_at: post.created_at,
        views_count: post.views_count,
        seo_title: post.seo_title,
        seo_description: post.seo_description,
        category: post.blog_categories,
        author: post.blog_authors || post.profiles,
        tags: post.blog_post_tags?.map(pt => pt.blog_tags).filter(Boolean) || []
      })) || [];

      setPosts(prev => [...prev, ...formattedPosts]);
      setHasMore(formattedPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setTimeout(updateUrlParams, 0);
  };

  const updateUrlParams = () => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('categoria', selectedCategory);
    if (searchTerm.trim()) params.set('busca', searchTerm);
    setSearchParams(params);
  };

  return (
    <Layout>
      <Helmet>
        <title>Blog Convergindo | Mulheres em Convergência</title>
        <meta name="description" content="Artigos sobre empreendedorismo feminino, networking, economia criativa e histórias de mulheres que fazem acontecer." />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/convergindo`} />
        <meta property="og:title" content="Blog Convergindo | Mulheres em Convergência" />
        <meta property="og:description" content="Artigos sobre empreendedorismo feminino, networking e histórias de mulheres que fazem acontecer." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${PRODUCTION_DOMAIN}/convergindo`} />
      </Helmet>
      {/* Breadcrumbs */}
      <div className="bg-tertiary/20 py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="flex items-center text-muted-foreground hover:text-primary">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-secondary">Convergindo</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-tertiary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-4">
            Convergindo
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Conteúdos que inspiram, conectam e impulsionam o empreendedorismo feminino
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="outline">
                Buscar
              </Button>
            </form>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted rounded-t-lg" />
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                      <div className="h-3 bg-muted rounded w-4/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold text-secondary mb-4">
                Nenhum post encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Tente ajustar os filtros ou fazer uma nova busca.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSearchParams({});
                }}
                variant="outline"
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Link key={post.id} to={`/convergindo/${post.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
                      {post.featured_image_url && (
                        <div className="aspect-video overflow-hidden rounded-t-lg">
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          {post.category && (
                            <Badge variant="secondary" className="text-xs">
                              {post.category.name}
                            </Badge>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(post.published_at || post.created_at), 'dd MMM yyyy', {
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            {post.author?.display_name || post.author?.full_name || 'Admin'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {post.views_count} visualizações
                          </div>
                        </div>
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-12">
                  <Button
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                    variant="outline"
                    size="lg"
                  >
                    {loadingMore ? 'Carregando...' : 'Carregar mais posts'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Convergindo;