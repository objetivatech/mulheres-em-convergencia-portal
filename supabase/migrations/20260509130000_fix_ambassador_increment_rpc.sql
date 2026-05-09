-- Função RPC para incrementar totais de embaixadoras atomicamente
-- Necessário pois o Supabase JS client não suporta { increment: value } no .update()
create or replace function public.increment_ambassador_totals(
  p_ambassador_id uuid,
  p_commission_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ambassadors
  set
    total_earnings     = coalesce(total_earnings, 0) + p_commission_amount,
    total_sales        = coalesce(total_sales, 0) + 1,
    pending_commission = coalesce(pending_commission, 0) + p_commission_amount,
    updated_at         = now()
  where id = p_ambassador_id;
end;
$$;
