-- Fix existing paid payouts that weren't tracked correctly
-- Recalculate total_earnings based on all paid payouts
WITH paid_totals AS (
  SELECT 
    ambassador_id,
    SUM(net_amount) as total_paid
  FROM public.ambassador_payouts
  WHERE status = 'paid'
  GROUP BY ambassador_id
)
UPDATE public.ambassadors a
SET 
  total_earnings = COALESCE(pt.total_paid, 0),
  updated_at = now()
FROM paid_totals pt
WHERE a.id = pt.ambassador_id;