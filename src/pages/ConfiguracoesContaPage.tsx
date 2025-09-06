import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Shield, Bell, Trash2, Key } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';

const ConfiguracoesContaPage = () => {
  const { user, updatePassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro', 
        description: 'A nova senha deve ter pelo menos 6 caracteres',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso!'
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar senha',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // Implementar exclusão de conta
      toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'A exclusão de conta será implementada em breve',
        variant: 'destructive'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir conta',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async () => {
    setNotificationsEnabled(!notificationsEnabled);
    toast({
      title: 'Configuração atualizada',
      description: `Notificações ${!notificationsEnabled ? 'ativadas' : 'desativadas'}`
    });
  };

  return (
    <Layout>
      <Helmet>
        <title>Configurações da Conta - Mulheres em Convergência</title>
        <meta name="description" content="Gerencie suas configurações de conta, segurança e privacidade" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configurações da Conta</h1>
          <p className="text-muted-foreground">
            Gerencie suas configurações de conta, segurança e privacidade
          </p>
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral">
              <Settings className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="seguranca">
              <Shield className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="notificacoes">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="conta">
              <Trash2 className="h-4 w-4 mr-2" />
              Conta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>
                  Suas informações básicas de acesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                  <p className="text-sm text-muted-foreground mt-1">
                    O email não pode ser alterado
                  </p>
                </div>
                <div>
                  <Label>ID do Usuário</Label>
                  <Input value={user?.id || ''} disabled />
                  <p className="text-sm text-muted-foreground mt-1">
                    Identificador único da sua conta
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguranca" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading || !newPassword || !confirmPassword}
                    className="w-full md:w-auto"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {loading ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>
                  Configurações adicionais de segurança
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Autenticação de dois fatores</p>
                      <p className="text-sm text-muted-foreground">
                        Em desenvolvimento - será disponibilizada em breve
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notificacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Controle como e quando receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por email</p>
                    <p className="text-sm text-muted-foreground">
                      Receba atualizações importantes por email
                    </p>
                  </div>
                  <Button 
                    variant={notificationsEnabled ? "default" : "outline"}
                    onClick={handleNotificationToggle}
                  >
                    {notificationsEnabled ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Newsletter</p>
                    <p className="text-sm text-muted-foreground">
                      Receba novidades e conteúdos exclusivos
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conta" className="space-y-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800">Zona de Perigo</CardTitle>
                <CardDescription>
                  Ações irreversíveis relacionadas à sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Excluir Conta</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta 
                      e removerá todos os dados associados de nossos servidores.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Conta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
                            e todos os dados associados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir Permanentemente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ConfiguracoesContaPage;