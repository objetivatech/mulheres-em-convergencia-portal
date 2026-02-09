import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

interface Community {
  id: string;
  name: string;
  description: string | null;
  business_count: number;
}

const Comunidades = () => {
  const { data: communities, isLoading } = useQuery({
    queryKey: ['public-communities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          id,
          name,
          description,
          businesses:businesses(count)
        `)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        business_count: Array.isArray(c.businesses) ? c.businesses.length : 0
      })) as Community[];
    }
  });

  return (
    <>
      <Helmet>
        <title>Comunidades e Coletivos - Mulheres em Convergência</title>
        <meta 
          name="description" 
          content="Conheça as comunidades e coletivos de mulheres empreendedoras cadastradas em nosso portal" 
        />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/comunidades`} />
        <meta property="og:title" content="Comunidades e Coletivos - Mulheres em Convergência" />
        <meta property="og:description" content="Conheça as comunidades e coletivos de mulheres empreendedoras." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${PRODUCTION_DOMAIN}/comunidades`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Comunidades e Coletivos
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Descubra e conecte-se com comunidades de mulheres empreendedoras. 
                Cada comunidade representa um grupo de negócios unidos por valores e objetivos comuns.
              </p>
            </header>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Communities Grid */}
            {!isLoading && communities && communities.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.map((community) => (
                  <Link 
                    key={community.id} 
                    to={`/comunidade/${community.id}`}
                    className="group"
                  >
                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {community.business_count}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {community.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {community.description || 'Comunidade de mulheres empreendedoras'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <span className="text-sm text-primary font-medium group-hover:underline">
                          Ver negócios →
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && (!communities || communities.length === 0) && (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma comunidade encontrada</h3>
                  <p className="text-muted-foreground">
                    Em breve teremos comunidades cadastradas aqui.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Call to Action */}
            <Card className="mt-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="py-8 text-center">
                <h3 className="text-2xl font-bold mb-3">Sua comunidade não está aqui?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Se você faz parte de uma comunidade ou coletivo de mulheres empreendedoras 
                  e gostaria de vê-la listada aqui, entre em contato conosco.
                </p>
                <Link to="/contato">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Entrar em Contato
                  </button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default Comunidades;
