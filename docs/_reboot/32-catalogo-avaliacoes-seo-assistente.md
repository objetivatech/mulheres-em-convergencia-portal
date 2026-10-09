# 32 — Catálogo de produtos, avaliações, SEO/Schema e assistente de divulgação

## 1. Técnico

### Banco
- `negocio_produtos` — nome*, descricao*, valor_centavos, categoria, link_compra, fotos text[] (máx. 3), destaque_tag (`destaque|promocao|oferta|mais_vendido`), ordem, ativo.
  RLS: leitura segue a visibilidade do negócio (herda o RLS de `negocios`); escrita só dona (`pessoa_atual()`) ou `e_admin()`.
- `negocio_avaliacoes` — avaliador_nome, nota 1–5, comentario, status `pendente|aprovado|rejeitado`.
  Visitante (anon ou logada) só insere com `status = 'pendente'` em negócio publicado; público lê só `aprovado`; dona/admin leem tudo e moderam; exclusão só admin.
- Média e total são calculados na consulta (`useResumoAvaliacoes`) — nada derivado gravado.

### Frontend
- `src/hooks/useCatalogo.ts` — produtos, avaliações, moderação.
- `src/components/negocio/GerenciarCatalogo.tsx` — formulário (dona em Minha área → Meu negócio; equipe em Painel → Negócios) + `ModerarAvaliacoes`.
- `src/components/negocio/CatalogoPublico.tsx` — abas por categoria, miniaturas, galeria, botão de compra (link ou WhatsApp com texto pronto) e formulário de avaliação.
- `Estrelas.tsx` — resumo ★ nos cards (capa e diretório) e no cabeçalho do negócio.
- Capa: os 20 tipos (`negocios.categoria`) mais frequentes entre publicados, agrupados sem diferenciar maiúsculas/acentos, filtram a grade 3×3. `/diretorio?categoria=` e `?busca=` são lidos da URL.
- Fotos de produto vão para `usuarias/<uid>/produtos/` (apelido `negocios-produtos` no `r2-storage`).

### SEO, Schema.org e IA
- `supabase/functions/_shared/seo.ts` — constantes e utilitários comuns.
- `seo-prerender` reescrito para o banco novo (antes lia tabelas do legado e devolvia vazio): HTML + JSON-LD para `/`, `/diretorio`, `/diretorio/:slug` (LocalBusiness + AggregateRating + Review + OfferCatalog/Product/Offer + GeoCoordinates), `/convergindo[/:slug]` (BlogPosting), `/eventos[/:slug]` (Event + Offer), `/academy[/curso/:slug]` (Course), `/planos` (OfferCatalog), `/sobre` e `/pagina/:slug`. BreadcrumbList em todas as internas. Usa a chave pública: o que o RLS esconde do site não vai para buscadores.
- `generate-sitemap` e `generate-llms-full` reescritos para o banco novo (incluem produtos no llms-full).
- `NegocioPage` injeta o mesmo JSON-LD, canonical e Open Graph no navegador.
- `robots.txt`: bloqueia `/painel-conteudo/`, `/minha-area/`, `/auth`; libera GPTBot, PerplexityBot, ClaudeBot e Google-Extended.

### Assistente de divulgação (IA)
- Função `mensagem-embaixadora` — valida sessão, exige embaixadora **ativa**, monta o link `…/planos?indicacao=<codigo>` a partir do banco (nunca do navegador) e chama o Lovable AI Gateway (`/v1/responses`, `openai/gpt-6-astra`, streaming lido no servidor). Garante o link no texto final. Erros 429/402 viram mensagens amigáveis.
- Tela: `src/components/area/AssistenteDivulgacao.tsx` em Minha área → Embaixadoras.

## 2. Operacional (equipe)
- Revisar catálogo: Painel → Negócios → abrir negócio → "Produtos e serviços".
- Avaliações: chegam "Aguardando"; a dona ou a equipe clica em "Publicar" ou "Recusar".
- Padronizar "Tipo de negócio" (ex.: só "Consultoria") para os selos da capa não se repetirem.
- Buscadores: nada a fazer — publicar já atualiza mapa do site, páginas para buscadores e o arquivo para IAs.
- Uso de IA consome créditos do workspace Lovable. Se acabar, a embaixadora vê "créditos de IA acabaram".

## 3. Manual para leigas
**Produtos:** Meu negócio → Produtos e serviços → Adicionar → nome e descrição → (valor, categoria, fotos, link ou "Usar meu WhatsApp", selo) → Salvar.
**Avaliações:** clientes deixam estrelas na sua página. Você recebe em "Avaliações recebidas" e decide o que aparece.
**Embaixadoras:** em Embaixadoras → Assistente de divulgação, escolha o que divulgar, para quem e onde. Clique em "Criar mensagem", depois "Copiar" ou "Abrir no WhatsApp".
