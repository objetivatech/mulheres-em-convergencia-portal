import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { Navigate, useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { 
  Store, 
  User, 
  Crown, 
  Users, 
  Edit3, 
  BarChart3,
  Settings,
  FileText,
  ShoppingCart,
  Heart,
  MessageCircle
} from 'lucide-react';

interface DashboardConfig {
  title: string;
  description: string;
  icon: any;
  color: string;
  modules: Array<{
    title: string;
    description: string;
    icon: any;
    href?: string;
    comingSoon?: boolean;
  }>;
}

const dashboardConfigs: Record<string, DashboardConfig> = {
  associada: {
    title: 'Dashboard Associada',
    description: 'Gerencie seu perfil de negócios e informações empresariais',
    icon: Store,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    modules: [
      {
        title: 'Meu Perfil de Negócios',
        description: 'Editar informações do seu negócio',
        icon: Store,
        comingSoon: true,
      },
      {
        title: 'Estatísticas',
        description: 'Visualizações e contatos do seu negócio',
        icon: BarChart3,
        comingSoon: true,
      },
      {
        title: 'Configurações',
        description: 'Configurações da conta e preferências',
        icon: Settings,
        comingSoon: true,
      },
    ],
  },
  cliente: {
    title: 'Dashboard Cliente',
    description: 'Acompanhe seus pedidos e histórico de compras',
    icon: User,
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    modules: [
      {
        title: 'Meus Pedidos',
        description: 'Histórico de compras e status dos pedidos',
        icon: ShoppingCart,
        comingSoon: true,
      },
      {
        title: 'Favoritos',
        description: 'Produtos e negócios salvos',
        icon: Heart,
        comingSoon: true,
      },
      {
        title: 'Configurações',
        description: 'Dados pessoais e preferências',
        icon: Settings,
        comingSoon: true,
      },
    ],
  },
  embaixadora: {
    title: 'Dashboard Embaixadora',
    description: 'Gerencie sua rede de indicações e ganhos',
    icon: Crown,
    color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    modules: [
      {
        title: 'Minhas Indicações',
        description: 'Acompanhe suas indicações e conversões',
        icon: Users,
        comingSoon: true,
      },
      {
        title: 'Relatórios de Ganhos',
        description: 'Comissões e histórico de pagamentos',
        icon: BarChart3,
        comingSoon: true,
      },
      {
        title: 'Material de Apoio',
        description: 'Links, banners e materiais promocionais',
        icon: FileText,
        comingSoon: true,
      },
    ],
  },
  comunidade: {
    title: 'Dashboard Comunidade',
    description: 'Conecte-se com outros membros e participe de grupos',
    icon: Users,
    color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    modules: [
      {
        title: 'Meus Grupos',
        description: 'Grupos dos quais você participa',
        icon: Users,
        comingSoon: true,
      },
      {
        title: 'Conexões',
        description: 'Suas conexões na comunidade',
        icon: MessageCircle,
        comingSoon: true,
      },
      {
        title: 'Meu Perfil',
        description: 'Editar perfil de membro da comunidade',
        icon: User,
        comingSoon: true,
      },
    ],
  },
  blog: {
    title: 'Dashboard Convergência',
    description: 'Gerencie seus posts no blog Convergindo',
    icon: Edit3,
    color: 'bg-gradient-to-r from-pink-500 to-rose-500',
    modules: [
      {
        title: 'Meus Posts',
        description: 'Posts publicados e rascunhos',
        icon: FileText,
        comingSoon: true,
      },
      {
        title: 'Criar Post',
        description: 'Escrever novo artigo para o blog',
        icon: Edit3,
        comingSoon: true,
      },
      {
        title: 'Estatísticas',
        description: 'Visualizações e engajamento dos posts',
        icon: BarChart3,
        comingSoon: true,
      },
    ],
  },
};

export const Dashboard = () => {
  const { type } = useParams<{ type: string }>();
  const { user, loading } = useAuth();
  const { canAccessDashboard } = useRoles();

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

  if (!type || !dashboardConfigs[type]) {
    return <Navigate to="/" replace />;
  }

  if (!canAccessDashboard(type)) {
    return <Navigate to="/" replace />;
  }

  const config = dashboardConfigs[type];
  const Icon = config.icon;

  return (
    <>
      <Helmet>
        <title>{config.title} - Mulheres em Convergência</title>
        <meta name="description" content={config.description} />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/dashboard/${type}`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`p-3 rounded-xl ${config.color} text-white`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {config.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {user.user_metadata?.full_name || user.email}
                </Badge>
              </div>
            </header>

            {/* Status */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Status da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="h-3 w-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Conta Ativa</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="h-3 w-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Acesso Liberado</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="h-3 w-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Perfil Completo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Módulos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {config.modules.map((module) => {
                const ModuleIcon = module.icon;
                return (
                  <Card 
                    key={module.title} 
                    className="transition-all hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ModuleIcon className="h-5 w-5 text-primary" />
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
                        variant={module.comingSoon ? "secondary" : "default"}
                        className="w-full"
                        disabled={module.comingSoon}
                      >
                        {module.comingSoon ? 'Em Desenvolvimento' : 'Acessar'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Informações */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Importantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    🚧 Dashboard em Desenvolvimento
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    As funcionalidades específicas do seu dashboard estão sendo desenvolvidas. 
                    Em breve você terá acesso completo a todas as ferramentas disponíveis para seu perfil.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </Layout>
    </>
  );
};