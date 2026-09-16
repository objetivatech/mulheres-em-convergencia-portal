# Edição rica, textos gerenciáveis, Conecta+ e planos flexíveis

Seis pedidos, organizados em quatro entregas. Tudo no banco novo (MeC-v6), sem tocar o antigo.

## Etapa 1 — Editor rico em todo lugar (pedido 1)

Um único editor visual (o mesmo TipTap que já existe no projeto), com: títulos, negrito/itálico, listas, links, citações, **tabelas**, **imagens**, vídeos e blocos de destaque. Quem edita nunca vê código.

Onde passa a existir:
- Páginas institucionais
- Textos do blog
- Descrição de eventos e de planos
- Ficha de negócios (descrição)
- Bio das pessoas (perfil e Conecta+)
- Cursos e aulas da Academy
- Materiais e apresentação de embaixadoras

Imagens: botão "Enviar imagem" que sobe direto para o Cloudflare R2 já existente, com recorte antes de enviar. O conteúdo antigo em HTML é convertido automaticamente na primeira abertura, sem perda.

**Ação sua:** quando eu pedir, colar as chaves do R2 no campo seguro (conta, chave, segredo, bucket e domínio público). Sem elas, o upload não funciona no ambiente novo.

## Etapa 2 — Todo texto e imagem editável pelo painel (pedido 2)

Modo "Editar página": logada como administradora, um botão flutuante liga o modo de edição. Cada texto e cada imagem do site ganha um lápis; clicar abre o editor no próprio lugar e salvar publica na hora.

Cobre cabeçalho, rodapé, menus, home, diretório, planos, eventos, Academy, Conecta+, páginas de erro, mensagens de formulário e botões. Nenhum texto fica preso no código.

No painel também fica uma lista "Textos do site", agrupada por página, para quem preferir editar tudo de uma vez ou buscar por palavra.

## Etapa 3 — Conecta+ completo (pedido 3)

Ambiente de networking com tudo que existia antes:
- Perfil Conecta+ (empresa, cargo, bio rica, redes)
- Grupos e facilitadoras
- Encontros do grupo, com presença
- Reuniões 1-a-1 registradas
- Indicações e negócios fechados com valor
- Depoimentos entre associadas
- Convites para visitantes, com código
- Conteúdos (vídeos, documentos, artigos)
- Pontuação, níveis e ranking mensal
- Mural de atividades
- Painel da equipe: grupos, moderação, pontos e relatórios

Níveis de acesso: administradora, facilitadora, membro (plano ativo) e convidada (acesso limitado).

## Etapa 4 — Planos e eventos gerenciáveis, com ofertas privadas (pedidos 4, 5 e 6)

Planos:
- Criar, editar, duplicar, reordenar e desativar planos pelo painel — nada mais fixo no código
- Definir preço, periodicidade, duração do acesso, benefícios e quais áreas o plano libera (diretório, Academy, Conecta+, Embaixadoras, eventos)
- **Visibilidade:** público (aparece na página de planos), oculto (só por link direto) ou privado por convite (link com código, válido por prazo e com limite de usos)
- Cada oferta privada gera um link próprio de pagamento; o acesso é liberado pelo mesmo caminho automático de hoje

Eventos:
- Criar e editar eventos completos: capa, descrição rica, data, local ou online, vagas
- Lotes com preço, período e vagas
- Cupons de desconto
- Palestrantes
- Inscrições, presença e ingresso
- Publicar/despublicar e destacar

## Detalhes técnicos

- Editor: TipTap já presente em `src/components/editor/`, estendido com upload R2 via `useR2Storage` e `ImageCropUploader`; conteúdo salvo como documento do editor, com conversão automática do HTML legado (`migrateBlocksToTipTap`).
- Secrets R2 a cadastrar no projeto `tysvpeprhokdijquprkd` e a função `r2-storage` a publicar lá.
- Textos do site: tabela nova `textos_site` (chave, escopo, valor, tipo) com leitura pública em cache e escrita restrita a admin/editora; componente `<Texto chave=...>` substitui literais nas telas; modo de edição in-place para admin.
- Conecta+: migração `reboot/sql/0009_conecta_completo.sql` com perfis, grupos, encontros, presenças, 1-a-1, indicações, negócios, depoimentos, convites, conteúdos, pontos e ranking — RLS e GRANTs explícitos por tabela, pontuação calculada por view (sem estado derivado gravado).
- Planos: acrescentar `visibilidade`, `codigo_oferta`, `validade_oferta`, `limite_usos` e conteúdo rico a `planos`; `/planos` filtra por visibilidade pública; rota `/planos/oferta/:codigo` para ofertas privadas; `criar-cobranca` valida a oferta antes de gerar o link.
- Eventos: CRUD completo em `/painel-conteudo/planos-eventos`, com abas de lotes, cupons e palestrantes sobre as tabelas já existentes.
- Documentação tripla e changelog atualizados a cada etapa.

## Ordem de execução

1. Editor rico + R2 (base das demais)
2. Textos do site editáveis
3. Planos e eventos gerenciáveis, com ofertas privadas
4. Conecta+ completo
