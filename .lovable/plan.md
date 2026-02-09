
# Plano de Otimizacao SEO e Visibilidade para IA Generativa

## Diagnostico Atual

Apos uma varredura completa do site, identifiquei problemas e oportunidades em 7 areas. Tudo pode ser feito sem servicos externos pagos.

---

## 1. Bug Critico: URL Errada no SchemaOrg

O componente `SchemaOrg.tsx` usa a URL base `https://mulhereemconvergeencia.com.br` (com "ee" duplicado), que esta **incorreta**. A URL correta e `https://mulheresemconvergencia.com.br`. Isso afeta todos os dados estruturados dos posts.

**Correcao:** Alterar o default de `baseUrl` para usar `PRODUCTION_DOMAIN` da constante ja existente.

---

## 2. Paginas Publicas sem Meta Tags (Helmet)

Varias paginas publicas estao com meta tags incompletas ou ausentes:

| Pagina | Problema |
|--------|----------|
| `/convergindo` (listagem do blog) | Sem `<Helmet>` nenhum - sem title, description, canonical, OG |
| `/diretorio` | Sem canonical, sem OG |
| `/embaixadoras` | Sem canonical, sem OG |
| `/eventos` | Tem canonical mas sem OG image |
| `/planos` | Verificar se tem meta tags completas |
| `/comunidades` | Tem canonical mas sem OG image |
| `Index (/)` | Sem canonical |
| `NotFound (404)` | Sem Helmet, texto em ingles ("Page not found") |

**Correcao:** Adicionar `<Helmet>` completo (title, description, canonical, og:title, og:description, og:image, og:url, twitter cards) em todas as paginas publicas.

---

## 3. Sitemap Incompleto

O sitemap atual so inclui: Home, Sobre, Convergindo, Contato, Planos + posts do blog + categorias.

**Paginas faltando no sitemap:**
- `/diretorio` (e paginas individuais `/diretorio/:slug`)
- `/embaixadoras`
- `/eventos` (e paginas individuais `/eventos/:slug`)
- `/comunidades`
- `/criar-converter` (landing page)
- `/termos-de-uso`
- `/politica-de-privacidade`
- `/politica-de-cookies`

**Correcao:** Atualizar a edge function `generate-sitemap` para incluir todas as paginas publicas e buscar tambem negócios e eventos publicados do banco de dados.

---

## 4. Robots.txt Melhorado

O robots.txt atual e muito basico. Pode ser melhorado para:
- Bloquear rotas admin (`/admin/*`)
- Bloquear rotas privadas (`/painel/*`, `/configuracoes/*`)
- Adicionar referencia ao `llms.txt` (para IAs)
- Confirmar o sitemap

---

## 5. Arquivos para IA Generativa (llms.txt e llms-full.txt)

Este e o ponto mais importante para que ferramentas como ChatGPT, Gemini, Perplexity e outras IAs consigam acessar e referenciar o conteudo do site.

### O que e o llms.txt?

E um padrao emergente (similar ao robots.txt) que permite que IAs entendam o que o site oferece e acessem conteudo de forma estruturada. Nenhum servico externo e necessario.

**Criar dois arquivos estaticos e uma edge function:**

### `public/llms.txt` (resumo para IAs)
Conteudo em markdown com:
- Nome e descricao do portal
- Links para as principais secoes
- Instrucoes sobre como acessar conteudo dinamico
- Link para o `llms-full.txt`

### Edge Function `generate-llms-full`
Gera dinamicamente o conteudo completo dos posts do blog em formato markdown, acessivel via `/llms-full.txt`. Assim as IAs podem ler todos os artigos publicados.

### Redirect em `_redirects`
Adicionar redirect de `/llms-full.txt` para a edge function.

---

## 6. Schema.org para Paginas Alem do Blog

Atualmente, Schema.org so existe nos posts individuais do blog. Paginas importantes como Home, Sobre, Diretorio e Eventos nao possuem dados estruturados.

**Adicionar Schema.org para:**

- **Home**: `WebSite` + `Organization` + `SearchAction`
- **Diretorio**: `ItemList` com `LocalBusiness` para cada negocio
- **DiretorioEmpresa**: `LocalBusiness` individual com endereco, categoria, reviews
- **Eventos**: `Event` schema com data, local, preco
- **Convergindo (listagem)**: `CollectionPage` + `Blog`

Criar um componente reutilizavel `SiteSchemaOrg.tsx` para o schema global (Organization + WebSite) e incluir no Layout.

---

## 7. Melhorias Tecnicas Adicionais

### 7a. Pagina 404 em portugues
A pagina NotFound atual esta em ingles. Corrigir para portugues e adicionar Helmet com `noindex`.

### 7b. Alt text nas imagens
Verificar e garantir que todas as imagens do blog e diretorio tenham `alt` descritivo (ja existe na maioria, mas padronizar).

### 7c. Link RSS no `<head>`
Adicionar `<link rel="alternate" type="application/rss+xml">` no `index.html` para que leitores RSS descubram o feed automaticamente.

### 7d. Open Graph image padrao
Varias paginas referenciam `og-default.jpg` que pode nao existir no `public/`. Garantir que exista uma imagem padrao OG.

---

## Resumo de Arquivos

### Novos arquivos
- `public/llms.txt` - Arquivo de descoberta para IAs
- `supabase/functions/generate-llms-full/index.ts` - Conteudo completo para IAs
- `src/components/seo/SiteSchemaOrg.tsx` - Schema.org global
- `src/components/seo/PageSchemaOrg.tsx` - Schema.org por tipo de pagina

### Arquivos modificados
- `public/robots.txt` - Adicionar bloqueios e referencia llms.txt
- `public/_redirects` - Adicionar redirect para llms-full.txt
- `index.html` - Adicionar link RSS no head
- `src/components/blog/SchemaOrg.tsx` - Corrigir URL base
- `src/components/layout/Layout.tsx` - Incluir SiteSchemaOrg
- `src/pages/Convergindo.tsx` - Adicionar Helmet completo
- `src/pages/NotFound.tsx` - Traduzir para portugues + Helmet
- `src/pages/Index.tsx` - Adicionar canonical e OG completo
- `src/pages/Diretorio.tsx` - Adicionar canonical e OG
- `src/pages/Embaixadoras.tsx` - Adicionar canonical e OG
- `src/pages/DiretorioEmpresa.tsx` - Adicionar Schema.org LocalBusiness
- `src/pages/EventsPage.tsx` - Adicionar OG image
- `src/pages/EventDetailPage.tsx` - Adicionar Schema.org Event
- `supabase/functions/generate-sitemap/index.ts` - Adicionar paginas faltantes
- `docs/_active/06-funcionalidades/rss-sitemap-schema.md` - Atualizar documentacao

### Nenhum servico externo necessario
Todas as melhorias utilizam apenas arquivos estaticos, edge functions existentes e padrao web abertos.
