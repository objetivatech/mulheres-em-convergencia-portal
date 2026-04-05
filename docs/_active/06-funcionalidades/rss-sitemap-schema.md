# RSS, Sitemap, Schema.org, SEO Estático e Visibilidade para IA Generativa

## Visão Geral

Sistema SEO completo do portal Mulheres em Convergência, incluindo RSS Feed, Sitemap XML, Schema.org, llms.txt, meta tags otimizadas, conteúdo SEO estático no `index.html` e visibilidade em ferramentas de IA generativa.

## Funcionalidades Implementadas

### 1. RSS Feed Dinâmico (/rss.xml)

**Edge Function:** `supabase/functions/generate-rss/index.ts`

- ✅ Geração dinâmica baseada em posts publicados
- ✅ Metadados completos (autor, categoria, data)
- ✅ Cache de 1 hora
- ✅ Formato RSS 2.0
- ✅ Link `<link rel="alternate">` no `index.html`

**URL:** `https://mulheresemconvergencia.com.br/rss.xml`

### 2. Sitemap XML Dinâmico (/sitemap.xml)

**Edge Function:** `supabase/functions/generate-sitemap/index.ts`

**Inclui:**
- ✅ Páginas estáticas (Home, Sobre, Contato, Planos, Diretório, Embaixadoras, Eventos, Comunidades, Criar-Converter, Termos, Privacidade, Cookies)
- ✅ Posts do blog publicados
- ✅ Categorias do blog
- ✅ Negócios do diretório (páginas individuais)
- ✅ Eventos publicados (páginas individuais)
- ✅ Prioridades e frequência diferenciadas

**URL:** `https://mulheresemconvergencia.com.br/sitemap.xml`

### 3. Schema.org Estruturado

**Implementação dupla (estática + dinâmica):**

#### 3a. Schema.org Estático (`index.html`)
- JSON-LD no `<head>` do `index.html` com `Organization` + `WebSite`
- Visível para **todos os crawlers**, incluindo os que não executam JavaScript
- Inclui: nome, logo, redes sociais, contato, SearchAction

#### 3b. Schema.org Dinâmico (React)
- `src/components/seo/SiteSchemaOrg.tsx` — Schema global (Organization + WebSite) incluído no Layout via Helmet
- `src/components/blog/SchemaOrg.tsx` — Schema para posts do blog (Article + BreadcrumbList)

**Tipos implementados:**
- `WebSite` com `SearchAction`
- `Organization` com logo, redes sociais e contato
- `Article` para cada post do blog
- `BreadcrumbList` para navegação

### 4. SEO Estático no `index.html` (SPA Fallback)

**Problema resolvido:** Como o portal é uma SPA (Single Page Application), crawlers que não executam JavaScript não veem nenhum conteúdo. O `index.html` agora contém:

#### Title Tag Otimizado
```html
<title>Mulheres em Convergência | Rede de Empreendedorismo Feminino, Cursos e Associação</title>
```
- ~82 caracteres com palavras-chave estratégicas
- Helmet sobrescreve após hidratação do React

#### Meta Tags Estáticas
- `<meta name="description">` — descrição completa com keywords
- `<meta name="keywords">` — palavras-chave: empreendedorismo feminino, liderança feminina, capacitação feminina, etc.
- `<link rel="canonical">` — URL canônica da home
- `<meta property="og:url">` — URL para Open Graph

#### Bloco `<noscript>` Semântico
Conteúdo HTML estático dentro de `<noscript>` que fornece aos crawlers:
- **H1** com título principal e palavras-chave
- **6 seções H2**: Networking, MeC Academy, Diretório, Eventos, Blog, Planos
- **300+ palavras** de conteúdo descritivo com keywords naturais
- **10+ links internos** para páginas principais
- **Imagem com alt** descritivo (logo)
- **Navegação semântica** com lista de links

### 5. Arquivos para IA Generativa (llms.txt)

