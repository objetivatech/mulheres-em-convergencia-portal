import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EventCoupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  event_id: string | null;
  all_events: boolean;
  max_uses: number | null;
  current_uses: number;
  min_purchase: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponValidation {
  valid: boolean;
  error?: string;
  coupon_id?: string;
  discount?: number;
  final_amount?: number;
  discount_type?: string;
  discount_value?: number;
}

export const useEventCoupons = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const useCoupons = (filters?: { eventId?: string; active?: boolean }) => {
    return useQuery({
      queryKey: ['event-coupons', filters],
      queryFn: async () => {
        let query = supabase
          .from('event_coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters?.eventId) {
          query = query.or(`event_id.eq.${filters.eventId},all_events.eq.true`);
        }
        if (filters?.active !== undefined) {
          query = query.eq('active', filters.active);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as EventCoupon[];
      },
      enabled: isAdmin,
    });
  };

  const useCreateCoupon = () => {
    return useMutation({
      mutationFn: async (coupon: Partial<EventCoupon>) => {
        const { data, error } = await supabase
          .from('event_coupons')
          .insert({
            code: coupon.code?.toUpperCase() || `PROMO${Date.now()}`,
            discount_type: coupon.discount_type || 'percentage',
            discount_value: coupon.discount_value || 10,
            ...coupon,
          } as any)
          .select()
          .single();
        if (error) throw error;
        return data as EventCoupon;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event-coupons'] });
      },
    });
  };

  const useUpdateCoupon = () => {
    return useMutation({
      mutationFn: async ({ id, ...updates }: Partial<EventCoupon> & { id: string }) => {
        const { data, error } = await supabase
          .from('event_coupons')
          .update(updates as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as EventCoupon;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event-coupons'] });
      },
    });
  };

  const useDeleteCoupon = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from('event_coupons')
          .delete()
          .eq('id', id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event-coupons'] });
      },
    });
  };

  const useValidateCoupon = () => {
    return useMutation({
      mutationFn: async ({ code, eventId, email, amount }: { 
        code: string; 
        eventId: string; 
        email: string; 
        amount: number;
      }): Promise<CouponValidation> => {
        const { data, error } = await supabase.rpc('validate_coupon', {
          p_code: code,
          p_event_id: eventId,
          p_email: email,
          p_amount: amount,
        });
        if (error) throw error;
        return data as unknown as CouponValidation;
      },
    });
  };

  const useApplyCoupon = () => {
    return useMutation({
      mutationFn: async ({ couponId, registrationId, email, discount }: {
        couponId: string;
        registrationId: string;
        email: string;
        discount: number;
      }) => {
        const { data, error } = await supabase.rpc('apply_coupon', {
          p_coupon_id: couponId,
          p_registration_id: registrationId,
          p_email: email,
          p_discount: discount,
        });
        if (error) throw error;
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event-coupons'] });
      },
    });
  };

  const useCouponStats = () => {
    return useQuery({
      queryKey: ['coupon-stats'],
      queryFn: async () => {
        const { data: coupons } = await supabase
          .from('event_coupons')
          .select('id, current_uses, discount_value, discount_type');

        const { data: usage } = await supabase
          .from('coupon_usage')
          .select('discount_applied');

        const totalDiscounts = usage?.reduce((sum, u) => sum + (u.discount_applied || 0), 0) || 0;
        const totalUses = usage?.length || 0;
        const activeCoupons = coupons?.filter(c => c.current_uses !== undefined).length || 0;

        return {
          total_coupons: coupons?.length || 0,
          active_coupons: activeCoupons,
          total_uses: totalUses,
          total_discounts: totalDiscounts,
        };
      },
      enabled: isAdmin,
    });
  };

  return {
    useCoupons,
    useCreateCoupon,
    useUpdateCoupon,
    useDeleteCoupon,
    useValidateCoupon,
    useApplyCoupon,
    useCouponStats,
  };
};
