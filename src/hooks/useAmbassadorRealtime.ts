import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para atualizações em tempo real do dashboard da embaixadora
 * Usa Supabase Realtime para escutar mudanças nas tabelas relevantes
 */
export const useAmbassadorRealtime = (ambassadorId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!ambassadorId) return;

    // Canal para atualizações da embaixadora
    const channel = supabase
      .channel(`ambassador-${ambassadorId}`)
      // Escutar novas indicações (referrals)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ambassador_referrals',
          filter: `ambassador_id=eq.${ambassadorId}`,
        },
        (payload) => {
          console.log('Nova indicação recebida:', payload);
          
          // Invalidar queries relacionadas
          queryClient.invalidateQueries({ queryKey: ['ambassador-referrals', ambassadorId] });
          queryClient.invalidateQueries({ queryKey: ['ambassador', ambassadorId] });
          
          // Notificar usuário
          const isRecurring = payload.new.is_recurring;
          toast({
            title: isRecurring ? '🔄 Comissão de Renovação!' : '🎉 Nova Venda!',
            description: isRecurring 
              ? `Você ganhou R$ ${payload.new.commission_amount?.toFixed(2)} de comissão recorrente!`
              : `Parabéns! Você ganhou R$ ${payload.new.commission_amount?.toFixed(2)} de comissão!`,
          });
        }
      )
      // Escutar mudanças no status das indicações
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ambassador_referrals',
          filter: `ambassador_id=eq.${ambassadorId}`,
        },
        (payload) => {
          console.log('Indicação atualizada:', payload);
          
          queryClient.invalidateQueries({ queryKey: ['ambassador-referrals', ambassadorId] });
          queryClient.invalidateQueries({ queryKey: ['ambassador', ambassadorId] });
          
          // Notificar mudança de status para pago
          if (payload.old.status !== 'paid' && payload.new.status === 'paid') {
            toast({
              title: '💰 Pagamento Confirmado!',
              description: `Sua comissão de R$ ${payload.new.commission_amount?.toFixed(2)} foi paga!`,
            });
          }
        }
      )
      // Escutar novos cliques
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ambassador_referral_clicks',
          filter: `ambassador_id=eq.${ambassadorId}`,
        },
        () => {
          // Apenas invalidar queries sem notificar (cliques são muito frequentes)
          queryClient.invalidateQueries({ queryKey: ['ambassador-clicks', ambassadorId] });
          queryClient.invalidateQueries({ queryKey: ['ambassador'] });
        }
      )
      // Escutar novos pagamentos/payouts
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambassador_payouts',
          filter: `ambassador_id=eq.${ambassadorId}`,
        },
        (payload) => {
          console.log('Payout atualizado:', payload);
          
          queryClient.invalidateQueries({ queryKey: ['ambassador-payouts', ambassadorId] });
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: '📅 Novo Pagamento Agendado',
              description: `Um pagamento foi agendado para ${new Date(payload.new.scheduled_date).toLocaleDateString('pt-BR')}`,
            });
          }
        }
      )
      // Escutar novas conquistas
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ambassador_user_achievements',
          filter: `ambassador_id=eq.${ambassadorId}`,
        },
        (payload) => {
          console.log('Nova conquista desbloqueada:', payload);
          
          queryClient.invalidateQueries({ queryKey: ['ambassador-user-achievements', ambassadorId] });
          queryClient.invalidateQueries({ queryKey: ['ambassador-unnotified-achievements', ambassadorId] });
          
          // A notificação será mostrada pelo componente de conquistas
        }
      )
      // Escutar mudanças na embaixadora (nível, pontos, etc)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ambassadors',
          filter: `id=eq.${ambassadorId}`,
        },
        (payload) => {
          console.log('Dados da embaixadora atualizados:', payload);
          
          queryClient.invalidateQueries({ queryKey: ['ambassador'] });
          
          // Notificar mudança de nível
          if (payload.old.tier !== payload.new.tier) {
            const tierNames: Record<string, string> = {
              bronze: 'Bronze',
              silver: 'Prata',
              gold: 'Ouro',
            };
            toast({
              title: '🎖️ Subiu de Nível!',
              description: `Parabéns! Você agora é uma Embaixadora ${tierNames[payload.new.tier]}!`,
            });
          }
        }
      )
      // Escutar novas notificações
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ambassador_notifications',
          filter: `ambassador_id=eq.${ambassadorId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ambassador-notifications', ambassadorId] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup ao desmontar
    return () => {
      console.log('Closing realtime channel for ambassador:', ambassadorId);
      supabase.removeChannel(channel);
    };
  }, [ambassadorId, queryClient, toast]);
};
