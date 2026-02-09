# RSS, Sitemap, Schema.org e Visibilidade para IA Generativa

## Visão Geral

Sistema SEO completo do portal Mulheres em Convergência, incluindo RSS Feed, Sitemap XML, Schema.org, llms.txt e meta tags otimizadas para melhor indexação, descoberta de conteúdo e visibilidade em ferramentas de IA generativa.

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

**Componentes:**
- `src/components/seo/SiteSchemaOrg.tsx` — Schema global (Organization + WebSite) incluído no Layout
- `src/components/blog/SchemaOrg.tsx` — Schema para posts do blog (Article + BreadcrumbList)

**Tipos implementados:**
- `WebSite` com `SearchAction`
- `Organization` com logo, redes sociais e contato
- `Article` para cada post do blog
- `BreadcrumbList` para navegação

### 4. Arquivos para IA Generativa (llms.txt)

**Padrão:** [llmstxt.org](https://llmstxt.org/)

- `public/llms.txt` — Arquivo estático de descoberta para IAs com resumo do portal e links
- **Edge Function:** `supabase/functions/generate-llms-full/index.ts` — Conteúdo completo dos posts em texto plano
- Redirect em `public/_redirects`: `/llms-full.txt` → edge function

**URLs:**
- `https://mulheresemconvergencia.com.br/llms.txt`
- `https://mulheresemconvergencia.com.br/llms-full.txt`

### 5. Meta Tags Completas (Helmet)

Todas as páginas públicas possuem:
- ✅ `<title>` otimizado
- ✅ `<meta name="description">`
- ✅ `<link rel="canonical">`
- ✅ Open Graph (og:title, og:description, og:url, og:type)

**Páginas cobertas:** Home, Convergindo (blog), Diretório, Embaixadoras, Eventos, Comunidades, Planos, 404

### 6. Robots.txt

**Arquivo:** `public/robots.txt`

- ✅ Allow para bots de busca e redes sociais
- ✅ Disallow para rotas admin e privadas (`/admin/*`, `/painel/*`, `/configuracoes/*`)
- ✅ Referência ao Sitemap
- ✅ Referência ao `llms.txt` (diretiva `LLMs-Txt`)

### 7. Página 404

- ✅ Traduzida para português
- ✅ Meta tag `noindex, nofollow`

## Configuração Técnica

### Redirects (`public/_redirects`)
```
/rss.xml → edge function generate-rss
/sitemap.xml → edge function generate-sitemap
/llms-full.txt → edge function generate-llms-full
```

### Vite Proxy (`vite.config.ts`)
Proxies configurados para desenvolvimento local de `/rss.xml`, `/sitemap.xml` e `/llms-full.txt`.

### Cache
- RSS, Sitemap, LLMs Full: `Cache-Control: public, max-age=3600`

## URLs de Produção

| Recurso | URL |
|---------|-----|
| RSS | https://mulheresemconvergencia.com.br/rss.xml |
| Sitemap | https://mulheresemconvergencia.com.br/sitemap.xml |
| llms.txt | https://mulheresemconvergencia.com.br/llms.txt |
| llms-full.txt | https://mulheresemconvergencia.com.br/llms-full.txt |

## Status

🎉 **CONCLUÍDO** — Atualizado em fevereiro de 2026
