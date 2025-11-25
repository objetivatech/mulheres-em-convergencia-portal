import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialAccountsManager } from '@/components/admin/SocialAccountsManager';
import { SocialPostComposer } from '@/components/admin/SocialPostComposer';
import { SocialPostHistory } from '@/components/admin/SocialPostHistory';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const AdminSocialMedia = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingCallback, setProcessingCallback] = useState(false);

  // Processar callback do LinkedIn ANTES de renderizar as abas
  useEffect(() => {
    console.log('🔍 AdminSocialMedia - Verificando callback do LinkedIn');
    console.log('📍 URL:', window.location.href);
    console.log('📍 location.search:', location.search);
    
    const urlParams = new URLSearchParams(location.search);
    const linkedinCode = urlParams.get('linkedin_code');
    const linkedinState = urlParams.get('linkedin_state');
    const linkedinError = urlParams.get('linkedin_error');

    console.log('📝 Parâmetros:', { 
      code: linkedinCode ? 'presente' : 'ausente',
      state: linkedinState ? 'presente' : 'ausente',
      error: linkedinError 
    });

    if (linkedinError) {
      console.log('❌ Erro do LinkedIn:', linkedinError);
      toast({
        title: 'Erro ao conectar LinkedIn',
        description: linkedinError,
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/admin/redes-sociais');
      return;
    }

    if (linkedinCode && linkedinState && !processingCallback) {
      console.log('✅ Processando callback do LinkedIn...');
      setProcessingCallback(true);
      handleLinkedInCallback(linkedinCode);
    }
  }, [location.search]);

  const handleLinkedInCallback = async (code: string) => {
    try {
      console.log('🔄 Chamando /connect com o código');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Erro',
          description: 'Sessão expirada. Por favor, faça login novamente.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        'https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/social-oauth-linkedin/connect',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code }),
        }
      );

      console.log('📡 Resposta do /connect:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro ao conectar:', errorData);
        throw new Error(errorData.error || 'Falha ao conectar conta LinkedIn');
      }

      const result = await response.json();
      console.log('✅ LinkedIn conectado com sucesso!', result);
      
      toast({
        title: 'LinkedIn conectado',
        description: 'Sua conta do LinkedIn foi conectada com sucesso',
      });
      
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      
      // Limpar parâmetros da URL
      window.history.replaceState({}, '', '/admin/redes-sociais');
    } catch (error) {
      console.error('❌ Erro no callback:', error);
      toast({
        title: 'Erro ao conectar LinkedIn',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setProcessingCallback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Gestão de Redes Sociais - Mulheres em Convergência</title>
        <meta name="description" content="Gerencie suas publicações em redes sociais" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/social-media`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Gestão de Redes Sociais
              </h1>
              <p className="text-muted-foreground">
                Conecte suas contas, publique e agende posts nas redes sociais
              </p>
            </header>

            <Tabs defaultValue="accounts" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="accounts">Contas</TabsTrigger>
                <TabsTrigger value="compose">Criar Post</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="accounts" className="space-y-4">
                <SocialAccountsManager />
              </TabsContent>

              <TabsContent value="compose" className="space-y-4">
                <SocialPostComposer />
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <SocialPostHistory />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default AdminSocialMedia;
