import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Store, Gift, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  category: string;
  subscription_active: boolean;
  subscription_renewal_date: string | null;
  is_complimentary: boolean;
  created_at: string;
  owner_id?: string;
}

interface ComplimentaryBusinessManagerProps {
  userId: string;
  userName: string;
}

export const ComplimentaryBusinessManager = ({ userId, userName }: ComplimentaryBusinessManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar negócios do usuário
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['user-businesses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, category, subscription_active, subscription_renewal_date, is_complimentary, created_at, owner_id')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Business[];
    },
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
          subscription_active: newStatus ? true : undefined
        })
        .eq('id', businessId);

      if (error) throw error;

      // Se ATIVOU cortesia, cancelar assinatura ativa do usuário (se existir)
      if (newStatus && business.owner_id) {
        const { data: activeSubscription } = await supabase
          .from('user_subscriptions')
          .select('id, external_subscription_id')
          .eq('user_id', business.owner_id)
          .eq('status', 'active')
          .maybeSingle();

        if (activeSubscription?.external_subscription_id) {
          // Cancelar no banco (edge function subscription-management cuida do ASAAS)
          const { error: cancelError } = await supabase.functions.invoke(
            'subscription-management',
            {
              body: {
                action: 'cancel',
                subscriptionId: activeSubscription.id,
              },
            }
          );

          if (cancelError) {
            console.error('Erro ao cancelar assinatura:', cancelError);
            // Não bloquear a cortesia mesmo se falhar
          }
        }
      }
    },
    onSuccess: (_, { businessId, newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['user-businesses', userId] });
      const businessName = businesses.find(b => b.id === businessId)?.name;
      toast({
        title: newStatus ? 'Negócio liberado como cortesia' : 'Cortesia removida',
        description: `${businessName} agora ${newStatus ? 'é gratuito' : 'requer assinatura'}.`,
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status de cortesia.',
        variant: 'destructive',
      });
    },
  });

  const handleToggleComplimentary = (businessId: string, currentStatus: boolean) => {
    toggleComplimentaryMutation.mutate({ 
      businessId, 
      newStatus: !currentStatus 
    });
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
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Negócios de {userName}
        </CardTitle>
        <CardDescription>
          Gerencie o acesso gratuito (cortesia) aos negócios deste usuário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {businesses.map((business) => (
          <div
            key={business.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-card"
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
                
                {!business.is_complimentary && (
                  <>
                    <span className="flex items-center gap-1">
                      {business.subscription_active ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-red-500" />
                          Inativo
                        </>
                      )}
                    </span>
                    
                    {business.subscription_renewal_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Renova: {new Date(business.subscription_renewal_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor={`complimentary-${business.id}`} className="text-sm cursor-pointer">
                  {business.is_complimentary ? 'Cortesia Ativa' : 'Liberar Cortesia'}
                </Label>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div>
                      <Switch
                        id={`complimentary-${business.id}`}
                        checked={business.is_complimentary}
                        disabled={toggleComplimentaryMutation.isPending}
                      />
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {business.is_complimentary ? 'Remover Cortesia' : 'Liberar como Cortesia'}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        {business.is_complimentary ? (
                          <>
                            <p>
                              Ao remover a cortesia, o negócio <strong>{business.name}</strong> voltará 
                              a depender de uma assinatura ativa para permanecer visível no portal.
                            </p>
                            <p className="text-amber-600 dark:text-amber-400">
                              ⚠️ Se não houver assinatura ativa, o negócio será desativado automaticamente.
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              Ao liberar <strong>{business.name}</strong> como cortesia, o negócio 
                              ficará <strong>sempre ativo</strong>, independente do status de assinatura.
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400">
                              ✓ O usuário não será cobrado por este negócio.
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400">
                              ✓ O negócio permanecerá ativo mesmo sem pagamentos.
                            </p>
                          </>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleToggleComplimentary(business.id, business.is_complimentary)}
                        className={business.is_complimentary ? 'bg-destructive hover:bg-destructive/90' : ''}
                      >
                        {business.is_complimentary ? 'Remover Cortesia' : 'Liberar como Cortesia'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
        </div>
      </CardContent>
    </Card>
  );
};
