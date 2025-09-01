-- Inserir planos padrão se não existirem
INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, features, limits, is_active, is_featured, sort_order)
VALUES 
  (
    'iniciante',
    'Plano Iniciante',
    35.00,
    336.00,
    '{
      "description": "Ideal para empreendedoras que estão começando",
      "benefits": [
        "1 perfil de negócio",
        "Acesso à comunidade no WhatsApp",
        "Conteúdos gravados",
        "10% de desconto em eventos",
        "Visibilidade nas redes sociais"
      ]
    }'::jsonb,
    '{
      "business_profiles": 1,
      "community_access": true,
      "discount_percentage": 10,
      "social_visibility": true
    }'::jsonb,
    true,
    false,
    1
  ),
  (
    'intermediario',
    'Plano Intermediário',
    75.00,
    720.00,
    '{
      "description": "Para empresárias que querem mais destaque",
      "benefits": [
        "Todos os benefícios do Iniciante",
        "Prioridade na exibição",
        "15% de desconto em eventos",
        "1h de mentoria por mês",
        "Suporte prioritário"
      ]
    }'::jsonb,
    '{
      "business_profiles": 1,
      "community_access": true,
      "discount_percentage": 15,
      "social_visibility": true,
      "priority_listing": true,
      "mentorship_hours": 1
    }'::jsonb,
    true,
    true,
    2
  ),
  (
    'master',
    'Plano Master',
    150.00,
    1440.00,
    '{
      "description": "O plano completo para empresárias ambiciosas",
      "benefits": [
        "2 perfis de negócio",
        "Destaque máximo na exibição",
        "20% de desconto em eventos",
        "2h de mentoria por mês",
        "Suporte VIP 24/7",
        "Análises detalhadas"
      ]
    }'::jsonb,
    '{
      "business_profiles": 2,
      "community_access": true,
      "discount_percentage": 20,
      "social_visibility": true,
      "featured_listing": true,
      "mentorship_hours": 2,
      "analytics": true
    }'::jsonb,
    true,
    false,
    3
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  updated_at = now();