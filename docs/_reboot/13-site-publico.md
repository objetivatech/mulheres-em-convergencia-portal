# 13 — Site público (técnico)

> Fase 4. Home, diretório, blog e páginas institucionais reescritos sobre o banco novo (MeC-v6).

## Banco

Migration `reboot/sql/0004_site_publico.sql`, já aplicada em `tysvpeprhokdijquprkd`.

| Tabela | Papel |
|---|---|
| `negocios` | Ficha pública do negócio (slug, contatos, capa, logo, destaque, `publicado`) |
| `negocio_midias` | Galeria por negócio |
| `negocio_areas_atendimento` | Onde o negócio atende |
| `negocio_comodidades` | Etiquetas de comodidade |
| `autores` | Autoria dos textos |
| `posts` | Texto do blog (`situacao`, `publicado_em`, SEO) |
| `post_categorias`, `post_tags`, `post_categoria_vinculo`, `post_tag_vinculo` | Taxonomia |
| `post_comentarios` | Comentários com aprovação; e-mail nunca exposto ao público |
| `paginas` | Institucionais (`sobre`, `termos-de-uso`, `politica-de-privacidade`, `politica-de-cookies`) |
| `blocos_site` | Conteúdo editável da home (`home_hero`, `home_pilares`) |

Regras de visibilidade (RLS):

- Negócio aparece no diretório apenas se `publicado` **e** `acesso_vigente(pessoa_id, 'diretorio')` — visibilidade é consulta a concessão vigente, nunca campo derivado.
- Post e página aparecem com `situacao = 'publicado'` e `publicado_em <= now()`.
- Bloco aparece com `ativo = true`.

## Front

| Arquivo | Papel |
|---|---|
| `src/hooks/useSite.ts` | Todas as consultas do site público (react-query) |
| `src/components/site/SiteLayout.tsx` | Cabeçalho, navegação e rodapé do site novo |
| `src/pages/site/HomePage.tsx` | Home: hero e pilares vindos de `blocos_site`, negócios, blog, chamada final |
| `src/pages/site/DiretorioPage.tsx` | Lista com busca e filtro por categoria |
| `src/pages/site/NegocioPage.tsx` | Ficha do negócio: contatos, comodidades, áreas, galeria |
| `src/pages/site/BlogPage.tsx` | Lista de textos com busca e categorias |
| `src/pages/site/BlogPostPage.tsx` | Texto completo + JSON-LD `BlogPosting` |
| `src/pages/site/PaginaInstitucional.tsx` | Render de `paginas` por slug (fixo na rota ou `:slug`) |

Rotas trocadas em `src/App.tsx`: `/`, `/diretorio`, `/diretorio/:slug`, `/convergindo`, `/convergindo/:slug`, `/sobre`, `/termos-de-uso`, `/politica-de-privacidade`, `/politica-de-cookies`.

As telas antigas correspondentes (`Index`, `Diretorio`, `DiretorioEmpresa`, `Convergindo`, `Post`, `Sobre`, institucionais) continuam no repositório sem rota, como referência de paridade até a Fase 7.

## Design

Somente tokens semânticos (`bg-card`, `text-muted-foreground`, `var(--sombra-1)`, `var(--grad-marca)`); nenhuma cor literal.

## SEO

Título abaixo de 60 caracteres em cada página, meta description própria, um único H1, `loading="lazy"` nas imagens e JSON-LD de `BlogPosting` no texto do blog.

## Atualização 2026-10-05 — Diretório, capa, menu e eventos (técnico)
- `src/lib/embaralhar.ts` (Fisher-Yates) + `useTodosNegocios()` em `useSite.ts`: todos os negócios publicados, sem limite; ordem sorteada a cada montagem da página (Home e Diretório).
- Diretório filtra no navegador; o filtro de tipos é derivado dos negócios publicados (tipo sem negócio some, tipo novo aparece sozinho).
- Home: grade 3x3 (`POR_PAGINA = 9`) com paginação.
- Mapa: só aparece quando há negócio com latitude/longitude. `CampoLocalizacao` (`src/components/negocio/`) geocodifica bairro+cidade via Nominatim/OpenStreetMap (sem chave) e aceita colar "lat, lng" do Google Maps. Usado em Meu Negócio e no editor da equipe. Tour `meu-negocio` subiu para versão 2.
- Menu: rótulos lidos de `textos_site` (chaves `menu.*`, grupo "Menu do site").
- Eventos: slider Embla com os 3 próximos; cards com capa 16:9, data, Presencial/Online, Gratuito ou menor valor dos lotes ativos (`menorValorEvento`) e botão de inscrição.
