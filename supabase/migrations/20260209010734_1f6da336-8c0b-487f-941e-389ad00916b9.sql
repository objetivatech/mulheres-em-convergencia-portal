-- Create ambassador_faq_items table for FAQ content management
CREATE TABLE public.ambassador_faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.ambassador_faq_items IS 'FAQ items for ambassador program, managed via admin panel';

-- Enable RLS
ALTER TABLE public.ambassador_faq_items ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can manage, ambassadors can read active items
CREATE POLICY "Admins can manage ambassador FAQ items"
  ON public.ambassador_faq_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Ambassadors can view active FAQ items"
  ON public.ambassador_faq_items FOR SELECT
  USING (active = true AND has_role(auth.uid(), 'ambassador'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_ambassador_faq_items_updated_at
  BEFORE UPDATE ON public.ambassador_faq_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial FAQ content in Portuguese
INSERT INTO public.ambassador_faq_items (question, answer, category, display_order) VALUES
-- Sobre o programa
('Como funciona o programa de embaixadoras?', 
'O programa de embaixadoras permite que você compartilhe um link único de indicação. Quando alguém se cadastra e assina através do seu link, você recebe uma comissão de 15% sobre o valor da assinatura. Acompanhe tudo pelo seu painel.', 
'sobre', 1),

('Qual é a taxa de comissão?', 
'A comissão padrão é de 15% sobre o valor da primeira mensalidade da assinatura. Por exemplo, em um plano de R$ 100/mês, você recebe R$ 15 de comissão.', 
'sobre', 2),

('Preciso pagar algo para participar?', 
'Não! O programa é 100% gratuito. Você só precisa ser uma associada ativa do Mulheres em Convergência.', 
'sobre', 3),

-- Como indicar
('Como gero meu link de indicação?', 
'No seu painel de embaixadora, você encontra seu link único na seção "Compartilhar Link". Basta copiar e enviar para suas contatas. Você também pode gerar um QR Code personalizado.', 
'indicacao', 1),

('Posso compartilhar meu link em redes sociais?', 
'Sim! Compartilhe à vontade no Instagram, WhatsApp, Facebook ou qualquer outra plataforma. Preparamos materiais prontos para facilitar sua divulgação.', 
'indicacao', 2),

('Quanto tempo meu link fica válido?', 
'Seu link é permanente enquanto você for embaixadora ativa. Se alguém clicar no seu link, o cookie de rastreamento fica ativo por 30 dias.', 
'indicacao', 3),

-- Pagamentos
('Quando recebo minhas comissões?', 
'As comissões são pagas todo dia 10 de cada mês. Vendas confirmadas até o dia 20 do mês anterior entram no pagamento. Exemplo: vendas confirmadas até 20/fev são pagas em 10/mar.', 
'pagamento', 1),

('Qual o valor mínimo para saque?', 
'O valor mínimo para receber o pagamento é de R$ 50. Se você acumular menos que isso em um mês, o valor é transferido para o próximo ciclo.', 
'pagamento', 2),

('Como recebo o pagamento?', 
'Você pode receber via PIX (preferencial) ou transferência bancária. Configure seus dados de pagamento nas configurações do seu painel.', 
'pagamento', 3),

-- Rastreamento
('Como acompanho minhas indicações?', 
'No seu painel você visualiza em tempo real: cliques no link, cadastros realizados, vendas confirmadas e comissões pendentes/pagas.', 
'rastreamento', 1),

('O que acontece se a pessoa não assinar na hora?', 
'Não se preocupe! Quando alguém clica no seu link, salvamos um cookie que fica ativo por 30 dias. Se ela voltar e assinar dentro desse período, a indicação é sua.', 
'rastreamento', 2),

-- Dicas
('Quais são as melhores formas de divulgar?', 
'Compartilhe sua experiência pessoal com a comunidade. Histórias reais conectam! Use os materiais prontos que preparamos e personalize com sua história. WhatsApp e Instagram costumam ter ótimos resultados.', 
'dicas', 1),

('Posso indicar qualquer pessoa?', 
'Sim, qualquer mulher interessada em fazer parte do Mulheres em Convergência pode ser indicada. Não há limite de indicações!', 
'dicas', 2);