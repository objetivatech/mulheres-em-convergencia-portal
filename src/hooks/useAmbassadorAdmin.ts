import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Ambassador, AmbassadorReferral, AmbassadorPayout, BankData } from './useAmbassador';

export interface AmbassadorWithProfile extends Ambassador {
  profile?: {
    full_name: string | null;
    email: string;
  };
}

export interface AdminAmbassadorStats {
  totalAmbassadors: number;
  activeAmbassadors: number;
  totalClicks: number;
  totalConversions: number;
  totalCommissionsPaid: number;
  totalPendingCommissions: number;
  avgConversionRate: number;
  thisMonthNewAmbassadors: number;
}

export const useAmbassadorAdmin = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as embaixadoras (admin only)
  const useAllAmbassadors = () => {
    return useQuery({
      queryKey: ['admin-ambassadors'],
      queryFn: async () => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const { data, error } = await supabase
          .from('ambassadors')
          .select(`
            *,
            profile:user_id (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform data to match expected type
        return (data || []).map(item => ({
          ...item,
          profile: item.profile ? {
            full_name: (item.profile as any).full_name,
            email: (item.profile as any).email,
          } : undefined,
        })) as AmbassadorWithProfile[];
      },
      enabled: !!isAdmin,
    });
  };

  // Buscar todas as referências (admin only)
  const useAllReferrals = () => {
    return useQuery({
      queryKey: ['admin-ambassador-referrals'],
      queryFn: async () => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const { data, error } = await supabase
          .from('ambassador_referrals')
          .select(`
            *,
            ambassador:ambassador_id (
              referral_code,
              user_id,
              profile:user_id (
                full_name,
                email
              )
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
      },
      enabled: !!isAdmin,
    });
  };

  // Buscar todos os pagamentos (admin only)
  const useAllPayouts = () => {
    return useQuery({
      queryKey: ['admin-ambassador-payouts'],
      queryFn: async () => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const { data, error } = await supabase
          .from('ambassador_payouts')
          .select(`
            *,
            ambassador:ambassador_id (
              referral_code,
              user_id,
              profile:user_id (
                full_name,
                email
              )
            )
          `)
          .order('scheduled_date', { ascending: false });
        
        if (error) throw error;
        return data;
      },
      enabled: !!isAdmin,
    });
  };

  // Calcular estatísticas globais
  const useAdminStats = () => {
    const { data: ambassadors } = useAllAmbassadors();
    const { data: payouts } = useAllPayouts();
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (!ambassadors) return null;

    const stats: AdminAmbassadorStats = {
      totalAmbassadors: ambassadors.length,
      activeAmbassadors: ambassadors.filter(a => a.active).length,
      totalClicks: ambassadors.reduce((sum, a) => sum + (a.link_clicks || 0), 0),
      totalConversions: ambassadors.reduce((sum, a) => sum + (a.total_sales || 0), 0),
      totalCommissionsPaid: ambassadors.reduce((sum, a) => sum + (a.total_earnings || 0), 0),
      totalPendingCommissions: ambassadors.reduce((sum, a) => sum + (a.pending_commission || 0), 0),
      avgConversionRate: ambassadors.length > 0
        ? ambassadors.reduce((sum, a) => {
            const rate = a.link_clicks > 0 ? (a.total_sales / a.link_clicks) * 100 : 0;
            return sum + rate;
          }, 0) / ambassadors.filter(a => a.link_clicks > 0).length || 0
        : 0,
      thisMonthNewAmbassadors: ambassadors.filter(a => 
        new Date(a.created_at) >= startOfMonth
      ).length,
    };

    return stats;
  };

  // Atualizar status da embaixadora (ativar/desativar)
  const useToggleAmbassadorStatus = () => {
    return useMutation({
      mutationFn: async ({ ambassadorId, active }: { ambassadorId: string; active: boolean }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const { error } = await supabase
          .from('ambassadors')
          .update({ active, updated_at: new Date().toISOString() })
          .eq('id', ambassadorId);
        
        if (error) throw error;
      },
      onSuccess: (_, { active }) => {
        queryClient.invalidateQueries({ queryKey: ['admin-ambassadors'] });
        toast({
          title: active ? 'Embaixadora ativada' : 'Embaixadora desativada',
          description: `Status atualizado com sucesso.`,
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro ao atualizar status',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  // Atualizar taxa de comissão
  const useUpdateCommissionRate = () => {
    return useMutation({
      mutationFn: async ({ ambassadorId, rate }: { ambassadorId: string; rate: number }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        if (rate < 0 || rate > 100) throw new Error('Taxa deve estar entre 0 e 100');
        
        const { error } = await supabase
          .from('ambassadors')
          .update({ commission_rate: rate, updated_at: new Date().toISOString() })
          .eq('id', ambassadorId);
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-ambassadors'] });
        toast({
          title: 'Taxa atualizada',
          description: 'Taxa de comissão atualizada com sucesso.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro ao atualizar taxa',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  // Atualizar dados bancários da embaixadora (admin)
  const useAdminUpdatePaymentData = () => {
    return useMutation({
      mutationFn: async ({ 
        ambassadorId, 
        pix_key, 
        bank_data, 
        payment_preference 
      }: { 
        ambassadorId: string;
        pix_key?: string;
        bank_data?: BankData;
        payment_preference?: 'pix' | 'bank_transfer';
      }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const updatePayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        
        if (pix_key !== undefined) updatePayload.pix_key = pix_key;
        if (payment_preference !== undefined) updatePayload.payment_preference = payment_preference;
        if (bank_data !== undefined) updatePayload.bank_data = bank_data as Record<string, unknown>;
        
        const { error } = await supabase
          .from('ambassadors')
          .update(updatePayload)
          .eq('id', ambassadorId);
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-ambassadors'] });
        toast({
          title: 'Dados atualizados',
          description: 'Informações de pagamento atualizadas com sucesso.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro ao atualizar dados',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  // Criar pagamento
  const useCreatePayout = () => {
    return useMutation({
      mutationFn: async ({ 
        ambassadorId, 
        referenceMonth,
        totalSales,
        grossAmount,
        netAmount,
        scheduledDate,
        notes,
      }: { 
        ambassadorId: string;
        referenceMonth: string;
        totalSales: number;
        grossAmount: number;
        netAmount: number;
        scheduledDate: string;
        notes?: string;
      }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const { data, error } = await supabase
          .from('ambassador_payouts')
          .insert({
            ambassador_id: ambassadorId,
            reference_period: referenceMonth,
            total_sales: totalSales,
            gross_amount: grossAmount,
            net_amount: netAmount,
            scheduled_date: scheduledDate,
            notes,
            status: 'pending',
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-ambassador-payouts'] });
        toast({
          title: 'Pagamento criado',
          description: 'Pagamento agendado com sucesso.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro ao criar pagamento',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  // Marcar pagamento como pago
  const useMarkPayoutPaid = () => {
    return useMutation({
      mutationFn: async ({ 
        payoutId, 
        paymentMethod,
        notes,
      }: { 
        payoutId: string; 
        paymentMethod: string;
        notes?: string;
      }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const { error } = await supabase
          .from('ambassador_payouts')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: paymentMethod,
            notes,
          })
          .eq('id', payoutId);
        
        if (error) throw error;

        // Send email notification via edge function
        try {
          const { error: emailError } = await supabase.functions.invoke('send-ambassador-payout-email', {
            body: { payout_id: payoutId, action: 'paid' }
          });
          
          if (emailError) {
            console.error('Error sending payout email:', emailError);
            // Don't throw - email failure shouldn't block the payment confirmation
          }
        } catch (emailErr) {
          console.error('Failed to invoke email function:', emailErr);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-ambassador-payouts'] });
        queryClient.invalidateQueries({ queryKey: ['admin-ambassadors'] });
        toast({
          title: 'Pagamento confirmado',
          description: 'Pagamento marcado como pago e email de confirmação enviado.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro ao confirmar pagamento',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  // Cancelar pagamento
  const useCancelPayout = () => {
    return useMutation({
      mutationFn: async ({ payoutId, reason }: { payoutId: string; reason?: string }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const { error } = await supabase
          .from('ambassador_payouts')
          .update({ 
            status: 'cancelled',
            notes: reason,
          })
          .eq('id', payoutId);
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-ambassador-payouts'] });
        toast({
          title: 'Pagamento cancelado',
          description: 'Pagamento cancelado com sucesso.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro ao cancelar pagamento',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  // Exportar dados para CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: 'Sem dados',
        description: 'Não há dados para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object') return JSON.stringify(value);
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value ?? '';
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: 'Exportação concluída',
      description: `Arquivo ${filename}.csv baixado com sucesso.`,
    });
  };

  return {
    useAllAmbassadors,
    useAllReferrals,
    useAllPayouts,
    useAdminStats,
    useToggleAmbassadorStatus,
    useUpdateCommissionRate,
    useAdminUpdatePaymentData,
    useCreatePayout,
    useMarkPayoutPaid,
    useCancelPayout,
    exportToCSV,
  };
};
