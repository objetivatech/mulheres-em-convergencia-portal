
-- Create timeline_items table
CREATE TABLE public.timeline_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  date_label TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timeline_items ENABLE ROW LEVEL SECURITY;

-- Public read for active items
CREATE POLICY "Anyone can read active timeline items"
ON public.timeline_items FOR SELECT
USING (active = true);

-- Admin management
CREATE POLICY "Admins can manage timeline items"
ON public.timeline_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND 'admin' = ANY(roles)
  )
);

-- Updated_at trigger
CREATE TRIGGER update_timeline_items_updated_at
BEFORE UPDATE ON public.timeline_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 23 hardcoded items
INSERT INTO public.timeline_items (year, date_label, title, description, image_url, display_order) VALUES
(2015, 'Maio 2015', 'APAE Gravataí', 'Trabalho voluntário na APAE de Gravataí, aulas semanais de artesanato com as mães das crianças e jovens atendidos na entidade. Começamos a perceber as barreiras e dificuldades enfrentadas pelas mulheres.', '/assets/timeline/timeline-apae-gravatai.jpg', 1),
(2015, 'Setembro 2015', 'Aulas de Artesanato', 'Aulas de artesanato para as mulheres da comunidade, Jardim Algarve, em Alvorada parceria com a Rádio Comunitária Acácia FM 87.9.', '/assets/timeline/timeline-aulas-artesanato.jpg', 2),
(2015, '2015 - 2017', 'Multifeira', 'Em um chamamento nas redes sociais, reunimos aproximadamente 20 moradores entre artesãos e empreendedores da área da alimentação e formamos a Multifeira do Jardim Algarve, fazendo feiras mensais nas praças do bairro.', '/assets/timeline/timeline-multifeira.jpg', 3),
(2017, 'Março 2017', 'Ação FGTAS', 'Confecção das carteirinhas de artesão pelo FGTAS, realizada na comunidade. Conseguimos em parceria com a SMDE, trazer os examinadores para realizar mais de 40 carteirinhas, para os artesãos da Multifeira Jardim Algarve e outros das comunidades próximas.', '/assets/timeline/timeline-fgtas.jpg', 4),
(2018, 'Abril 2018', 'Ação ACESSUAS - PMA', 'Parceria com a Secretaria de Assistência Social da Prefeitura de Alvorada, através da diretora do ACESSUAS, Vera Lúcia Alves, aulas sobre letramento digital para artesãs do município.', '/assets/timeline/timeline-acessuas.jpg', 5),
(2019, 'Março - Dezembro 2019', 'Portal da Vida', 'Trabalho voluntário no projeto Portal da Vida, da ativista social Karen Monteiro, escuta ativa de mulheres em situação de vulnerabilidade, encontros quinzenais com as atendidas pelo projeto na sede da Rádio Comunitária Acácia FM.', '/assets/timeline/timeline-portal-vida.jpg', 6),
(2019, 'Agosto - Outubro 2019', 'Motiva Artesão - IFRS', 'Projeto de educação empreendedora, O MOTIVA ARTESÃO, foram 10 aulas sobre empreendedorismo, gestão e planejamento, formamos 20 alunas em parceria com o IFRS Alvorada.', '/assets/timeline/timeline-motiva-artesao.jpg', 7),
(2019, 'Durante 2019', 'Ela Pode - Palestras', 'Trabalho voluntário no projeto Ela Pode, da RME, patrocinado pelo Google, facilitadora de conteúdos sobre empreendedorismo feminino. Feira do Livro, palestra para o grupo Empreendedoras Restinga / Workshop no IFRS Alvorada.', '/assets/timeline/timeline-ela-pode-1.jpg', 8),
(2019, 'Durante 2019', 'Ela Pode - Workshops SENAC', 'Trabalho voluntário no projeto Ela Pode, da RME, patrocinado pelo Google, facilitadora de conteúdos sobre empreendedorismo feminino. Workshop para as alunas do SENAC Comunidade/Porto Alegre.', '/assets/timeline/timeline-ela-pode-2.jpg', 9),
(2019, 'Durante 2019', 'Ela Pode - Comunidades', 'Trabalho voluntário no projeto Ela Pode, da RME, patrocinado pelo Google, facilitadora de conteúdos sobre empreendedorismo feminino. Workshops nas comunidades Vila Elza, Jardim Algarve, Piratini e 11 de Abril em Alvorada.', '/assets/timeline/timeline-ela-pode-3.jpg', 10),
(2019, 'Durante 2019', 'Ela Pode - Centros Profissionalizantes', 'Trabalho voluntário no projeto Ela Pode, da RME, patrocinado pelo Google, facilitadora de conteúdos sobre empreendedorismo feminino. Workshops no Centro Profissionalizante Florestan Fernandes em Alvorada e na Kurti Festas em Viamão.', '/assets/timeline/timeline-ela-pode-4.jpg', 11),
(2019, '2019 - 2022', 'Coletivo TPM', 'Coletivo TPM – Todas Podem Mais – formado a partir do desejo das empreendedoras em continuar formando conexões e aprendendo sobre empreendedorismo feminino; começou no final de 2019, onde conseguimos realizar algumas feiras, durou durante toda pandemia, se mantendo como um grupo de Whatsapp, onde havia troca de informações, indicação de cursos e locais de feiras e eventos. Foi desativado em 2022.', '/assets/timeline/timeline-coletivo-tpm.jpg', 12),
(2019, 'Dezembro 2019', 'Mulheres com Propósito Pepsico', 'Mulheres com Propósito da Pepsico e Banco de Alimentos, participamos das atividades em Porto Alegre, contribuindo com palestras e formações sobre empreendedorismo e gestão.', '/assets/timeline/timeline-mulheres-proposito.jpg', 13),
(2020, 'Durante 2020', 'Eventos Online - Pandemia', 'A partir de abril de 2020 nossas atividades tiveram de mudar de formato. Palestras, cursos, clube de negócios, mentorias, tudo passou a ser online para empreendedoras.', '/assets/timeline/timeline-eventos-online-1.jpg', 14),
(2020, 'Durante 2020', 'Acelera Empreendedora Online', 'Continuidade dos eventos online durante a pandemia, mantendo o apoio às empreendedoras através de palestras, cursos e networking virtual.', '/assets/timeline/timeline-eventos-online-2.jpg', 15),
(2020, '2020 - 2021', 'Podcast Convergência Feminina', 'Em abril de 2021, nasce o Podcast Convergência Feminina, que começa de forma solo. Em novembro de 2022 com a flexibilização da pandemia, acontecem as primeiras entrevistas com convidadas. Está pausado agora, mas voltaremos com certeza, quem sabe em 2026.', '/assets/timeline/timeline-podcast.jpg', 16),
(2021, '2021 - 2023', 'Economia Solidária Alvorada', 'Participamos dos encontros para reativação e fortalecimento da economia solidária no município de Alvorada, representando o coletivo TPM.', '/assets/timeline/timeline-economia-solidaria.jpg', 17),
(2022, 'Fevereiro 2022', 'Nasce o projeto Mulheres em Convergência', 'Nasce também o MULHERES EM CONVERGÊNCIA, programa de capacitação de empreendedoras, o primeiro encontro foi no jardim Algarve em Alvorada, com um pequeno grupo de mulheres.', '/assets/timeline/timeline-projeto-nasce.jpg', 18),
(2022, 'Março 2022', 'Projeto - Morro Santana', 'Capacitação no Bairro Morro Santana em Porto Alegre, com o grupo de mulheres do coletivo Bazarte no morro. 1º encontro em abril.', '/assets/timeline/timeline-projeto-morro-santana.jpg', 19),
(2022, 'Abril 2022', 'Projeto - Sumaré', 'Capacitação no Bairro Sumaré em Alvorada, com o grupo de mulheres do coletivo TPM.', '/assets/timeline/timeline-projeto-sumare.jpg', 20),
(2022, 'Abril 2022', 'Projeto - Formosa', 'Capacitação no Bairro Formosa em Alvorada, com o grupo de mulheres do coletivo TPM.', '/assets/timeline/timeline-projeto-formosa.jpg', 21),
(2022, 'Maio 2022', 'Acelera Empreendedora Presencial', 'Realizamos um encontro presencial de empreendedoras, o ACELERA EMPREENDEDORA, onde reunimos mais de 40 mulheres. Tivemos palestras, pitch e rodada de negócios.', '/assets/timeline/timeline-acelera-empreendedora.jpg', 22),
(2022, 'Junho 2022', 'Workshop Planejamento Financeiro', 'Workshop sobre Organização e Produtividade, realizado no Bairro Jardim Algarve.', '/assets/timeline/timeline-planejamento-financeiro.jpg', 23),
(2023, 'Outubro 2023', 'Palestra Centro Adelino Borba', 'Palestra sobre Empreendedorismo – Mais Mulheres a frente de negócios – realizada no centro municipal de capacitação profissional Adelino Borba, em Alvorada.', '/assets/timeline/timeline-adelino-borba.jpg', 24);
