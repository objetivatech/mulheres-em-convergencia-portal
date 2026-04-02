# SEO Pre-rendering para Crawlers

## Visão Geral

Sistema de pre-rendering server-side que gera HTML completo com metadados, Schema.org e conteúdo real do banco de dados para crawlers e bots que não executam JavaScript.

## Arquitetura

```text
Request chega ao Cloudflare Pages
    │
    ├─ É asset (.js, .css, .png)? → Serve diretamente
    │
    ├─ É /rss.xml, /sitemap.xml ou /llms-full.txt? → Proxy para Edge Function existente
    │
    ├─ É crawler (User-Agent match)? → Proxy para seo-prerender
    │   └─ seo-prerender consulta Supabase → retorna HTML completo
    │
    └─ É browser real? → Serve SPA (index.html) normalmente
```

## Componentes

### 1. Cloudflare Pages Function (`functions/[[path]].ts`)

Intercepta todas as requests e decide o tratamento:

- **Assets estáticos**: passa direto (`.js`, `.css`, `.png`, etc.)
- **RSS/Sitemap/llms-full.txt**: proxy para Edge Functions existentes
- **Crawlers em rotas dinâmicas**: proxy para `seo-prerender`
- **Browsers reais**: serve o SPA normalmente

**Detecção de bots** por User-Agent (~40 padrões):
- Motores de busca: Googlebot, Bingbot, Yandexbot, DuckDuckBot, Baiduspider
- Redes sociais: FacebookExternalHit, TwitterBot, LinkedInBot, WhatsApp
- IA: GPTBot, ClaudeBot, PerplexityBot, CohereAI, ByteSpider
- Ferramentas: SEMRush, Ahrefs, Screaming Frog, MJ12bot
- Genéricos: python-requests, curl, wget, UA vazio

**Rotas pre-renderizáveis**:
- `/` (home)
- `/convergindo` e `/convergindo/:slug` (blog)
- `/diretorio` e `/diretorio/:slug` (negócios)
- `/eventos` e `/eventos/:slug` (eventos)
- `/academy` e `/academy/curso/:slug` (cursos)
- `/embaixadoras`
- `/sobre`, `/contato`, `/planos`, `/comunidades`
- `/pagina/:slug`, `/lp/:slug` (page builder)
- `/termos-de-uso`, `/politica-de-privacidade`, `/politica-de-cookies`

### 2. Edge Function `seo-prerender`

**Arquivo**: `supabase/functions/seo-prerender/index.ts`

Recebe `?path=/rota` e retorna HTML completo com:

- `<title>` otimizado com palavras-chave
- `<meta name="description">` específico para a página
- `<link rel="canonical">`
- Open Graph (og:title, og:description, og:url, og:type, og:image)
- Twitter Card (summary_large_image)
- Schema.org JSON-LD dinâmico por tipo de conteúdo
- Conteúdo real do banco de dados em HTML semântico
- Navegação interna com links

**Schema.org por tipo de rota:**

| Rota | Schema.org |
|------|-----------|
| Home | Organization + WebSite + SearchAction |
| Blog post | Article + Organization |
| Negócio | LocalBusiness + Organization |
| Evento | Event + Organization |
| Curso | Course + Organization |
| Demais | Organization |

**Configuração**: `verify_jwt = false` no `config.toml`

**Cache**: `Cache-Control: public, max-age=3600, s-maxage=43200` (1h browser, 12h CDN)

## Headers de Diagnóstico

- `X-Prerendered: true` — presente em respostas pre-renderizadas

## Fallback

Se a Edge Function `seo-prerender` falhar, o Cloudflare Pages Function serve o SPA normalmente (fallback transparente).

Se a rota não for reconhecida pela Edge Function, retorna uma página genérica com metadados do portal.

## Variáveis de Ambiente Necessárias

No Cloudflare Pages:
- `VITE_SUPABASE_URL` — URL do projeto Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Chave anon do Supabase

Na Edge Function:
- `SUPABASE_URL` — (automático no Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` — (automático no Supabase)

## Testando

### Simular um crawler:
```bash
curl -H "User-Agent: Googlebot/2.1" https://mulheresemconvergencia.com.br/convergindo/meu-post
```

### Verificar header de diagnóstico:
```bash
curl -I -H "User-Agent: GPTBot/1.0" https://mulheresemconvergencia.com.br/
```
Deve retornar `X-Prerendered: true`.

### Verificar browser normal:
```bash
curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0" https://mulheresemconvergencia.com.br/
```
Deve retornar o SPA normal (sem `X-Prerendered`).

## Status

✅ Implementado — Abril 2026
