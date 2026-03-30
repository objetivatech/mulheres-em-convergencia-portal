

# Plano de Melhorias SEO — Baseado no Relatório RankTop

## Diagnóstico Raiz

O relatório atribuiu **61/100** ao portal. A causa principal é que o portal é uma **SPA (Single Page Application)** — todo o conteúdo (H1, headings, textos, links, imagens, canonical, Schema.org) é renderizado via JavaScript pelo React. Crawlers que não executam JS (incluindo muitos bots de SEO) veem apenas o `index.html` estático, que contém:

- Title curto ("Mulheres em Convergência" — 24 caracteres)
- Meta description OK (125 chars)
- **Zero** H1, H2, H3
- **Zero** palavras de conteúdo
- **Nenhuma** canonical URL
- **Nenhum** Schema.org JSON-LD
- **Nenhuma** imagem com alt
- **Zero** links internos

Embora o Google execute JS e eventualmente veja o conteúdo, a indexação é mais lenta e menos confiável. A solução é **injetar conteúdo SEO crítico diretamente no HTML estático** e adicionar **fallback `<noscript>`** com conteúdo real.

---

## Itens de Correção

### 1. Title Tag otimizado no `index.html`

**Problema**: "Mulheres em Convergência" (24 chars) — muito curto, sem palavras-chave.

**Correção**: Atualizar o `<title>` no `index.html` para o title completo com palavras-chave:
```
Mulheres em Convergência | Rede de Empreendedorismo Feminino, Cursos e Associação
```
(~82 chars — dentro do limite recomendado)

O Helmet no React sobrescreve este title após hidratação, mas crawlers sem JS verão o title otimizado.

### 2. Canonical URL estática no `index.html`

**Problema**: Canonical não existe no HTML estático.

**Correção**: Adicionar no `<head>` do `index.html`:
```html
<link rel="canonical" href="https://mulheresemconvergencia.com.br/" />
```

### 3. Schema.org JSON-LD estático no `index.html`

**Problema**: O Schema.org existe via React (`SiteSchemaOrg.tsx`), mas crawlers sem JS não o veem.

**Correção**: Duplicar o Schema Organization + WebSite como `<script type="application/ld+json">` diretamente no `<head>` do `index.html`. O React continuará injetando schemas específicos por página.

### 4. Bloco `<noscript>` com conteúdo semântico

**Problema**: Sem JS, o crawler vê apenas `<div id="root"></div>` — zero conteúdo.

**Correção**: Adicionar dentro do `<body>`, logo após o `<div id="root">`, um bloco `<noscript>` contendo:
- Um `<h1>` com o título principal da página
- Parágrafos descritivos sobre a missão e os pilares do portal (mínimo 300 palavras)
- Headings `<h2>` para cada seção (Rede de Networking, MeC Academy, Diretório de Negócios, Eventos)
- Links internos para as páginas principais (`/planos`, `/academy`, `/diretorio`, `/eventos`, `/convergindo`, `/sobre`, `/contato`)
- Imagens com `alt` descritivo (logo)
- Palavras-chave naturais: empreendedorismo feminino, redes de apoio para mulheres, liderança feminina, capacitação feminina, negócios para mulheres, comunidade feminina

### 5. Meta keywords (baixo impacto, mas presente)

Adicionar meta keywords no `index.html` com as palavras-chave identificadas pelo relatório:
```html
<meta name="keywords" content="empreendedorismo feminino, redes de apoio para mulheres, liderança feminina, capacitação feminina, negócios para mulheres, comunidade feminina, mulheres na tecnologia" />
```

### 6. Og:url estático

Adicionar `og:url` no `index.html`:
```html
<meta property="og:url" content="https://mulheresemconvergencia.com.br/" />
```

### 7. Atualizar documentação

Atualizar `docs/_active/06-funcionalidades/rss-sitemap-schema.md` e `docs/_active/06-funcionalidades/performance-optimization.md` para refletir o conteúdo SEO estático adicionado ao `index.html`.

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `index.html` | Title otimizado, canonical, Schema.org JSON-LD, og:url, meta keywords, bloco `<noscript>` com conteúdo semântico |
| `docs/_active/06-funcionalidades/rss-sitemap-schema.md` | Documentar SEO estático |

## Impacto Esperado

| Item do Relatório | Score Atual | Após Correção |
|---|---|---|
| Title Tag (peso 15) | Parcial (curto) | OK (completo com keywords) |
| H1 (peso 10) | 0 encontrados | 1 via noscript |
| Headings (peso 8) | 0 H2/H3 | H2s via noscript |
| Canonical (peso 7) | Ausente | Presente |
| Schema JSON-LD (peso 8) | Ausente para crawlers | Presente no HTML |
| Conteúdo (peso 10) | 0 palavras | 300+ palavras via noscript |
| Links internos (peso 2) | 0 | 6+ via noscript |
| Imagens alt (peso 8) | 0 | 1+ via noscript |

**Score estimado**: de **61 → 85+**

