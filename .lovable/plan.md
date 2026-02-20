

# Plano: Gerenciamento de Landing Pages pelo Painel Admin

## Objetivo

Criar um sistema completo no painel administrativo para criar, editar, ativar/desativar e gerenciar Landing Pages usando a mesma estrutura de componentes ja existente (`LPHero`, `LPPainPoints`, etc.), porem com o conteudo armazenado no banco de dados em vez de arquivos estaticos.

---

## Situacao Atual

- A estrutura de LP existe como **componentes React reutilizaveis** (`src/components/landing-page/`) que recebem dados via props tipadas (`LandingPageContent`).
- O conteudo atual da unica LP ("Criar e Converter") esta hardcoded em `src/data/products/criar-converter.ts`.
- A tabela `landing_pages` no banco ja existe, mas contem apenas metadados simples (titulo, slug, active, featured). Nao armazena o conteudo das secoes.
- As LPs aparecem automaticamente no slider da homepage quando ativas.

---

## 1. Banco de Dados - Evolucao da tabela `landing_pages`

Adicionar uma coluna JSONB `content` para armazenar todo o conteudo da LP no formato `LandingPageContent`:

```text
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS content JSONB,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
```

O campo `content` armazena a estrutura completa: hero, painPoints, method, pillars, included, targetAudience, transformation, eventDetails, investment, testimonials e product.

Migrar o conteudo da LP "Criar e Converter" para a tabela via UPDATE com o JSON correspondente ao arquivo `criar-converter.ts`.

A coluna `status` permite controle mais fino do que apenas `active` (draft, published, archived).

---

## 2. Pagina Admin: Listagem de LPs (`/admin/landing-pages`)

Tabela com todas as LPs cadastradas:
- Colunas: Titulo, Slug, Status (badge colorido), Featured, Data criacao, Acoes
- Acoes por LP: Editar, Duplicar, Visualizar (abre em nova aba), Toggle ativar/desativar, Excluir
- Botao "Nova Landing Page" no topo
- Filtros por status (Rascunho, Publicada, Arquivada)

---

## 3. Editor de LP (`/admin/landing-pages/:id`)

Formulario completo dividido em abas/accordion para cada secao da LP:

### Aba "Configuracoes Gerais"
- Titulo, slug (auto-gerado editavel), status
- SEO: titulo e descricao meta
- Imagem de capa (para o slider da homepage)
- Toggles: featured, ativa
- Dados do produto: nome, tagline, preco, descricao de pagamento
- Formato do evento: online/presencial/hibrido, datas, duracao, local

### Aba "Hero"
- Headline, subheadline, descricao
- Texto do CTA primario e secundario

### Aba "Pontos de Dor"
- Titulo da secao
- Lista dinamica de pain points (adicionar/remover/reordenar)
- Texto de fechamento + highlight

### Aba "Metodo"
- Titulo, descricao
- Lista de beneficios (adicionar/remover)
- Texto de fechamento

### Aba "Pilares"
- Titulo
- Lista de pilares (max 4), cada um com: titulo, subtitulo, descricao, icone (select com opcoes lucide)

### Aba "O Que Esta Incluido"
- Titulo
- Lista de itens com toggles: bonus, destaque

### Aba "Publico-Alvo"
- Titulo
- Lista de perfis
- CTA opcional

### Aba "Transformacao"
- Titulo
- Lista de transformacoes
- CTA opcional

### Aba "Detalhes do Evento"
- Titulo, datas, duracao, formato, local

### Aba "Investimento"
- Titulo, preco formatado, valor numerico, descricao, texto do CTA

### Aba "Depoimentos"
- Titulo, subtitulo
- Lista de depoimentos: tipo (video/texto), URL YouTube ou quote, nome, role

### Funcionalidades do Editor
- **Preview em tempo real**: botao que abre a LP renderizada em nova aba/modal
- **Salvar rascunho**: salva sem publicar
- **Publicar**: ativa a LP e gera a rota publica
- **Duplicar LP**: copia todo o conteudo para uma nova LP com slug diferente (ideal para criar LPs rapidamente)

---

