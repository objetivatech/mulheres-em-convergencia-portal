import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AddBusinessDialog } from './AddBusinessDialog';
import { Store, Gift, Calendar, CheckCircle, XCircle, Plus, AlertTriangle, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Business {
  id: string;
  name: string;
  category: string;
  subscription_active: boolean;
  subscription_renewal_date: string | null;
  subscription_expires_at: string | null;
  is_complimentary: boolean;
  created_at: string;
  owner_id?: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  created_at: string;
  business_id: string;
  previous_value: boolean;
  new_value: boolean;
  notes: string | null;
}

interface ComplimentaryBusinessManagerProps {
  userId: string;
  userName: string;
}

export const ComplimentaryBusinessManager = ({ userId, userName }: ComplimentaryBusinessManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddBusinessDialog, setShowAddBusinessDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    businessId: string;
    businessName: string;
    currentStatus: boolean;
  } | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // Buscar negócios do usuário
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['user-businesses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, category, subscription_active, subscription_renewal_date, subscription_expires_at, is_complimentary, created_at, owner_id')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Business[];
    },
  });

  // Buscar logs de auditoria
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['complimentary-audit-logs', userId],
    queryFn: async () => {
      const businessIds = businesses.map(b => b.id);
      if (businessIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('complimentary_audit_log')
        .select('*')
        .in('business_id', businessIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: businesses.length > 0,
  });

  // Mutation para alternar status de cortesia
  const toggleComplimentaryMutation = useMutation({
    mutationFn: async ({ businessId, newStatus }: { businessId: string; newStatus: boolean }) => {
      const business = businesses.find(b => b.id === businessId);
      if (!business) throw new Error('Negócio não encontrado');

      // Atualizar status de cortesia
      const { error } = await supabase
        .from('businesses')
        .update({ 
          is_complimentary: newStatus,
          // Se tornar cortesia, ativar o negócio automaticamente
          subscription_active: newStatus ? true : business.subscription_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (error) throw error;

      // Registrar no CRM como interação
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from('crm_interactions').insert({
          user_id: business.owner_id,
          interaction_type: newStatus ? 'complimentary_enabled' : 'complimentary_disabled',
          channel: 'admin_panel',
          description: `Cortesia ${newStatus ? 'ativada' : 'desativada'} para negócio: ${business.name}`,
          performed_by: user?.id,
          metadata: {
            business_id: businessId,
            business_name: business.name,
            previous_status: business.is_complimentary,
            new_status: newStatus,
          },
        });
      } catch (crmError) {
        console.error('Erro ao registrar interação CRM:', crmError);
      }

      // Se ATIVOU cortesia
      if (newStatus && business.owner_id) {
        // Verificar se o usuário já tem a role business_owner
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', business.owner_id)
          .eq('role', 'business_owner')
          .maybeSingle();

        // Se não tiver, adicionar a role
        if (!userRoles) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: business.owner_id,
              role: 'business_owner'
            });

          if (roleError) {
            console.error('Erro ao atribuir role business_owner:', roleError);
          }
        }

        // Cancelar assinaturas ativas ou pendentes do usuário
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select('id, external_subscription_id, status')
          .eq('user_id', business.owner_id)
          .in('status', ['active', 'pending']);

        if (subscriptions && subscriptions.length > 0) {
          for (const subscription of subscriptions) {
            // Cancelar assinatura no banco (edge function cuida do ASAAS)
            if (subscription.external_subscription_id) {
              const { error: cancelError } = await supabase.functions.invoke(
                'subscription-management',
                {
                  body: {
                    action: 'cancel',
                    subscriptionId: subscription.id,
                  },
                }
              );

              if (cancelError) {
                console.error('Erro ao cancelar assinatura:', cancelError);
              }
            }
            
            // Atualizar status para cancelled
            await supabase
              .from('user_subscriptions')
              .update({ status: 'cancelled' })
              .eq('id', subscription.id);
          }
        }
      }
      
      // Se DESATIVOU cortesia
      if (!newStatus && business.owner_id) {
        // Desativar o negócio imediatamente se não houver assinatura ativa
        const { data: activeSubscription } = await supabase
          .from('user_subscriptions')
          .select('id, expires_at')
          .eq('user_id', business.owner_id)
          .eq('status', 'active')
          .maybeSingle();

        if (!activeSubscription) {
          // Desativar negócio imediatamente
          await supabase
            .from('businesses')
            .update({ 
              subscription_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', businessId);
        }
      }

      return { businessId, newStatus };
    },
    onSuccess: (_, { businessId, newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['user-businesses', userId] });
      queryClient.invalidateQueries({ queryKey: ['complimentary-audit-logs', userId] });
      const businessName = businesses.find(b => b.id === businessId)?.name;
      toast({
        title: newStatus ? '✅ Cortesia Ativada' : '❌ Cortesia Removida',
        description: newStatus 
          ? `${businessName} agora tem acesso gratuito e permanente.`
          : `${businessName} foi desativado. Para reativar, o usuário precisa assinar um plano.`,
      });
      setConfirmDialog(null);
    },
    onError: (error) => {
      console.error('Erro ao alternar cortesia:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status de cortesia. Tente novamente.',
        variant: 'destructive',
      });
      setConfirmDialog(null);
    },
  });

  const handleSwitchClick = (business: Business) => {
    setConfirmDialog({
      open: true,
      businessId: business.id,
      businessName: business.name,
      currentStatus: business.is_complimentary,
    });
  };

  const handleConfirmToggle = () => {
    if (confirmDialog) {
      toggleComplimentaryMutation.mutate({ 
        businessId: confirmDialog.businessId, 
        newStatus: !confirmDialog.currentStatus 
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (businesses.length === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Negócios de {userName}
            </CardTitle>
            <CardDescription>
              Este usuário ainda não possui negócios cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowAddBusinessDialog(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Negócio
            </Button>
          </CardContent>
        </Card>
        <AddBusinessDialog
          userId={userId}
          userName={userName}
          open={showAddBusinessDialog}
          onOpenChange={setShowAddBusinessDialog}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Negócios de {userName}
              </CardTitle>
              <CardDescription>
                Gerencie o acesso gratuito (cortesia) aos negócios deste usuário
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAuditLog(true)}
                size="sm"
                variant="outline"
              >
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
              <Button
                onClick={() => setShowAddBusinessDialog(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Negócio
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {businesses.map((business) => (
            <div
              key={business.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                business.is_complimentary 
                  ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-card'
              }`}
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{business.name}</h4>
                  {business.is_complimentary && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      <Gift className="h-3 w-3 mr-1" />
                      Cortesia (Gratuito)
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {business.category}
                  </span>
                  
                  <span className="flex items-center gap-1">
                    {business.subscription_active || business.is_complimentary ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {business.is_complimentary ? 'Sempre Ativo' : 'Ativo'}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-red-500" />
                        Inativo (fora do diretório)
                      </>
                    )}
                  </span>
                  
                  {!business.is_complimentary && business.subscription_renewal_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Renova: {new Date(business.subscription_renewal_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}

                  {!business.is_complimentary && business.subscription_expires_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expira: {new Date(business.subscription_expires_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`complimentary-${business.id}`} className="text-sm cursor-pointer">
                    {business.is_complimentary ? 'Cortesia Ativa' : 'Liberar Cortesia'}
                  </Label>
                  <Switch
                    id={`complimentary-${business.id}`}
                    checked={business.is_complimentary}
                    disabled={toggleComplimentaryMutation.isPending}
                    onCheckedChange={() => handleSwitchClick(business)}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Negócios cortesia:</strong> {businesses.filter(b => b.is_complimentary).length} de {businesses.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Negócios marcados como cortesia permanecem ativos independente de pagamentos ou assinaturas.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Ao remover cortesia, o negócio é <strong>desativado imediatamente</strong> se não houver assinatura ativa.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <Dialog open={confirmDialog?.open || false} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.currentStatus ? '❌ Remover Cortesia' : '✅ Liberar como Cortesia'}
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              {confirmDialog?.currentStatus ? (
                <>
                  <p>
                    Ao remover a cortesia, o negócio <strong>{confirmDialog.businessName}</strong> será:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-amber-600 dark:text-amber-400">
                    <li><strong>Desativado imediatamente</strong> do diretório</li>
                    <li>Removido dos resultados de busca</li>
                    <li>Para reativar, o usuário precisará assinar um plano</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>
                    Ao liberar <strong>{confirmDialog?.businessName}</strong> como cortesia:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-emerald-600 dark:text-emerald-400">
                    <li>O negócio ficará <strong>sempre ativo</strong></li>
                    <li>O usuário <strong>não será cobrado</strong></li>
                    <li>Assinaturas pendentes serão canceladas</li>
                    <li>A ação ficará registrada no histórico</li>
                  </ul>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmToggle}
              disabled={toggleComplimentaryMutation.isPending}
              variant={confirmDialog?.currentStatus ? 'destructive' : 'default'}
            >
              {toggleComplimentaryMutation.isPending ? 'Processando...' : 
                confirmDialog?.currentStatus ? 'Remover Cortesia' : 'Liberar como Cortesia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico de Auditoria */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Alterações de Cortesia
            </DialogTitle>
            <DialogDescription>
              Registro de todas as alterações de cortesia dos negócios de {userName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma alteração registrada.
              </p>
            ) : (
              auditLogs.map((log) => {
                const business = businesses.find(b => b.id === log.business_id);
                return (
                  <div key={log.id} className="p-3 border rounded-lg text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.action === 'enabled' ? (
                          <Badge className="bg-emerald-100 text-emerald-800">
                            <Gift className="h-3 w-3 mr-1" />
                            Ativada
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Removida
                          </Badge>
                        )}
                        <span className="font-medium">{business?.name || 'Negócio removido'}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="mt-2 text-muted-foreground">{log.notes}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditLog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddBusinessDialog
        userId={userId}
        userName={userName}
        open={showAddBusinessDialog}
        onOpenChange={setShowAddBusinessDialog}
      />
    </>
  );
};
