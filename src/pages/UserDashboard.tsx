import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Settings, 
  Store,
  ShoppingBag,
  Crown,
  Users,
  Edit3,
  BarChart3,
  FileText,
  Heart,
  MessageCircle,
  CreditCard,
  Eye,
  Calendar,
  Mail
} from 'lucide-react';

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  expires_at: string | null;
  subscription_plans: {
    display_name: string;
    name: string;
  };
}

interface BusinessProfile {
  id: string;
  name: string;
  subscription_active: boolean;
  views_count: number;
  clicks_count: number;
  contacts_count: number;
}

export const UserDashboard = () => {
  const { user, loading, canEditBlog } = useAuth();
  const { hasRole } = useRoles();
  const { toast } = useToast();
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoadingData(true);
    try {
      // Load subscription data
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(display_name, name)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();

      setUserSubscription(subscription);

      // Load business profile if user is an associate
      if (hasRole('business_owner')) {
        const { data: business } = await supabase
          .from('businesses')
          .select('id, name, subscription_active, views_count, clicks_count, contacts_count')
          .eq('owner_id', user!.id)
          .maybeSingle();

        setBusinessProfile(business);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Available modules based on user roles and subscriptions
  const modules = [];

  // Profile management (always available)
  modules.push({
    category: 'Perfil',
    items: [
      {
        title: 'Configurações da Conta',
        description: 'Editar dados pessoais e preferências',  
        icon: Settings,
        href: '/configuracoes/conta',
        available: true,
      },
      {
        title: 'Dados Pessoais',
        description: 'Atualizar CPF, telefone e endereço',
        icon: User,
        href: '/configuracoes/dados-pessoais',
        available: true,
      }
    ]
  });

  // Business management (for associates)
  if (hasRole('business_owner')) {
    modules.push({
      category: 'Negócios',
      items: [
        {
          title: 'Meu Negócio',
          description: businessProfile ? `Gerenciar ${businessProfile.name}` : 'Cadastrar negócio',
          icon: Store,
          href: '/dashboard/empresa',
          available: true,
        },
        {
          title: 'Estatísticas',
          description: businessProfile ? 
            `${businessProfile.views_count} visualizações este mês` : 
            'Ver métricas do negócio',
          icon: BarChart3,
          href: '/estatisticas',
          available: !!businessProfile,
        },
        {
          title: 'Assinatura',
          description: userSubscription ? 
            `Plano ${userSubscription.subscription_plans?.display_name}` : 
            'Gerenciar assinatura',
          icon: CreditCard,
          href: '/planos',
          available: true,
        }
      ]
    });
  }

  // Client features
  if (hasRole('customer')) {
    modules.push({
      category: 'Loja',
      items: [
        {
          title: 'Meus Pedidos',
          description: 'Histórico de compras e entregas',
          icon: ShoppingBag,
          href: '/meus-pedidos',
          available: false, // Coming soon
        },
        {
          title: 'Lista de Desejos',
          description: 'Produtos salvos para comprar depois',
          icon: Heart,
          href: '/favoritos',
          available: false, // Coming soon
        }
      ]
    });
  }

  // Ambassador features
  if (hasRole('ambassador')) {
    modules.push({
      category: 'Embaixadora',
      items: [
        {
          title: 'Minhas Indicações',
          description: 'Acompanhar conversões e ganhos',
          icon: Crown,
          href: '/indicacoes',
          available: false, // Coming soon
        },
        {
          title: 'Material Promocional',
          description: 'Links e banners para divulgação',
          icon: FileText,
          href: '/material-promocional',
          available: false, // Coming soon
        }
      ]
    });
  }

  // Community features
  if (hasRole('community_member')) {
    modules.push({
      category: 'Comunidade',
      items: [
        {
          title: 'Meus Grupos',
          description: 'Participar de discussões e eventos',
          icon: Users,
          href: '/grupos',
          available: false, // Coming soon
        },
        {
          title: 'Mensagens',
          description: 'Conversar com outros membros',
          icon: MessageCircle,
          href: '/mensagens',
          available: false, // Coming soon
        }
      ]
    });
  }

  // Blog features - usando blog_editor ou canEditBlog para edição de blog
  if (hasRole('blog_editor') || canEditBlog) {
    modules.push({
      category: 'Blog',
      items: [
        {
          title: 'Meus Artigos',
          description: 'Gerenciar posts publicados',
          icon: Edit3,
          href: '/admin/blog',
          available: true,
        },
        {
          title: 'Criar Post',
          description: 'Escrever novo artigo',
          icon: FileText,
          href: '/admin/blog/novo',
          available: true,
        }
      ]
    });
  }

  return (
    <>
      <Helmet>
        <title>Meu Dashboard - Mulheres em Convergência</title>
        <meta name="description" content="Painel pessoal com suas funcionalidades e acessos" />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Welcome Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Bem-vinda, {user.user_metadata?.full_name || user.email}!
              </h1>
              <p className="text-muted-foreground">
                Gerencie todos os seus acessos e funcionalidades da plataforma
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Conta Ativa</span>
                  </div>
                </CardContent>
              </Card>
              
              {userSubscription && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {userSubscription.subscription_plans?.display_name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {businessProfile && (
                <>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">
                          {businessProfile.views_count} visualizações
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">
                          {businessProfile.contacts_count} contatos
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Modules by Category */}
            {modules.map((moduleGroup, groupIndex) => (
              <div key={moduleGroup.category} className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                  <span>{moduleGroup.category}</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moduleGroup.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Card 
                        key={item.title}
                        className={`transition-all hover:shadow-lg ${
                          item.available ? 'cursor-pointer' : 'opacity-60'
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              item.available ? 'bg-primary/10' : 'bg-muted'
                            }`}>
                              <Icon className={`h-5 w-5 ${
                                item.available ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                              {!item.available && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Em Breve
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <CardDescription className="mb-4">
                            {item.description}
                          </CardDescription>
                          
                          <Button 
                            variant={item.available ? "default" : "secondary"}
                            size="sm"
                            className="w-full"
                            disabled={!item.available}
                            onClick={() => item.available && item.href && (window.location.href = item.href)}
                          >
                            {item.available ? 'Acessar' : 'Em Desenvolvimento'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {groupIndex < modules.length - 1 && <Separator className="mt-8" />}
              </div>
            ))}

            {/* Help Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Precisa de Ajuda?</CardTitle>
                <CardDescription>
                  Entre em contato conosco se tiver dúvidas sobre alguma funcionalidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href="/contato">Falar Conosco</a>
                </Button>
              </CardContent>
            </Card>

          </div>
        </main>
      </Layout>
    </>
  );
};