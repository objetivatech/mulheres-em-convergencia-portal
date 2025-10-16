-- Create FAQ items table
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage FAQ items
CREATE POLICY "Admins can manage FAQ items"
  ON public.faq_items
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view active FAQ items
CREATE POLICY "Everyone can view active FAQ items"
  ON public.faq_items
  FOR SELECT
  USING (active = true);

-- Create index for performance
CREATE INDEX idx_faq_items_category_order ON public.faq_items(category, display_order);

-- Trigger for updated_at
CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert initial FAQ data
INSERT INTO public.faq_items (question, answer, category, display_order) VALUES
-- Seção 1: Sobre a Assinatura
('O que está incluído na assinatura?', 'Cada plano inclui: cadastro completo do seu negócio no diretório, destaque com logo e galeria de fotos, dados de contato visíveis (telefone, WhatsApp, email), horário de funcionamento, avaliações de clientes, e acesso a eventos exclusivos da comunidade. Planos superiores incluem também mentoria, descontos em eventos e múltiplos perfis de negócio.', 'sobre', 1),
('Qual a diferença entre os planos?', 'Plano Iniciante: 1 negócio, presença básica no diretório. Plano Intermediário: 1 negócio + 2h mentoria/mês + 10% desconto em eventos. Plano Impulso: até 3 negócios + 5h mentoria/mês + 20% desconto em eventos + selo "Destaque Premium". Todos incluem perfil completo e suporte da comunidade.', 'sobre', 2),
('Posso trocar de plano depois?', 'Sim! Você pode fazer upgrade (melhorar) ou downgrade (reduzir) seu plano a qualquer momento acessando seu painel de assinatura. O valor será ajustado proporcionalmente no próximo período de cobrança.', 'sobre', 3),
('Como funciona a renovação automática?', 'Sua assinatura renova automaticamente no vencimento (mensal, semestral ou anual). Você recebe email 7 dias antes com lembrete. Caso não deseje renovar, pode cancelar até 3 dias antes do vencimento sem custos adicionais.', 'sobre', 4),

-- Seção 2: Processo de Pagamento
('Quais formas de pagamento são aceitas?', 'Aceitamos: PIX (confirmação instantânea), Boleto bancário (compensação em até 3 dias úteis) e Cartão de crédito (parcele em até 12x). O PIX é recomendado para ativação imediata do seu perfil.', 'pagamento', 5),
('Quando meu negócio aparece no diretório?', 'Com pagamento via PIX: imediatamente após confirmação (geralmente em segundos). Com boleto: em até 3 dias úteis após compensação. Com cartão: aprovação em até 24h. Você receberá email assim que seu perfil estiver ativo.', 'pagamento', 6),
('Recebo nota fiscal/recibo?', 'Sim! A nota fiscal/recibo é gerada automaticamente e enviada para seu email cadastrado em até 48h após confirmação do pagamento. Você também pode baixá-lo pelo painel de assinatura.', 'pagamento', 7),
('Posso parcelar no cartão?', 'Sim! Planos anuais podem ser parcelados em até 12x sem juros no cartão de crédito. Planos mensais não possuem parcelamento devido ao valor reduzido.', 'pagamento', 8),

-- Seção 3: Como Preencher Corretamente
('Como preencher o CPF/CNPJ?', 'CPF: digite apenas números (11 dígitos). Exemplo: 12345678901. O sistema formata automaticamente para 123.456.789-01. CNPJ: digite 14 dígitos. Exemplo: 12345678000199. Sistema formata para 12.345.678/0001-99. Não use pontos, traços ou barras na digitação.', 'preenchimento', 9),
('Meu telefone precisa ter DDD?', 'Sim! Obrigatoriamente. Digite DDD + número com 8 ou 9 dígitos. Exemplos corretos: (51) 99999-9999 (celular) ou (51) 3333-4444 (fixo). O sistema aceita apenas números, então pode digitar 51999999999 que formatamos automaticamente.', 'preenchimento', 10),
('O que fazer se meu CEP não for encontrado?', 'Se o CEP não retornar endereço automaticamente, preencha manualmente os campos de endereço, bairro, cidade e estado. Isso pode ocorrer em regiões rurais ou loteamentos novos. Certifique-se de que o CEP está correto (8 dígitos).', 'preenchimento', 11),
('Posso usar endereço comercial diferente do residencial?', 'Sim! O endereço solicitado no formulário é para cobrança/cadastro. Ao criar seu perfil de negócio no painel, você pode cadastrar um endereço comercial diferente que aparecerá no diretório público.', 'preenchimento', 12),

