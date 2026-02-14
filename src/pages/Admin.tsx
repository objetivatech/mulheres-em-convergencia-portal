import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Settings, Users, FileText, Mail, BarChart3, Shield, Wand2, UserCheck, Calendar, DollarSign, TrendingUp, Award, Store, Crown, Clock } from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const Admin = () => {
  const { user, loading, isAdmin, canEditBlog } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin && !canEditBlog) {
    return <Navigate to="/" replace />;
  }

  // Organização por categorias
  const adminCategories = [
    {
      name: '🎯 CRM',
      description: 'Gestão de relacionamento com clientes',
      modules: [
        {
          title: 'Dashboard CRM',
          description: 'Métricas e KPIs de conversão',
          icon: TrendingUp,
          available: isAdmin,
          href: '/admin/crm',
          comingSoon: false
        },
        {
          title: 'Contatos',
          description: 'Gestão unificada de leads e usuários',
          icon: UserCheck,
          available: isAdmin,
          href: '/admin/crm/contatos',
          comingSoon: false
        },
        {
          title: 'Pipeline de Vendas',
          description: 'Kanban de negociações e deals',
          icon: BarChart3,
          available: isAdmin,
          href: '/admin/crm/pipeline',
          comingSoon: false
        },
        {
          title: 'Eventos',
          description: 'Gestão de eventos, inscrições e check-in',
          icon: Calendar,
          available: isAdmin,
          href: '/admin/crm/eventos',
          comingSoon: false
        },
        {
          title: 'Financeiro',
          description: 'Doações e patrocinadores',
          icon: DollarSign,
          available: isAdmin,
          href: '/admin/crm/financeiro',
          comingSoon: false
        },
        {
          title: 'Impacto Social',
          description: 'Métricas de transformação e jornada por CPF',
          icon: Award,
          available: isAdmin,
          href: '/admin/crm/impacto',
          comingSoon: false
        }
      ]
    },
    {
      name: '📊 GERENCIAMENTO',
      description: 'Gestão de usuários, negócios e comunicação',
      modules: [
        {
          title: 'Gestão de Usuários',
          description: 'Gerenciar usuários, permissões e perfis',
          icon: Users,
          available: isAdmin,
          href: '/admin/usuarios',
          comingSoon: false
        },
        {
          title: 'Gestão de Negócios',
          description: 'Consultar, ativar e desativar negócios do diretório',
          icon: Store,
          available: isAdmin,
          href: '/admin/negocios',
          comingSoon: false
        },
        {
          title: 'Jornada do Cliente',
          description: 'Acompanhar e otimizar a jornada dos usuários',
          icon: BarChart3,
          available: isAdmin,
          href: '/admin/jornada-usuario',
          comingSoon: false
        },
        {
          title: 'Newsletter',
          description: 'Gerenciar inscritos e campanhas de email',
          icon: Mail,
          available: isAdmin,
          href: '/admin/newsletter',
          comingSoon: false
        },
        {
          title: 'Gestão de Embaixadoras',
          description: 'Gerenciar programa de embaixadoras e comissões',
          icon: Crown,
          available: isAdmin,
          href: '/admin/embaixadoras',
          comingSoon: false
        }
      ]
    },
    {
      name: '📝 CONTEÚDO',
      description: 'Criação e edição de conteúdo do portal',
      modules: [
        {
          title: 'Editor de Blog',
          description: 'Criar e editar posts do blog Convergindo',
          icon: FileText,
          available: isAdmin || canEditBlog,
          href: '/admin/blog',
          comingSoon: false
        },
        {
          title: 'Page Builder',
          description: 'Criar páginas personalizadas com blocos',
          icon: Wand2,
          available: isAdmin,
          href: '/admin/paginas',
          comingSoon: false
        },
        {
          title: 'Mensagens de Contato',
          description: 'Visualizar e responder mensagens recebidas',
          icon: Mail,
          available: isAdmin,
          href: '/admin/mensagens-contato',
          comingSoon: false
        }
      ]
    },
    {
      name: '🎛️ CONFIGURAÇÃO DO SITE',
      description: 'Configurações gerais e integrações',
      modules: [
        {
          title: 'Navegação e Menus',
          description: 'Gerenciar menus e estrutura de navegação',
          icon: Settings,
          available: isAdmin,
          href: '/admin/navegacao',
          comingSoon: false
        },
        {
          title: 'Configurações Gerais',
          description: 'Configurações do site e SEO',
          icon: Settings,
          available: isAdmin,
          href: '/admin/configuracoes-site',
          comingSoon: false
        },
        {
          title: 'Parceiros e Apoiadores',
          description: 'Gerenciar logos de parceiros exibidos no site',
          icon: Users,
          available: isAdmin,
          href: '/admin/parceiros',
          comingSoon: false
        },
        {
          title: 'Comunidades e Coletivos',
          description: 'Gerenciar comunidades e aprovar solicitações',
          icon: Users,
          available: isAdmin,
          href: '/admin/comunidades',
          comingSoon: false
        },
        {
          title: 'Linha do Tempo',
          description: 'Gerenciar marcos históricos do projeto',
          icon: Clock,
          available: isAdmin,
          href: '/admin/timeline',
          comingSoon: false
        }
      ]
    },
    {
      name: '📈 ANALYTICS',
      description: 'Estatísticas e relatórios',
      modules: [
        {
          title: 'Analytics Geral',
          description: 'Estatísticas de acesso e engajamento',
          icon: BarChart3,
          available: isAdmin,
          href: '/admin/analytics',
          comingSoon: false
        }
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Painel Administrativo - Mulheres em Convergência</title>
        <meta name="description" content="Painel administrativo do portal Mulheres em Convergência" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                    Painel Administrativo
                  </h1>
                  <p className="text-muted-foreground">
                    Bem-vinda, {user.user_metadata?.full_name || user.email}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <Badge variant="default" className="bg-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      Administradora
                    </Badge>
                  )}
                  {canEditBlog && !isAdmin && (
                    <Badge variant="secondary">
                      <FileText className="h-3 w-3 mr-1" />
                      Editora de Blog
                    </Badge>
                  )}
                </div>
              </div>
            </header>


            {/* Módulos Administrativos - Organizados por Categoria */}
            <div className="space-y-8">
              {adminCategories.map((category) => (
                <div key={category.name}>
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-1">{category.name}</h2>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.modules.filter(m => m.icon).map((module) => {
                      const Icon = module.icon;
                      return (
                        <Card 
                          key={module.title} 
                          className={`transition-all hover:shadow-lg ${!module.available ? 'opacity-50' : ''}`}
                        >
                          <CardHeader>
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{module.title}</CardTitle>
                                {module.comingSoon && (
                                  <Badge variant="outline" className="text-xs">
                                    Em Breve
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <CardDescription className="mt-2">
                              {module.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button 
                              variant={module.available ? "default" : "secondary"}
                              className="w-full"
                              disabled={!module.available || module.comingSoon}
                              onClick={() => module.href && navigate(module.href)}
                            >
                              {module.comingSoon ? 'Em Desenvolvimento' : 'Acessar'}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Informações Importantes */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-xl">Informações Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    🚧 Painel em Desenvolvimento
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Os módulos administrativos estão sendo desenvolvidos. Em breve você terá acesso completo 
                    à gestão de conteúdo, usuários e configurações do portal.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    📧 Mensagens de Contato
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    As mensagens do formulário de contato estão sendo enviadas para: {' '}
                    <span className="font-mono bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                      juntas@mulheresemconvergencia.com.br
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SEO & Distribution Tools */}
          {isAdmin && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    SEO & Distribuição
                  </CardTitle>
                  <CardDescription>
                    Links para RSS, Sitemap e outras ferramentas de SEO
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Feed RSS</h4>
                      <p className="text-sm text-muted-foreground">
                        Feed RSS para agregadores e leitores
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open('/rss.xml', '_blank')}
                        >
                          Visualizar RSS
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(`${PRODUCTION_DOMAIN}/rss.xml`)}
                        >
                          Copiar URL
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Sitemap XML</h4>
                      <p className="text-sm text-muted-foreground">
                        Sitemap para otimização em motores de busca
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open('/sitemap.xml', '_blank')}
                        >
                          Visualizar Sitemap
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(`${PRODUCTION_DOMAIN}/sitemap.xml`)}
                        >
                          Copiar URL
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Instruções para SEO</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Envie o sitemap para o Google Search Console</li>
                      <li>• Configure o RSS no MailChimp ou similar para newsletters automáticas</li>
                      <li>• Todos os posts incluem Schema.org para melhor indexação</li>
                      <li>• Meta tags e Open Graph são gerados automaticamente</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </Layout>
    </>
  );
};

export default Admin;