**Padrão:** [llmstxt.org](https://llmstxt.org/)

- `public/llms.txt` — Arquivo estático de descoberta para IAs com resumo do portal e links
- **Edge Function:** `supabase/functions/generate-llms-full/index.ts` — Conteúdo completo dos posts em texto plano
- Redirect em `public/_redirects`: `/llms-full.txt` → edge function

**URLs:**
- `https://mulheresemconvergencia.com.br/llms.txt`
- `https://mulheresemconvergencia.com.br/llms-full.txt`

### 6. Meta Tags Completas (Helmet)

Todas as páginas públicas possuem:
- ✅ `<title>` otimizado
- ✅ `<meta name="description">`
- ✅ `<link rel="canonical">`
- ✅ Open Graph (og:title, og:description, og:url, og:type)

**Páginas cobertas:** Home, Convergindo (blog), Diretório, Embaixadoras, Eventos, Comunidades, Planos, 404

### 7. Robots.txt

**Arquivo:** `public/robots.txt`

- ✅ Allow para bots de busca e redes sociais
- ✅ Disallow para rotas admin e privadas (`/admin/*`, `/painel/*`, `/configuracoes/*`)
- ✅ Referência ao Sitemap
- ✅ Referência ao `llms.txt` (diretiva `LLMs-Txt`)

### 8. Página 404

- ✅ Traduzida para português
- ✅ Meta tag `noindex, nofollow`

## Configuração Técnica

### Proxy via Cloudflare Pages Function (`functions/[[path]].ts`)

O proxy em `functions/[[path]].ts` intercepta `/rss.xml`, `/sitemap.xml` e `/llms-full.txt`, adiciona os headers de autenticação do Supabase e retorna o conteúdo com Content-Type correto. Este é o **único mecanismo de entrega pública** — nenhum redirect ou URL direta do Supabase deve ser exposta.

> ⚠️ O arquivo `public/_redirects` **não** deve conter regras para `/rss.xml` ou `/sitemap.xml` — isso criaria conflito com a Pages Function.


## Arquitetura SEO (Estático vs Dinâmico + Pre-rendering)

```
index.html (estático)
├── <title> otimizado com keywords
├── <meta description> completa
├── <meta keywords>
├── <link canonical>
├── <meta og:url>
├── Schema.org JSON-LD (Organization + WebSite)
├── <noscript> com conteúdo semântico
│   ├── H1 + 6x H2
│   ├── 300+ palavras
│   ├── 10+ links internos
│   └── Imagem com alt
└── React SPA (carrega via JS)
    ├── Helmet sobrescreve title/meta por página
    ├── SiteSchemaOrg.tsx (Schema global)
    └── SchemaOrg.tsx (Schema por post)

Cloudflare Pages Function (functions/[[path]].ts)
├── Detecta crawlers por User-Agent
├── Proxy para seo-prerender Edge Function
│   ├── HTML completo com conteúdo real do banco
│   ├── Schema.org dinâmico (Article, LocalBusiness, Event, Course)
│   ├── Open Graph + Twitter Card
│   └── Cache 1h browser + 12h CDN
├── Proxy RSS/Sitemap/llms-full.txt
└── Browsers reais → SPA normalmente
```

### 9. SEO Pre-rendering para Crawlers

**Edge Function:** `supabase/functions/seo-prerender/index.ts`
**Cloudflare Pages Function:** `functions/[[path]].ts`

Crawlers que não executam JavaScript recebem HTML completo com:
- Metadados corretos por rota (title, description, canonical, OG, Twitter)
- Schema.org dinâmico (Article, LocalBusiness, Event, Course, Organization)
- Conteúdo real do banco de dados em HTML semântico
- Links de navegação interna

**Rotas cobertas:** Home, Blog (lista + posts), Diretório (lista + negócios), Eventos (lista + individuais), Academy (lista + cursos), Embaixadoras, páginas estáticas, Page Builder, Landing Pages.

**Documentação detalhada:** `docs/_active/06-funcionalidades/seo-prerender.md`

## URLs de Produção

| Recurso | URL |
|---------|-----|
| RSS | https://mulheresemconvergencia.com.br/rss.xml |
| Sitemap | https://mulheresemconvergencia.com.br/sitemap.xml |
| llms.txt | https://mulheresemconvergencia.com.br/llms.txt |
| llms-full.txt | https://mulheresemconvergencia.com.br/llms-full.txt |

## Status

🎉 **CONCLUÍDO** — Atualizado em abril de 2026
