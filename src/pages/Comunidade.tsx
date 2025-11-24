import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Building2, MapPin, Eye, TrendingUp, ArrowLeft } from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

interface CommunityDetails {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  total_businesses: number;
  categories_represented: string[];
  total_views: number;
}

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  state: string;
  logo_url: string;
  slug: string;
}

const Comunidade = () => {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<CommunityDetails | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCommunityDetails();
      fetchCommunityBusinesses();
    }
  }, [id]);

  const fetchCommunityDetails = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_community_details', { community_uuid: id }) as { data: CommunityDetails[] | null, error: any };

      if (error) throw error;

      if (data && Array.isArray(data) && data.length > 0) {
        setCommunity(data[0]);
      }
    } catch (error) {
      console.error('Error fetching community details:', error);
    }
  };

  const fetchCommunityBusinesses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, description, category, city, state, logo_url, slug')
        .eq('community_id', id)
        .eq('subscription_active', true)
        .order('name');

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!community) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Comunidade não encontrada</h1>
          <Button asChild>
            <Link to="/diretorio">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Diretório
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{community.name} - Mulheres em Convergência</title>
        <meta 
          name="description" 
          content={community.description || `Conheça as empresárias da comunidade ${community.name}`} 
        />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/comunidade/${id}`} />
        <meta property="og:title" content={`${community.name} - Mulheres em Convergência`} />
        <meta 
          property="og:description" 
          content={community.description || `Conheça as empresárias da comunidade ${community.name}`} 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${PRODUCTION_DOMAIN}/comunidade/${id}`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/diretorio">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Diretório
              </Link>
            </Button>
          </div>

          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                {community.name}
              </h1>
              <Badge className="bg-purple-600 text-white">
                Comunidade
              </Badge>
            </div>

            {community.description && (
              <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
                {community.description}
              </p>
            )}

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{community.total_businesses}</p>
                      <p className="text-sm text-muted-foreground">Negócios</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {community.categories_represented?.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Categorias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Eye className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {community.total_views?.toLocaleString('pt-BR') || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Visualizações</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {new Set(businesses.map(b => b.state)).size}
                      </p>
                      <p className="text-sm text-muted-foreground">Estados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lista de Negócios */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Negócios da Comunidade ({businesses.length})
            </h2>

            {businesses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum negócio cadastrado nesta comunidade ainda.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <Link key={business.id} to={`/diretorio/${business.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          {business.logo_url ? (
                            <img
                              src={business.logo_url}
                              alt={business.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 truncate">
                              {business.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {business.category}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {business.description}
                        </p>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {business.city}, {business.state}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </Layout>
    </>
  );
};

export default Comunidade;
