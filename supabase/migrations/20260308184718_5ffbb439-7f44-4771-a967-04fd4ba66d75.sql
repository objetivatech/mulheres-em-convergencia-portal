
-- ============================================
-- Etapa 4: Tabela de Dados Socioeconômicos
-- ============================================

CREATE TABLE public.user_socioeconomic_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- Dados pessoais
  race_ethnicity text,
  gender_identity text,
  date_of_birth date,
  marital_status text,
  -- Educação e trabalho
  education_level text,
  employment_status text,
  monthly_income text,
  -- Moradia
  housing_situation text,
  household_size integer,
  city text,
  state text,
  neighborhood text,
  -- Empreendedorismo
  has_business boolean DEFAULT false,
  business_sector text,
  business_formalization text,
  business_monthly_revenue text,
  years_in_business integer,
  -- Engajamento
  main_challenges text[],
  how_discovered text,
  motivation text,
  areas_of_interest text[],
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER trigger_user_socioeconomic_updated_at
  BEFORE UPDATE ON public.user_socioeconomic_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.user_socioeconomic_data ENABLE ROW LEVEL SECURITY;

-- Usuário lê/edita os próprios dados
CREATE POLICY "Users can view own socioeconomic data"
  ON public.user_socioeconomic_data
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own socioeconomic data"
  ON public.user_socioeconomic_data
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own socioeconomic data"
  ON public.user_socioeconomic_data
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin lê todos
CREATE POLICY "Admins can view all socioeconomic data"
  ON public.user_socioeconomic_data
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Índice
CREATE INDEX idx_user_socioeconomic_user_id ON public.user_socioeconomic_data(user_id);
