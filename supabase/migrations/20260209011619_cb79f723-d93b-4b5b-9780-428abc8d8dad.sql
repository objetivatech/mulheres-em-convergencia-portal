-- Create ambassador_materials table for managing promotional materials
CREATE TABLE public.ambassador_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'banner', 'pdf', 'whatsapp_template', 'instagram_template'
  category TEXT DEFAULT 'geral', -- 'stories', 'feed', 'reels', 'horizontal', 'square', etc.
  file_url TEXT, -- For banners and PDFs stored in Supabase Storage
  content TEXT, -- For text templates (WhatsApp, Instagram)
  dimensions TEXT, -- For banners: '1200x628', '1080x1080', etc.
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.ambassador_materials IS 'Promotional materials for ambassador program (banners, PDFs, templates)';

-- Enable RLS
ALTER TABLE public.ambassador_materials ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can manage, ambassadors can read active items
CREATE POLICY "Admins can manage ambassador materials"
  ON public.ambassador_materials FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Ambassadors can view active materials"
  ON public.ambassador_materials FOR SELECT
  USING (active = true AND has_role(auth.uid(), 'ambassador'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_ambassador_materials_updated_at
  BEFORE UPDATE ON public.ambassador_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for ambassador materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ambassador-materials',
  'ambassador-materials',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
);

-- Storage policies for ambassador materials bucket
CREATE POLICY "Anyone can view ambassador materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ambassador-materials');

CREATE POLICY "Admins can upload ambassador materials"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ambassador-materials' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update ambassador materials"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ambassador-materials' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete ambassador materials"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ambassador-materials' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Insert initial WhatsApp templates (migrating from hardcoded)
INSERT INTO public.ambassador_materials (title, description, type, category, content, display_order) VALUES
('Convite Simples', 'Mensagem casual de convite para a comunidade', 'whatsapp_template', 'convite', 
'🌟 Oi! Tudo bem?

Você já conhece o Mulheres em Convergência? É uma comunidade incrível de mulheres empreendedoras que se apoiam e crescem juntas!

Eu faço parte e tenho aprendido muito. Acho que você ia amar!

Se quiser conhecer, dá uma olhada aqui: {{LINK}}

Qualquer dúvida, me chama! 💜', 1),

('Destacando Benefícios', 'Mensagem destacando as vantagens da comunidade', 'whatsapp_template', 'beneficios',
'✨ Oii!

Preciso te contar sobre uma comunidade que tem transformado minha jornada empreendedora!

O Mulheres em Convergência oferece:
📚 Conteúdos exclusivos
🤝 Networking com outras mulheres
📅 Eventos e workshops
💡 Apoio mútuo de verdade

Usa meu link para conhecer: {{LINK}}

Me conta o que achou! 💜', 2),

('História Pessoal', 'Template para personalização com experiência pessoal', 'whatsapp_template', 'pessoal',
'🌸 Oi, [NOME]!

Lembrei de você quando estava no evento do Mulheres em Convergência hoje!

Desde que entrei para a comunidade, minha visão sobre empreendedorismo mudou completamente. As mulheres lá são incríveis e o apoio é real.

Achei que você também ia curtir: {{LINK}}

Se inscreve e depois a gente conversa! 💜', 3);

-- Insert initial Instagram templates
INSERT INTO public.ambassador_materials (title, description, type, category, content, display_order) VALUES
('Stories', 'Template para Instagram Stories', 'instagram_template', 'stories',
'🌟 Dica de ouro pra você que empreende!

Conheci uma comunidade que mudou minha forma de ver negócios: @mulheresemconvergencia

✨ Conteúdo exclusivo
✨ Eventos incríveis  
✨ Rede de apoio real

Link na bio pra você conhecer também! 💜

#empreendedorismofeminino #mulheresqueempreendem #comunidade #networking', 1),

('Post Feed', 'Template para post no feed do Instagram', 'instagram_template', 'feed',
'Se você é mulher e empreende (ou quer empreender), precisa conhecer o @mulheresemconvergencia!

É uma comunidade que une mulheres incríveis, com conteúdos, eventos e uma rede de apoio que faz toda a diferença.

Desde que entrei, aprendi tanto e fiz conexões valiosas! 🌟

👉 Link na bio para você conhecer
Use meu código: {{CODIGO}}

Marca aqui uma amiga que precisa conhecer! 💜

#mulheresemconvergencia #empreendedorismo #mulheresqueinspiriam #comunidadefeminina #networking #crescerjuntas', 2),

('Roteiro Reels', 'Script estruturado para Reels', 'instagram_template', 'reels',
'[HOOK] "Se você é mulher e empreende, para tudo!"

[DESENVOLVIMENTO]
Preciso te contar sobre a comunidade que mudou minha vida empreendedora.

O Mulheres em Convergência reúne mulheres incríveis que:
- Compartilham conhecimento
- Fazem networking de verdade
- Se apoiam nos desafios

[CTA]
O link tá na bio! Usa meu código {{CODIGO}} pra entrar 💜

#mulheresquefazem #empreendedorismofeminino', 3);