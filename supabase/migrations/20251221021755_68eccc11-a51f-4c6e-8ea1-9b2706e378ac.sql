-- Create event_coupons table for discount codes
CREATE TABLE public.event_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  all_events BOOLEAN DEFAULT false,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_purchase NUMERIC(10,2) DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_coupons
CREATE POLICY "Admins can manage coupons" 
ON public.event_coupons 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can read active coupons" 
ON public.event_coupons 
FOR SELECT 
USING (active = true);

-- Create coupon_usage table to track usage
CREATE TABLE public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.event_coupons(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE SET NULL,
  user_email VARCHAR(255) NOT NULL,
  discount_applied NUMERIC(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupon_usage
CREATE POLICY "Admins can view all coupon usage" 
ON public.coupon_usage 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Add coupon fields to event_registrations
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.event_coupons(id),
ADD COLUMN IF NOT EXISTS discount_applied NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10,2);

-- Create function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code VARCHAR(50),
  p_event_id UUID,
  p_email VARCHAR(255),
  p_amount NUMERIC(10,2)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_discount NUMERIC(10,2);
  v_final_amount NUMERIC(10,2);
  v_user_usage INTEGER;
BEGIN
  -- Find coupon
  SELECT * INTO v_coupon
  FROM event_coupons
  WHERE UPPER(code) = UPPER(p_code)
    AND active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
    AND (all_events = true OR event_id = p_event_id);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Cupom inválido ou expirado');
  END IF;
  
  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Cupom esgotado');
  END IF;
  
  -- Check minimum purchase
  IF p_amount < v_coupon.min_purchase THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Valor mínimo não atingido: R$ ' || v_coupon.min_purchase);
  END IF;
  
  -- Check if user already used this coupon
  SELECT COUNT(*) INTO v_user_usage
  FROM coupon_usage
  WHERE coupon_id = v_coupon.id AND user_email = p_email;
  
  IF v_user_usage > 0 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Você já utilizou este cupom');
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := p_amount * (v_coupon.discount_value / 100);
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_amount);
  END IF;
  
  v_final_amount := GREATEST(p_amount - v_discount, 0);
  
  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount', v_discount,
    'final_amount', v_final_amount,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value
  );
END;
$$;

-- Create function to apply coupon (increment usage)
CREATE OR REPLACE FUNCTION public.apply_coupon(
  p_coupon_id UUID,
  p_registration_id UUID,
  p_email VARCHAR(255),
  p_discount NUMERIC(10,2)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Record usage
  INSERT INTO coupon_usage (coupon_id, registration_id, user_email, discount_applied)
  VALUES (p_coupon_id, p_registration_id, p_email, p_discount);
  
  -- Increment coupon usage count
  UPDATE event_coupons
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = p_coupon_id;
  
  RETURN true;
END;
$$;

-- Create indexes
CREATE INDEX idx_event_coupons_code ON public.event_coupons(UPPER(code));
CREATE INDEX idx_event_coupons_event ON public.event_coupons(event_id);
CREATE INDEX idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_email ON public.coupon_usage(user_email);

-- Trigger for updated_at
CREATE TRIGGER update_event_coupons_updated_at
BEFORE UPDATE ON public.event_coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();