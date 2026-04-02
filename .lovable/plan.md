

# Plano: Pre-rendering SEO para Mulheres em Convergência

## Contexto

O projeto Ranktop implementou um sistema de **pre-rendering server-side** com duas camadas:
1. **Cloudflare Worker** — intercepta requests de crawlers (Googlebot, GPTBot, etc.) baseado no User-Agent
2. **Edge Function `seo-prerender`** — gera HTML completo com metadados, Schema.org e conteúdo real do banco de dados

O MeC já possui uma base SEO sólida (title otimizado, canonical, Schema.org estático, noscript com conteúdo semântico no `index.html`, llms.txt, sitemap, RSS). Porém, o conteúdo **dinâmico** (posts do blog, negócios do diretório, eventos, páginas do page builder, cursos da Academy) continua invisível para crawlers que não executam JavaScript — eles veem sempre o mesmo `index.html` genérico independente da URL acessada.

## O que falta no MeC

| Recurso | Ranktop | MeC |
|---------|---------|-----|
| Pre-render de páginas dinâmicas | Edge Function completa | Apenas `<noscript>` genérico na home |
| Cloudflare Worker para detectar crawlers | Sim | Apenas proxy de RSS/Sitemap |
| HTML com conteúdo real por rota para bots | Sim (blog, serviços, FAQ, home) | Nao — bots veem sempre o mesmo HTML |
| Schema.org dinâmico server-side | Sim (Article, Service, FAQ) | Apenas client-side via Helmet |

## Solução Proposta

### 1. Criar Edge Function `seo-prerender` no MeC

Edge Function que recebe `?path=/convergindo/meu-post` e retorna HTML completo com:

**Rotas suportadas:**
- `/` — Home com lista de posts recentes, negócios em destaque, eventos próximos
- `/convergindo` — Lista de posts do blog
- `/convergindo/:slug` — Post individual com conteúdo completo, Schema Article
- `/diretorio` — Lista de negócios
- `/diretorio/:slug` — Página do negócio com Schema LocalBusiness
- `/eventos` — Lista de eventos
- `/eventos/:slug` — Evento individual com Schema Event
- `/academy` — Catálogo de cursos
- `/academy/curso/:slug` — Curso individual com Schema Course
- `/embaixadoras` — Página de embaixadoras
- `/sobre`, `/contato`, `/planos`, `/comunidades` — Páginas estáticas com metadados corretos
- `/pagina/:slug` — Páginas do Page Builder
- `/lp/:slug` — Landing pages dinâmicas

**Cada resposta inclui:**
- `<title>` e `<meta description>` corretos para a página
- `<link rel="canonical">`
- Open Graph e Twitter Card
- Schema.org JSON-LD (Article, LocalBusiness, Event, Course, Organization conforme a rota)
- Conteúdo real do banco de dados em HTML semântico (h1, h2, p, links)
- Links internos de navegação

### 2. Atualizar Cloudflare Pages Function

Expandir `functions/[[path]].ts` para:
- Detectar crawlers por User-Agent (mesma lista do Ranktop: Googlebot, GPTBot, ClaudeBot, etc.)
- Quando for crawler, fazer proxy para a Edge Function `seo-prerender`
- Quando for browser real, servir o SPA normalmente
- Manter o proxy existente de RSS/Sitemap
- Adicionar header `X-Prerendered: true` para diagnóstico

### 3. Corrigir build error do `r2-storage`

Trocar `import { AwsClient } from "npm:aws4fetch@1.0.20"` por `import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20"` (mesmo fix que já foi aplicado ao `optimize-image`).

### 4. Documentação

- Criar `docs/_active/06-funcionalidades/seo-prerender.md` com arquitetura completa
- Atualizar `docs/_active/06-funcionalidades/rss-sitemap-schema.md`
- Atualizar `docs/_active/06-funcionalidades/cloudflare-pages-deploy.md`

## Arquitetura

```text
Request chega ao Cloudflare Pages
    │
    ├─ É asset (.js, .css, .png)? → Serve diretamente
    │
    ├─ É /rss.xml ou /sitemap.xml? → Proxy para Edge Function existente
    │
    ├─ É crawler (User-Agent match)? → Proxy para seo-prerender
    │   └─ seo-prerender consulta Supabase → retorna HTML completo
    │
    └─ É browser real? → Serve SPA (index.html) normalmente
```

## Detalhes de Implementação

**Edge Function `seo-prerender`** (~400 linhas):
- Usa `SUPABASE_SERVICE_ROLE_KEY` para ler dados
- Cache-Control de 1h (3600s) + s-maxage de 12h para CDN
- Fallback para página genérica se rota não reconhecida
- `verify_jwt = false` no config.toml

**Cloudflare Pages Function** (expansão do `functions/[[path]].ts` existente):
- Lista de ~40 User-Agents de crawlers e bots de IA
- Detecção de bots genéricos (python-requests, curl, UA vazio)
- Detecção de browser real (Mozilla + Chrome/Firefox/Safari)

## Riscos e Cuidados

- **Conexões internas não são afetadas**: o pre-render é exclusivo para crawlers; browsers reais continuam recebendo o SPA
- **Cloudflare Pages Function já existe**: apenas expandimos, sem quebrar proxy de RSS/Sitemap
- **Sem alteração em componentes React**: nenhuma mudança no frontend
- **Sem alteração em banco de dados**: apenas leitura

## Consumo de Créditos

Este plano envolve:
- 1 arquivo novo (Edge Function `seo-prerender/index.ts`)
- 1 arquivo expandido (`functions/[[path]].ts`)
- 1 fix de 1 linha (`r2-storage/index.ts`)
- 3 arquivos de documentação
- 1 linha no `config.toml`

Estimo execução em 2-3 mensagens de implementação, focando em precisão para evitar retrabalho.