## 4. Renderizacao Dinamica da LP Publica

Criar uma pagina generica `DynamicLandingPage` que:
1. Recebe o slug via rota (`/:slug` - com prioridade menor que rotas fixas)
2. Busca o conteudo da tabela `landing_pages` onde `slug = param` e `active = true`
3. Renderiza os mesmos componentes LP existentes com os dados do banco
4. Inclui meta tags SEO dinamicas

A rota fixa `/criar-converter` sera mantida como fallback, mas a LP "Criar e Converter" tambem funcionara pela rota dinamica apos migrar o conteudo para o banco.

---

## 5. Hook `useLandingPages`

Novo hook com:
- `useListLandingPages()` - listagem com filtros
- `useGetLandingPage(id)` - buscar por ID
- `useGetLandingPageBySlug(slug)` - buscar por slug (publico)
- `useCreateLandingPage()` - criar
- `useUpdateLandingPage()` - atualizar
- `useDeleteLandingPage()` - excluir
- `useDuplicateLandingPage()` - duplicar

---

## 6. Melhorias Adicionais

### 6a. Template inicial pre-preenchido
Ao criar uma nova LP, o formulario vem pre-preenchido com textos placeholder em todas as secoes, facilitando a edicao (nao comeca do zero).

### 6b. Secoes opcionais com toggle
Cada secao (exceto Hero e Investimento) pode ser desabilitada via toggle, permitindo LPs com diferentes composicoes. Exemplo: uma LP sem "Pilares" ou sem "Depoimentos".

### 6c. Preview responsivo
O botao de preview permite alternar entre visualizacao desktop e mobile.

### 6d. Historico de alteracoes
Registro simples de quem editou e quando (usando `updated_at` e `created_by`).

---

## 7. Atualizacao de Rotas

```text
/admin/landing-pages          -> Listagem de LPs
/admin/landing-pages/nova     -> Criar nova LP
/admin/landing-pages/:id      -> Editar LP existente
/lp/:slug                     -> Renderizacao publica dinamica
```

A rota publica `/lp/:slug` sera o padrao para novas LPs. A rota `/criar-converter` continuara funcionando como alias.

---

## 8. Documentacao

Atualizar os seguintes documentos:
- `docs/_active/08-landing-pages/criar-converter-lp.md` - Atualizar para refletir que o conteudo agora vive no banco
- `docs/_active/09-navigation-and-slider/navigation-menus-slider.md` - Atualizar secao sobre LPs
- Criar novo: `docs/_active/08-landing-pages/admin-landing-pages.md` - Guia completo do gerenciamento de LPs pelo painel

---

## 9. Arquivos a Criar

```text
src/pages/admin/AdminLandingPages.tsx         -- Listagem
src/pages/admin/AdminLandingPageEditor.tsx     -- Editor com abas
src/pages/DynamicLandingPage.tsx               -- Renderizacao publica
src/hooks/useLandingPages.ts                   -- Hook CRUD
src/components/admin/lp-editor/LPEditorTabs.tsx       -- Container de abas
src/components/admin/lp-editor/LPGeneralTab.tsx       -- Aba configuracoes gerais
src/components/admin/lp-editor/LPContentTabs.tsx      -- Abas de conteudo (Hero, Dor, etc.)
src/components/admin/lp-editor/LPListItemActions.tsx   -- Componente de itens dinamicos (add/remove/reorder)
docs/_active/08-landing-pages/admin-landing-pages.md
```

## 10. Arquivos a Modificar

```text
src/App.tsx                                    -- Novas rotas
src/pages/Admin.tsx                            -- Card de acesso ao gerenciamento de LPs
docs/_active/08-landing-pages/criar-converter-lp.md
docs/_active/09-navigation-and-slider/navigation-menus-slider.md
```

---

## 11. Ordem de Implementacao

1. Migracao SQL (adicionar colunas + migrar conteudo Criar e Converter)
2. Hook `useLandingPages`
3. Pagina de listagem admin
4. Editor com abas (formularios por secao)
5. Pagina de renderizacao publica dinamica
6. Rotas e menu admin
7. Documentacao

