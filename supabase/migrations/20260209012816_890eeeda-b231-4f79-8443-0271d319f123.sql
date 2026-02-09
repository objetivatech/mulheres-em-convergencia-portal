-- =============================================
-- FASE 9: NÍVEIS, COMISSÃO RECORRENTE E GAMIFICAÇÃO
-- =============================================

-- 1. ADICIONAR NOVOS CAMPOS NA TABELA AMBASSADORS
-- =============================================

-- Campos para sistema de níveis
ALTER TABLE public.ambassadors
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lifetime_sales INTEGER NOT NULL DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.ambassadors.tier IS 'Nível da embaixadora: bronze (15%), silver (17%), gold (20%)';
COMMENT ON COLUMN public.ambassadors.lifetime_sales IS 'Total de vendas acumuladas para progressão de nível';

-- 2. ADICIONAR CAMPO PARA COMISSÃO RECORRENTE NA TABELA REFERRALS
-- =============================================

ALTER TABLE public.ambassador_referrals
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_month INTEGER,
ADD COLUMN IF NOT EXISTS original_referral_id UUID REFERENCES public.ambassador_referrals(id);

COMMENT ON COLUMN public.ambassador_referrals.is_recurring IS 'Se é uma comissão de renovação (true) ou primeira venda (false)';
COMMENT ON COLUMN public.ambassador_referrals.recurring_month IS 'Número do mês de renovação (1-12)';
COMMENT ON COLUMN public.ambassador_referrals.original_referral_id IS 'Referência à venda original para rastrear renovações';

-- 3. TABELA DE CONFIGURAÇÃO DE NÍVEIS
-- =============================================

