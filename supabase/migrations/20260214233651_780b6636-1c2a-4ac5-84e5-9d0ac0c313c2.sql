
-- Add "Acesso ao MeC Academy" benefit to all existing subscription plans
UPDATE subscription_plans 
SET features = jsonb_set(
  features::jsonb, 
  '{benefits}', 
  (features::jsonb->'benefits') || '["Acesso ao MeC Academy"]'::jsonb
)
WHERE name IN ('iniciante', 'intermediario', 'impulso')
AND NOT (features::jsonb->'benefits' @> '"Acesso ao MeC Academy"'::jsonb);
