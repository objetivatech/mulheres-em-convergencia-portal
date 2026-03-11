import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Navigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { SocioeconomicForm } from '@/components/user/SocioeconomicForm';
import { ProfileEditForm } from '@/components/user/ProfileEditForm';
import {
  LayoutDashboard,
  User,
  ClipboardList,
  Store,
  Crown,
  Network,
  GraduationCap,
  CreditCard,
  Settings,
  Eye,
  Mail,
  BarChart3,
  Shield,
  Users,
  Edit3,
  FileText,
  ExternalLink,
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
  slug: string;
  subscription_active: boolean;
  views_count: number;
  clicks_count: number;
  contacts_count: number;
}

const roleBadgeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  admin: { label: 'Administradora', variant: 'destructive' },
  business_owner: { label: 'Associada', variant: 'default' },
  ambassador: { label: 'Embaixadora', variant: 'secondary' },
  student: { label: 'Aluna Academy', variant: 'secondary' },
  blog_editor: { label: 'Editora Blog', variant: 'outline' },
  subscriber: { label: 'Newsletter', variant: 'outline' },
  community_member: { label: 'Membro', variant: 'outline' },
};

export const UserDashboard = () => {
  const { user, loading: authLoading, canEditBlog } = useAuth();
  const { roles, isAdmin, isBusinessOwner, isAmbassador, isStudent, isBlogEditor, isLoading: rolesLoading } = useUserRoles();
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setLoadingData(true);
    try {
      const [subRes, profileRes, bizRes] = await Promise.all([
        supabase
          .from('user_subscriptions')
          .select('*, subscription_plans(display_name, name)')
          .eq('user_id', user!.id)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user!.id)
          .single(),
        supabase
          .from('businesses')
          .select('id, name, slug, subscription_active, views_count, clicks_count, contacts_count')
          .eq('owner_id', user!.id)
          .maybeSingle(),
      ]);

      setUserSubscription(subRes.data);
      setProfile(profileRes.data);
      setBusinessProfile(bizRes.data);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (authLoading || loadingData || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email;
  const initials = (displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  // Build visible roles for badges (filter out common ones for cleaner display)
  const displayRoles = roles.filter(r => r !== 'community_member' && r !== 'customer');

  return (
    <>
      <Helmet>
        <title>Meu Painel - Mulheres em Convergência</title>
        <meta name="description" content="Painel pessoal com suas funcionalidades e acessos" />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 p-6 rounded-xl bg-card border">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {displayRoles.map(role => {
                    const config = roleBadgeConfig[role];
                    if (!config) return null;
                    return (
                      <Badge key={role} variant={config.variant} className="text-xs">
                        {config.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/configuracoes/conta"><Settings className="h-4 w-4 mr-1" /> Configurações</Link>
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="visao-geral" className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                <TabsTrigger value="visao-geral" className="text-xs sm:text-sm">
                  <LayoutDashboard className="h-4 w-4 mr-1" /> Visão Geral
                </TabsTrigger>
                <TabsTrigger value="meus-dados" className="text-xs sm:text-sm">
                  <User className="h-4 w-4 mr-1" /> Meus Dados
                </TabsTrigger>
                <TabsTrigger value="socioeconomico" className="text-xs sm:text-sm">
                  <ClipboardList className="h-4 w-4 mr-1" /> Socioeconômico
                </TabsTrigger>
                {isBusinessOwner && (
                  <TabsTrigger value="meu-negocio" className="text-xs sm:text-sm">
                    <Store className="h-4 w-4 mr-1" /> Meu Negócio
                  </TabsTrigger>
                )}
                {isAmbassador && (
                  <TabsTrigger value="embaixadora" className="text-xs sm:text-sm">
                    <Crown className="h-4 w-4 mr-1" /> Embaixadora
                  </TabsTrigger>
                )}
                <TabsTrigger value="conecta" className="text-xs sm:text-sm">
                  <Network className="h-4 w-4 mr-1" /> CONECTA+
                </TabsTrigger>
                {(isStudent || isBusinessOwner || isAmbassador || isAdmin) && (
                  <TabsTrigger value="academy" className="text-xs sm:text-sm">
                    <GraduationCap className="h-4 w-4 mr-1" /> Academy
                  </TabsTrigger>
                )}
                {(isBlogEditor || canEditBlog) && (
                  <TabsTrigger value="blog" className="text-xs sm:text-sm">
                    <Edit3 className="h-4 w-4 mr-1" /> Blog
                  </TabsTrigger>
                )}
                {userSubscription && (
                  <TabsTrigger value="assinatura" className="text-xs sm:text-sm">
                    <CreditCard className="h-4 w-4 mr-1" /> Assinatura
                  </TabsTrigger>
                )}
              </TabsList>

              {/* ====== VISÃO GERAL ====== */}
              <TabsContent value="visao-geral" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <QuickCard icon={User} title="Meus Dados" desc="Editar perfil e contatos" href="/configuracoes/dados-pessoais" />
                  <QuickCard icon={Network} title="CONECTA+" desc="Acessar networking" href="/conecta" />
                  {isBusinessOwner && businessProfile && (
                    <QuickCard icon={Store} title={businessProfile.name} desc={`${businessProfile.views_count || 0} visualizações`} href="/painel-empresa" />
                  )}
                  {isAmbassador && (
                    <QuickCard icon={Crown} title="Painel Embaixadora" desc="Indicações e comissões" href="/painel/embaixadora" />
                  )}
                  {(isStudent || isBusinessOwner || isAdmin) && (
                    <QuickCard icon={GraduationCap} title="MeC Academy" desc="Cursos e conteúdos" href="/academy" />
                  )}
                  {isAdmin && (
                    <QuickCard icon={Shield} title="Administração" desc="Painel administrativo" href="/admin" />
                  )}
                </div>

                {/* Quick Stats */}
                {businessProfile && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Estatísticas do Negócio</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-primary">{businessProfile.views_count}</p>
                          <p className="text-xs text-muted-foreground">Visualizações</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">{businessProfile.clicks_count}</p>
                          <p className="text-xs text-muted-foreground">Cliques</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">{businessProfile.contacts_count}</p>
                          <p className="text-xs text-muted-foreground">Contatos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ====== MEUS DADOS ====== */}
              <TabsContent value="meus-dados" className="mt-6">
                <ProfileEditForm profile={profile} onProfileUpdated={loadUserData} />
              </TabsContent>

              {/* ====== SOCIOECONÔMICO ====== */}
              <TabsContent value="socioeconomico" className="mt-6">
                <SocioeconomicForm />
              </TabsContent>

              {/* ====== MEU NEGÓCIO ====== */}
              {isBusinessOwner && (
                <TabsContent value="meu-negocio" className="mt-6 space-y-4">
                  {businessProfile ? (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>{businessProfile.name}</CardTitle>
                          <CardDescription>
                            Status: {businessProfile.subscription_active ? 
                              <Badge variant="default">Ativa</Badge> : 
                              <Badge variant="outline">Inativa</Badge>}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-3 gap-4 text-center mb-4">
                            <div><p className="text-xl font-bold">{businessProfile.views_count || 0}</p><p className="text-xs text-muted-foreground">Visualizações</p></div>
                            <div><p className="text-xl font-bold">{businessProfile.clicks_count || 0}</p><p className="text-xs text-muted-foreground">Cliques</p></div>
                            <div><p className="text-xl font-bold">{businessProfile.contacts_count || 0}</p><p className="text-xs text-muted-foreground">Contatos</p></div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button asChild><Link to="/painel-empresa"><Store className="h-4 w-4 mr-1" /> Gerenciar Negócio</Link></Button>
                            <Button variant="outline" asChild><Link to={`/diretorio/${businessProfile.slug}`}><ExternalLink className="h-4 w-4 mr-1" /> Ver Página</Link></Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">Você ainda não cadastrou um negócio</p>
                        <Button asChild><Link to="/dashboard/empresa">Cadastrar Negócio</Link></Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              )}

              {/* ====== EMBAIXADORA ====== */}
              {isAmbassador && (
                <TabsContent value="embaixadora" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Painel da Embaixadora</CardTitle>
                      <CardDescription>Acompanhe suas indicações, comissões e materiais</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button asChild><Link to="/embaixadora"><Crown className="h-4 w-4 mr-1" /> Acessar Painel Completo</Link></Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* ====== CONECTA+ ====== */}
              <TabsContent value="conecta" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CONECTA+</CardTitle>
                    <CardDescription>
                      {isBusinessOwner || isAdmin
                        ? 'Você tem acesso completo como membro do CONECTA+'
                        : 'Você tem acesso como convidada. Torne-se associada para acesso completo!'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild><Link to="/conecta"><Network className="h-4 w-4 mr-1" /> Acessar CONECTA+</Link></Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ====== ACADEMY ====== */}
              {(isStudent || isBusinessOwner || isAmbassador || isAdmin) && (
                <TabsContent value="academy" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>MeC Academy</CardTitle>
                      <CardDescription>Cursos, aulas e conteúdos exclusivos para sua capacitação</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild><Link to="/academy"><GraduationCap className="h-4 w-4 mr-1" /> Acessar Academy</Link></Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* ====== BLOG ====== */}
              {(isBlogEditor || canEditBlog) && (
                <TabsContent value="blog" className="mt-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gerenciamento do Blog</CardTitle>
                      <CardDescription>Crie e gerencie artigos no blog</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2 flex-wrap">
                      <Button asChild><Link to="/admin/blog"><Edit3 className="h-4 w-4 mr-1" /> Meus Artigos</Link></Button>
                      <Button variant="outline" asChild><Link to="/admin/blog/novo"><FileText className="h-4 w-4 mr-1" /> Criar Post</Link></Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* ====== ASSINATURA ====== */}
              {userSubscription && (
                <TabsContent value="assinatura" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Minha Assinatura</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoItem label="Plano" value={userSubscription.subscription_plans?.display_name} />
                        <InfoItem label="Status" value={userSubscription.status === 'active' ? 'Ativa' : userSubscription.status} />
                        <InfoItem label="Ciclo" value={userSubscription.billing_cycle} />
                        {userSubscription.expires_at && (
                          <InfoItem label="Expira em" value={new Date(userSubscription.expires_at).toLocaleDateString('pt-BR')} />
                        )}
                      </div>
                      <Button variant="outline" asChild><Link to="/planos">Gerenciar Assinatura</Link></Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </Layout>
    </>
  );
};

// Helper components
const QuickCard = ({ icon: Icon, title, desc, href }: { icon: any; title: string; desc: string; href: string }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <Link to={href} className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{desc}</p>
        </div>
      </Link>
    </CardContent>
  </Card>
);

const InfoItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-medium text-sm">{value || '—'}</p>
  </div>
);
