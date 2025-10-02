-- Adicionar coluna is_complimentary à tabela businesses
ALTER TABLE businesses 
ADD COLUMN is_complimentary BOOLEAN NOT NULL DEFAULT false;

-- Adicionar índice para melhor performance
CREATE INDEX idx_businesses_complimentary ON businesses(is_complimentary) WHERE is_complimentary = true;

-- Comentário explicativo
COMMENT ON COLUMN businesses.is_complimentary IS 'Indica se o negócio é cortesia (gratuito), mantendo-se ativo independente de assinatura';

-- Atualizar função que verifica negócios ativos para considerar cortesias
CREATE OR REPLACE FUNCTION is_business_active(business_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_comp BOOLEAN;
  is_active BOOLEAN;
  renewal_date DATE;
BEGIN
  SELECT is_complimentary, subscription_active, subscription_renewal_date
  INTO is_comp, is_active, renewal_date
  FROM businesses
  WHERE id = business_uuid;
  
  -- Se é cortesia, está sempre ativo
  IF is_comp THEN
    RETURN true;
  END IF;
  
  -- Caso contrário, segue lógica normal de assinatura
  RETURN is_active AND (renewal_date IS NULL OR renewal_date >= CURRENT_DATE);
END;
$$;