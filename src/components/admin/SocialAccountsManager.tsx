import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Linkedin, Facebook, Instagram, Globe, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_email: string | null;
  is_active: boolean;
  token_expires_at: string;
  created_at: string;
}

const platformIcons = {
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  pinterest: Globe,
};

const platformNames = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  pinterest: 'Pinterest',
};

export function SocialAccountsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SocialAccount[];
    },
  });

  // Monitorar parâmetros da URL para capturar o callback do LinkedIn
  useEffect(() => {
    console.log('🔍 useEffect executando - verificando URL params');
    console.log('📍 URL atual:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const linkedinCode = urlParams.get('linkedin_code');
    const linkedinState = urlParams.get('linkedin_state');
    const linkedinError = urlParams.get('linkedin_error');

    console.log('📝 Parâmetros capturados:', { 
      linkedinCode: linkedinCode ? 'presente' : 'ausente',
      linkedinState: linkedinState ? 'presente' : 'ausente', 
      linkedinError 
    });

    if (linkedinError) {
      console.log('❌ Erro do LinkedIn recebido:', linkedinError);
      toast({
        title: 'Erro ao conectar LinkedIn',
        description: linkedinError,
        variant: 'destructive',
      });
      // Limpar parâmetros da URL
      window.history.replaceState({}, '', '/admin/redes-sociais');
      setConnectingPlatform(null);
      return;
    }

    if (linkedinCode && linkedinState) {
      console.log('✅ LinkedIn authorization code received from URL');
      setConnectingPlatform('linkedin');
      handleLinkedInCallback(linkedinCode);
    }
  }, [toast]);

  const handleLinkedInCallback = async (code: string) => {
    try {
      console.log('🔄 Processing LinkedIn callback with code');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Erro',
          description: 'Sessão expirada. Por favor, faça login novamente.',
          variant: 'destructive',
        });
        return;
      }

      console.log('📞 Calling /connect endpoint...');
      const connectResponse = await fetch(
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

      console.log('📡 Connect response status:', connectResponse.status);

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json();
        console.error('❌ Connect error:', errorData);
        throw new Error(errorData.error || 'Falha ao conectar conta LinkedIn');
      }

      const result = await connectResponse.json();
      console.log('✅ Connection successful:', result);
      
      toast({
        title: 'LinkedIn conectado',
        description: 'Sua conta do LinkedIn foi conectada com sucesso',
      });
      
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      
      // Limpar parâmetros da URL
      window.history.replaceState({}, '', '/admin/redes-sociais');
    } catch (error) {
      console.error('❌ Error in LinkedIn callback:', error);
      toast({
        title: 'Erro ao conectar LinkedIn',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const connectLinkedIn = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      console.log('🚀 Starting LinkedIn connection...');
      
      // Chamar o endpoint /authorize para obter a URL de autorização
      console.log('📞 Calling /authorize endpoint...');
      const response = await fetch(
        'https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/social-oauth-linkedin/authorize',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao obter URL de autorização');
      }

      const { authUrl } = await response.json();
      console.log('✅ Got auth URL, redirecting...');

      // Redirecionar para a URL de autorização do LinkedIn
      // O callback retornará para esta mesma página com os parâmetros na URL
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao conectar LinkedIn',
        description: error.message,
        variant: 'destructive',
      });
      setConnectingPlatform(null);
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Conta desconectada',
        description: 'A conta foi removida com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      setAccountToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao desconectar conta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleConnectPlatform = (platform: string) => {
    setConnectingPlatform(platform);
    
    if (platform === 'linkedin') {
      connectLinkedIn.mutate();
    } else {
      toast({
        title: 'Em breve',
        description: `A integração com ${platformNames[platform as keyof typeof platformNames]} estará disponível em breve`,
      });
      setConnectingPlatform(null);
    }
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const connectedPlatforms = accounts?.map(acc => acc.platform) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conectar Redes Sociais</CardTitle>
          <CardDescription>
            Conecte suas contas de redes sociais para começar a publicar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(platformNames).map(([key, name]) => {
              const Icon = platformIcons[key as keyof typeof platformIcons];
              const isConnected = connectedPlatforms.includes(key);
              const isConnecting = connectingPlatform === key;

              return (
                <Button
                  key={key}
                  variant={isConnected ? 'outline' : 'default'}
                  className="h-20"
                  onClick={() => !isConnected && handleConnectPlatform(key)}
                  disabled={isConnected || isConnecting}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {isConnecting ? 'Conectando...' : isConnected ? `${name} Conectado` : `Conectar ${name}`}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {accounts && accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contas Conectadas</CardTitle>
            <CardDescription>
              Gerencie suas contas de redes sociais conectadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.map((account) => {
                const Icon = platformIcons[account.platform as keyof typeof platformIcons];
                const expired = isTokenExpired(account.token_expires_at);

                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.account_name}</p>
                          {expired ? (
                            <Badge variant="destructive">Expirado</Badge>
                          ) : (
                            <Badge variant="default">Ativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {platformNames[account.platform as keyof typeof platformNames]}
                          {account.account_email && ` • ${account.account_email}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Conectado em {new Date(account.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnectPlatform(account.platform)}
                        >
                          Reconectar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAccountToDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!accountToDelete} onOpenChange={() => setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja desconectar esta conta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => accountToDelete && deleteAccount.mutate(accountToDelete)}
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