-- Seção 4: Soluções para Erros Comuns
('CPF já cadastrado - o que fazer?', 'Se você já tem cadastro: clique em "Fazer Login" e acesse sua conta. Se o CPF é seu mas você não se lembra da senha: use "Esqueci minha senha" na tela de login. Se o CPF não é seu: use outro CPF ou entre em contato com suporte para investigação.', 'erros', 13),
('Formulário fechou antes de finalizar - como retomar?', 'Atualizamos o sistema! Agora o formulário NÃO fecha mais em caso de erro de validação. Se fechou, reabra clicando novamente no botão "Assinar" do plano escolhido. Seus dados NÃO são salvos automaticamente por segurança, então preencha novamente.', 'erros', 14),
('Não recebi o link de pagamento - e agora?', 'Verifique sua caixa de spam/lixo eletrônico. O email vem de noreply@asaas.com. Se não encontrar, acesse seu painel de assinatura onde o link de pagamento fica disponível por 7 dias. Ou entre em contato conosco via WhatsApp.', 'erros', 15),
('Minha assinatura não foi ativada - quanto tempo demora?', 'PIX: ativação em até 5 minutos. Boleto: até 3 dias úteis após pagamento. Cartão: até 24h após aprovação. Se ultrapassar esses prazos, entre em contato enviando comprovante de pagamento via email ou WhatsApp do suporte.', 'erros', 16),

-- Seção 5: Casos Especiais
('Já tenho cadastro no portal - posso assinar?', 'Sim! Faça login antes de escolher o plano. O sistema reconhecerá sua conta e preencherá automaticamente seus dados cadastrais. Você só precisará confirmar ou atualizar informações de cobrança.', 'especiais', 17),
('Tive assinatura antes - posso reativar?', 'Sim! Mesmo que tenha cancelado ou sua assinatura tenha expirado, você pode assinar novamente. Faça login e escolha o plano. Seus negócios cadastrados anteriormente serão reativados automaticamente após confirmação do pagamento.', 'especiais', 18),
('Meu negócio é cortesia - preciso assinar?', 'Não! Se seu negócio está marcado como cortesia (gratuito), ele permanece ativo indefinidamente sem necessidade de assinatura. Você verá uma mensagem clara ao tentar assinar. Entre em contato com a administração caso queira remover a cortesia e assinar normalmente.', 'especiais', 19),
('Posso ter mais de um negócio?', 'Sim! Plano Iniciante: 1 negócio. Plano Intermediário: 1 negócio. Plano Impulso: até 3 negócios. Se precisar de mais perfis, contate-nos para planos customizados ou faça upgrade para o Plano Impulso.', 'especiais', 20),

-- Seção 6: Vantagens de Ser Assinante
('Destaque no diretório', 'Assinantes aparecem com logo destacada, perfil completo com galeria de fotos, dados de contato visíveis (telefone, email, WhatsApp, Instagram) e horário de funcionamento. Plano Impulso recebe selo "Premium" e posição prioritária nas buscas.', 'vantagens', 21),
('Acesso a eventos exclusivos', 'Participe de workshops, mentorias em grupo, networking presencial, lives com especialistas e feiras de negócios exclusivas para associadas. Planos superiores garantem descontos de até 20% em eventos pagos.', 'vantagens', 22),
('Certificado digital de associada', 'Receba certificado digital em PDF comprovando sua associação à rede Mulheres em Convergência. Use em propostas comerciais, redes sociais e assinatura de email para aumentar sua credibilidade.', 'vantagens', 23),
('Networking com outras empresárias', 'Acesse grupo privado no WhatsApp/Telegram com centenas de empresárias da rede. Troque experiências, faça parcerias, encontre fornecedoras confiáveis e participe de grupos de compra coletiva.', 'vantagens', 24),
('Conteúdo educativo premium', 'Acesso ao blog com artigos sobre gestão, marketing digital, legislação para MEI, casos de sucesso, templates de contratos e ferramentas gratuitas. Planos superiores incluem mentorias 1:1 com especialistas.', 'vantagens', 25);
