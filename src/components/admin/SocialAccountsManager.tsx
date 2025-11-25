import { useState } from 'react';
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

  const connectLinkedIn = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Obter URL de autorização
      const response = await fetch(
        'https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/social-oauth-linkedin/authorize',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao obter URL de autorização');
      }

      const data = await response.json();

      // Abrir janela de autorização
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        data.authUrl,
        'linkedin-oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Popup bloqueado pelo navegador');
      }

      // Aguardar mensagem do popup
      return new Promise<string>((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          console.log('📨 Message received:', event.data);
          console.log('📨 Message origin:', event.origin);
          
          if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
            console.log('✅ LinkedIn auth success message received');
            window.removeEventListener('message', messageHandler);
            resolve(event.data.code);
          } else if (event.data.type === 'LINKEDIN_AUTH_ERROR') {
            console.log('❌ LinkedIn auth error message received');
            window.removeEventListener('message', messageHandler);
            reject(new Error(event.data.error));
          }
        };

        console.log('👂 Setting up message listener...');
        window.addEventListener('message', messageHandler);

        // Verificar se a janela foi fechada sem completar
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            reject(new Error('Janela fechada sem completar a autenticação'));
          }
        }, 500);
      });
    },
    onSuccess: async (code) => {
      console.log('✅ LinkedIn auth success, code received:', code);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔑 Session retrieved:', !!session);
        if (!session) throw new Error('Não autenticado');

        console.log('📤 Sending code to edge function...');
        // Enviar código para conectar a conta
        const response = await fetch(
          'https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/social-oauth-linkedin/connect',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          }
        );

        console.log('📥 Response status:', response.status);
        if (!response.ok) {
          const error = await response.json();
          console.error('❌ Error response:', error);
          throw new Error(error.error || 'Erro ao conectar conta');
        }

        const data = await response.json();
        console.log('✅ Success response:', data);

        toast({
          title: 'LinkedIn conectado',
          description: 'Sua conta do LinkedIn foi conectada com sucesso',
        });

        queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      } catch (error: any) {
        toast({
          title: 'Erro ao conectar LinkedIn',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setConnectingPlatform(null);
      }
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