CREATE TABLE IF NOT EXISTS public.ambassador_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_sales INTEGER NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  recurring_rate NUMERIC(5,2) NOT NULL DEFAULT 7,
  recurring_months INTEGER NOT NULL DEFAULT 12,
  color TEXT NOT NULL DEFAULT '#CD7F32',
  icon TEXT,
  benefits TEXT[],
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir configuração dos níveis
INSERT INTO public.ambassador_tiers (id, name, min_sales, commission_rate, recurring_rate, recurring_months, color, icon, benefits, display_order)
VALUES 
  ('bronze', 'Bronze', 0, 15.00, 7.00, 12, '#CD7F32', 'medal', 
   ARRAY['15% de comissão na primeira venda', '7% nas renovações por 12 meses', 'Acesso aos materiais promocionais', 'Suporte por email'], 1),
  ('silver', 'Prata', 10, 17.00, 7.00, 12, '#C0C0C0', 'award', 
   ARRAY['17% de comissão na primeira venda', '7% nas renovações por 12 meses', 'Materiais exclusivos', 'Suporte prioritário', 'Destaque no ranking'], 2),
  ('gold', 'Ouro', 25, 20.00, 7.00, 12, '#FFD700', 'crown', 
   ARRAY['20% de comissão na primeira venda', '7% nas renovações por 12 meses', 'Materiais VIP', 'Suporte dedicado', 'Badges exclusivas', 'Bônus por meta atingida'], 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  min_sales = EXCLUDED.min_sales,
  commission_rate = EXCLUDED.commission_rate,
  recurring_rate = EXCLUDED.recurring_rate,
  recurring_months = EXCLUDED.recurring_months,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  benefits = EXCLUDED.benefits,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- 4. TABELA DE CONQUISTAS (GAMIFICAÇÃO)
-- =============================================

CREATE TABLE IF NOT EXISTS public.ambassador_achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'milestone',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  badge_color TEXT NOT NULL DEFAULT '#6366f1',
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir conquistas iniciais
INSERT INTO public.ambassador_achievements (id, name, description, icon, category, requirement_type, requirement_value, points, badge_color, display_order)
VALUES
  ('first_sale', 'Primeira Venda', 'Parabéns pela sua primeira indicação convertida!', 'sparkles', 'milestone', 'sales', 1, 50, '#10b981', 1),
  ('five_sales', 'Decolando', 'Você completou 5 vendas!', 'rocket', 'milestone', 'sales', 5, 100, '#3b82f6', 2),
  ('ten_sales', 'Embaixadora Prata', 'Atingiu 10 vendas e subiu de nível!', 'award', 'milestone', 'sales', 10, 200, '#C0C0C0', 3),
  ('twenty_five_sales', 'Embaixadora Ouro', 'Atingiu 25 vendas e alcançou o nível máximo!', 'crown', 'milestone', 'sales', 25, 500, '#FFD700', 4),
  ('fifty_sales', 'Top Performer', 'Incrível! 50 vendas realizadas!', 'trophy', 'milestone', 'sales', 50, 1000, '#f59e0b', 5),
  ('hundred_sales', 'Lendária', 'Você é lendária com 100 vendas!', 'star', 'milestone', 'sales', 100, 2000, '#ef4444', 6),
  ('hundred_clicks', 'Começando', '100 cliques no seu link!', 'mouse-pointer-click', 'engagement', 'clicks', 100, 25, '#8b5cf6', 10),
  ('five_hundred_clicks', 'Influenciadora', '500 cliques! Você está ganhando visibilidade!', 'eye', 'engagement', 'clicks', 500, 75, '#ec4899', 11),
  ('thousand_clicks', 'Viral', '1000 cliques! Seu link está bombando!', 'flame', 'engagement', 'clicks', 1000, 150, '#f97316', 12),
  ('tier_silver', 'Subiu de Nível', 'Alcançou o nível Prata!', 'trending-up', 'tier', 'tier', 2, 300, '#C0C0C0', 20),
  ('tier_gold', 'Elite', 'Alcançou o nível Ouro!', 'gem', 'tier', 'tier', 3, 500, '#FFD700', 21)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  points = EXCLUDED.points,
  badge_color = EXCLUDED.badge_color,
  display_order = EXCLUDED.display_order;

-- 5. TABELA DE CONQUISTAS DAS EMBAIXADORAS
-- =============================================

CREATE TABLE IF NOT EXISTS public.ambassador_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.ambassador_achievements(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(ambassador_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_ambassador_user_achievements_ambassador 
ON public.ambassador_user_achievements(ambassador_id);

-- 6. TABELA DE PONTUAÇÃO E RANKING
-- =============================================

CREATE TABLE IF NOT EXISTS public.ambassador_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  points_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ambassador_points_ambassador ON public.ambassador_points(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_points_created ON public.ambassador_points(created_at DESC);

-- Adicionar campo de pontos totais na tabela ambassadors
ALTER TABLE public.ambassadors
ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;

-- 7. FUNÇÃO PARA CALCULAR NÍVEL BASEADO EM VENDAS
-- =============================================

CREATE OR REPLACE FUNCTION public.calculate_ambassador_tier(sales_count INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF sales_count >= 25 THEN
    RETURN 'gold';
  ELSIF sales_count >= 10 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. FUNÇÃO PARA ATUALIZAR NÍVEL DA EMBAIXADORA
-- =============================================

CREATE OR REPLACE FUNCTION public.update_ambassador_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_tier TEXT;
  current_tier TEXT;
  tier_config RECORD;
BEGIN
  -- Calcular novo nível baseado em vendas confirmadas
  SELECT COUNT(*) INTO NEW.lifetime_sales
  FROM ambassador_referrals
  WHERE ambassador_id = NEW.id
    AND status IN ('confirmed', 'paid')
    AND is_recurring = false;
  
  -- Determinar nível
  new_tier := calculate_ambassador_tier(NEW.lifetime_sales);
  current_tier := OLD.tier;
  
  -- Atualizar se mudou de nível
  IF new_tier != current_tier THEN
    NEW.tier := new_tier;
    NEW.tier_updated_at := now();
    
    -- Buscar taxa de comissão do novo nível
    SELECT commission_rate INTO tier_config FROM ambassador_tiers WHERE id = new_tier;
    IF FOUND THEN
      NEW.commission_rate := tier_config.commission_rate;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar nível quando total_sales muda
DROP TRIGGER IF EXISTS trigger_update_ambassador_tier ON ambassadors;
CREATE TRIGGER trigger_update_ambassador_tier
BEFORE UPDATE OF total_sales ON ambassadors
FOR EACH ROW
EXECUTE FUNCTION update_ambassador_tier();

-- 9. RLS POLICIES
-- =============================================

-- Tiers (leitura pública para exibir no dashboard)
ALTER TABLE public.ambassador_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tiers são públicos para leitura" ON public.ambassador_tiers;
CREATE POLICY "Tiers são públicos para leitura"
ON public.ambassador_tiers FOR SELECT
USING (active = true);

DROP POLICY IF EXISTS "Admins podem gerenciar tiers" ON public.ambassador_tiers;
CREATE POLICY "Admins podem gerenciar tiers"
ON public.ambassador_tiers FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- Achievements (leitura pública)
ALTER TABLE public.ambassador_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Achievements são públicos para leitura" ON public.ambassador_achievements;
CREATE POLICY "Achievements são públicos para leitura"
ON public.ambassador_achievements FOR SELECT
USING (active = true);

DROP POLICY IF EXISTS "Admins podem gerenciar achievements" ON public.ambassador_achievements;
CREATE POLICY "Admins podem gerenciar achievements"
ON public.ambassador_achievements FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- User Achievements (embaixadora vê as próprias)
ALTER TABLE public.ambassador_user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Embaixadoras veem suas conquistas" ON public.ambassador_user_achievements;
CREATE POLICY "Embaixadoras veem suas conquistas"
ON public.ambassador_user_achievements FOR SELECT
USING (
  ambassador_id IN (SELECT id FROM ambassadors WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

DROP POLICY IF EXISTS "Sistema pode inserir conquistas" ON public.ambassador_user_achievements;
CREATE POLICY "Sistema pode inserir conquistas"
ON public.ambassador_user_achievements FOR INSERT
WITH CHECK (true);

-- Points (embaixadora vê os próprios)
ALTER TABLE public.ambassador_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Embaixadoras veem seus pontos" ON public.ambassador_points;
CREATE POLICY "Embaixadoras veem seus pontos"
ON public.ambassador_points FOR SELECT
USING (
  ambassador_id IN (SELECT id FROM ambassadors WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

DROP POLICY IF EXISTS "Sistema pode inserir pontos" ON public.ambassador_points;
CREATE POLICY "Sistema pode inserir pontos"
ON public.ambassador_points FOR INSERT
WITH CHECK (true);

-- 10. ATUALIZAR FAQ COM NOVAS PERGUNTAS
-- =============================================

INSERT INTO public.ambassador_faq_items (question, answer, category, display_order, active)
VALUES
  ('O que são os níveis de embaixadora?', 
   'O programa possui três níveis: Bronze, Prata e Ouro. Cada nível oferece uma taxa de comissão diferente:

• Bronze (0-9 vendas): 15% de comissão
• Prata (10-24 vendas): 17% de comissão
• Ouro (25+ vendas): 20% de comissão

Você sobe de nível automaticamente conforme atinge as metas de vendas!', 
   'sobre', 15, true),
  
  ('Como funciona a comissão recorrente?', 
   'Você ganha comissão não só na primeira venda, mas também nas renovações! Funciona assim:

• Primeira venda: comissão de acordo com seu nível (15%, 17% ou 20%)
• Renovações: 7% por até 12 meses

Exemplo: Se uma indicada sua renova a assinatura mensalmente, você receberá 7% de cada renovação durante o primeiro ano!', 
   'pagamento', 16, true),
  
  ('Como subo de nível?', 
   'A progressão de nível é automática e baseada no total de vendas confirmadas (primeira venda, não renovações):

• Complete 10 vendas → suba para Prata (17%)
• Complete 25 vendas → suba para Ouro (20%)

Seu nível nunca diminui! Uma vez alcançado, você mantém os benefícios permanentemente.', 
   'sobre', 17, true),
  
  ('O que são as conquistas?', 
   'Conquistas são badges especiais que você desbloqueia ao atingir marcos importantes como:

• Primeira venda
• 10 vendas (Embaixadora Prata)
• 25 vendas (Embaixadora Ouro)
• 100 cliques no link
• E muito mais!

Cada conquista vale pontos que contribuem para seu ranking.', 
   'dicas', 18, true),
  
  ('Como funciona o sistema de pontos?', 
   'Você acumula pontos de várias formas:

• Vendas realizadas
• Conquistas desbloqueadas
• Bônus especiais

Os pontos são usados para o ranking mensal de embaixadoras. As melhores colocadas recebem reconhecimento especial!', 
   'dicas', 19, true),
  
  ('Onde vejo minhas conquistas e nível?', 
   'Todas as suas conquistas, nível atual e progresso para o próximo nível estão visíveis no seu Dashboard de Embaixadora. Acesse a aba "Visão Geral" para ver suas estatísticas e conquistas desbloqueadas.', 
   'rastreamento', 20, true)
ON CONFLICT DO NOTHING;