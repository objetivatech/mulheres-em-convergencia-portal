# Design Spec: Editor de Páginas com TipTap

**Data:** 2026-05-27  
**Status:** Aprovado — pronto para implementação  
**Projeto:** Portal Mulheres em Convergência

---

## 1. Contexto e Motivação

O portal possuía um Page Builder baseado em PUCK (editor de blocos visuais) que foi removido por não funcionar adequadamente e ser muito limitado. As páginas públicas do sistema (**Sobre**, **Planos**, **Contato**) continuam funcionando via `PageRenderer.tsx` que lê blocos JSONB da tabela `pages`.

Este spec descreve o sistema que substitui e expande essa capacidade: um editor rico baseado em TipTap com gerenciamento completo no painel admin.

### Mudanças desta sessão que este spec engloba

Além do editor em si, nesta mesma sessão foram realizadas duas outras alterações que precisam ser refletidas na documentação:

1. **Correção do gerenciamento de roles** — O botão de remoção de `community_member` foi desabilitado via UI quando o usuário possui outras roles dependentes. O erro do banco (`validate_role_consistency` trigger) agora é exibido de forma amigável. A role `business_owner` foi identificada como responsável pelo acesso ao CONECTA+ como Membro.

2. **Remoção do Page Builder (PUCK)** — Rotas `/admin/paginas`, `/admin/construtor-paginas/novo`, `/admin/construtor-paginas/:id` e `/pagina/:slug` (redirect) foram removidas do `App.tsx`. Os componentes `PageBuilder.tsx`, `PagesManagement.tsx` e `PageBuilderLink.tsx` foram excluídos. `PageRenderer.tsx` e os blocks foram **preservados** pois são usados pelas páginas do sistema.

---

## 2. Decisões de Design

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Escopo de migração | Todas as páginas existentes + novas | Sistema unificado, sem duplicação |
| Formato de conteúdo | TipTap JSON nativo (JSONB) | Estruturado, extensível para custom nodes, sem mudança de schema |
| Renderização | TipTap `editable: false` | Sem `dangerouslySetInnerHTML`, renderização via React virtual DOM |
| Extensões do editor | Rich text completo + imagens + vídeos + blocos customizados | Necessidade declarada de CTAs e callouts |
| Upload de mídia | Cloudflare R2 (integração existente) | Já configurado no projeto |
| Visibilidade de páginas | Toggle por página (público / interno) | Flexibilidade para páginas sem URL própria |
| Layout admin | Abas Conteúdo/SEO/Config + painel lateral | Estilo Ghost/Notion, foco no editor |
| Migração de conteúdo | Lazy (no primeiro save, não em batch) | Zero risco de perda de dados em produção |
| Alterações de schema | +`is_public`, +`page_type` na tabela `pages` | Mínimo necessário, sem quebrar estrutura existente |

---

## 3. Arquitetura e Componentes

### 3.1 Banco de dados

**Tabela `pages`** — mantida. Duas colunas novas:

```sql
ALTER TABLE pages ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pages ADD COLUMN page_type TEXT NOT NULL DEFAULT 'free';
-- page_type: 'system' (sobre, planos, contato) | 'free' (criadas pelo admin)
```

O campo `content` (JSONB existente) passa a armazenar o documento TipTap JSON:

```json
{
  "type": "doc",
  "content": [
    { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Título" }] },
    { "type": "paragraph", "content": [{ "type": "text", "text": "Conteúdo..." }] }
  ]
}
```

### 3.2 Componentes novos

#### `TipTapEditor` (`src/components/editor/TipTapEditor.tsx`)
Componente de edição. Encapsula o `useEditor` do `@tiptap/react` com as seguintes extensões:

**Extensões padrão:**
- `StarterKit` (bold, italic, headings H1–H4, listas, blockquote, code)
- `Link` com abertura em nova aba por padrão
- `Table` + `TableRow` + `TableCell` + `TableHeader`
- `Image` customizada (integrada ao upload R2)
- `Youtube` (embed por URL)
- `Placeholder`
- `CharacterCount`

**Extensões customizadas (TipTap Nodes):**
- `CalloutNode` — caixa de aviso/destaque com ícone e variantes (info, warning, success)
- `CTANode` — bloco call-to-action com título, texto e botão configurável

Props: `content`, `onChange`, `editable` (default: true)

#### `TipTapRenderer` (`src/components/editor/TipTapRenderer.tsx`)
Componente de renderização read-only. Instancia o mesmo `useEditor` com `editable: false` e o mesmo conjunto de extensões.

**Detecção de formato:** o renderer verifica o tipo do campo `content` ao montar:
- Se `content` é um objeto `{ type: "doc" }` → renderiza via TipTap (`editable: false`)
- Se `content` é um array (formato de blocos legado) → delega para `PageRenderer.tsx`

Isso permite que `/sobre`, `/planos`, `/contato` sejam atualizadas para usar `TipTapRenderer` imediatamente, sem quebrar o conteúdo atual enquanto as páginas não forem salvas pelo novo editor. `PageRenderer.tsx` e os blocks permanecem como dependência interna até que todas as páginas do sistema sejam migradas — essa remoção fica fora de escopo desta entrega.

**Não usa `dangerouslySetInnerHTML` para conteúdo TipTap.** O conteúdo passa pelos nodes React do TipTap.

#### `usePageEditor` (`src/hooks/usePageEditor.ts`)
Hook de estado para o editor admin. Responsável por:
- Fetch da página por ID (via TanStack Query)
- Detecção de formato legado vs TipTap JSON
- Conversão lazy de blocos → TipTap JSON (`migrateBlocksToTipTap`)
- Save/upsert no Supabase
- Upload de imagem para R2

#### `migrateBlocksToTipTap` (`src/lib/migrateBlocksToTipTap.ts`)
Função pura que converte o formato de blocos antigo para TipTap JSON. Detecta formato pelo campo discriminador: blocos legados são arrays `[{type: "hero"|"text"|"heading"|...}]`; TipTap JSON é um objeto `{type: "doc"}`.

Mapeamento:
| Bloco legado | Node TipTap |
|---|---|
| `heading` | `heading` com `level` |
| `text` | `paragraph` (HTML stripped para texto puro) |
| `hero` | `heading` H1 + `paragraph` de descrição |
| `button` | `paragraph` com `link` embutido |
| `image` | `image` com `src` |
| `card_grid` | Série de `paragraph` com título de cada card |

Se um bloco não for reconhecido: insere `paragraph` com texto de fallback e registra warning no console.

### 3.3 Telas admin

#### Lista de páginas — `/admin/paginas`
Acessível via card no Painel Admin (categoria CONTEÚDO). Tabela com colunas:
- Título
- Tipo (badge: Sistema / Livre)
- Status (badge: Publicado / Rascunho)
- Visibilidade (ícone: 🌐 Pública / 🔒 Interna)
- URL (link clicável para páginas públicas)
- Ações: Editar | Excluir (desabilitado para `page_type = 'system'`)

Botão "+ Nova Página" no header.

#### Editor de página — `/admin/paginas/:id` e `/admin/paginas/nova`
Layout: abas no topo + painel lateral.

**Abas:**
- **Conteúdo** — `TipTapEditor` em largura total
- **SEO** — campos: `seo_title`, `seo_description`, preview de card de busca
- **Configurações** — `slug` (editável apenas para páginas livres), toggle `is_public`

**Painel lateral (sempre visível):**
- Status atual (Publicado / Rascunho) + botão de toggle
- Botão "Salvar" com indicador de estado (salvo / não salvo / salvando)
- URL pública (se `is_public = true`)
- Data de última edição
- Botão "Ver página" (abre em nova aba, apenas se publicada e pública)

### 3.4 Rota pública restaurada

`/pagina/:slug` — renderiza páginas com `status = 'published' AND is_public = true` via `TipTapRenderer`.

Páginas do sistema continuam em suas rotas próprias (`/sobre`, `/planos`, `/contato`) e passam a usar `TipTapRenderer` imediatamente — que detecta o formato do `content` e faz fallback para `PageRenderer.tsx` enquanto o conteúdo ainda estiver em blocos.

---

## 4. Fluxo de Dados

### Salvamento
```
Admin edita → editor.getJSON() → usePageEditor.save() → 
  supabase.from('pages').upsert({ content: tiptapJson, ...meta }) →
  toast "Salvo"
```

### Renderização pública
```
/pagina/:slug → query pages (slug, status=published, is_public=true) →
  TipTapRenderer (editable: false) → React virtual DOM → DOM
```

### Upload de imagem
```
Usuário cola/arrasta imagem → TipTapEditor intercepta →
  upload para R2 via integração existente →
  URL pública R2 inserida como src no Image node →
  documento JSON atualizado
```

### Migração lazy
```
Admin abre página legada → usePageEditor detecta formato antigo →
  migrateBlocksToTipTap() → TipTapEditor carrega com JSON convertido →
  [usuário edita] → Salvar → conteúdo TipTap JSON gravado no banco
  (conteúdo legado sobrescrito apenas no save explícito)
```

---

## 5. Tratamento de Erros

| Cenário | Comportamento |
|---------|---------------|
| Upload R2 falha | Toast de erro, editor não bloqueia, cursor mantido |
| Save Supabase falha | Indicador "não salvo" + toast, botão Salvar em estado de erro |
| Migração de bloco falha | Parágrafo fallback com texto original + aviso de revisão |
| Slug duplicado | Validação pré-save + sugestão de slug alternativo |
| Excluir página do sistema | Botão desabilitado + tooltip explicativo |
| Acesso não autorizado | Redirect para `/admin` via guard existente |

---

## 6. Dependências a Instalar

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-link @tiptap/extension-image \
  @tiptap/extension-youtube @tiptap/extension-table \
  @tiptap/extension-placeholder @tiptap/extension-character-count \
  @tiptap/extension-table-row @tiptap/extension-table-cell \
  @tiptap/extension-table-header
```

Não há dependência de `@tiptap/extension-color` ou extensões Pro — o conjunto acima é 100% open-source.

---

## 7. Plano de Documentação

### Ações sobre docs existentes

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `docs/_active/06-funcionalidades/page-builder-implementacao-completa.md` | **Arquivar** → `docs/_archive/` | Documenta o PUCK removido |
| `docs/_active/04-usuarios/user-management-complete.md` | **Atualizar** | Refletir: `community_member` bloqueado via UI, `business_owner` = CONECTA+ Membro, erro amigável |
| `docs/_active/04-usuarios/sistema-roles-seguro.md` | **Atualizar** | Adicionar: comportamento do trigger `validate_role_consistency`, proteção de UX implementada |
| `docs/_active/04-usuarios/matriz-roles-permissoes.md` | **Verificar** | Já documenta corretamente — confirmar que está atualizado |

### Documentos a criar

| Arquivo | Conteúdo |
|---------|----------|
| `docs/_active/06-funcionalidades/page-editor-tiptap.md` | Documentação completa do novo sistema: arquitetura, extensões, migração, upload R2, admin UI |
| `docs/_active/CHANGELOG-2026-05-27.md` | Entrada desta sessão: remoção Page Builder, correção roles, novo editor TipTap |

---

## 8. Sequência de Build Recomendada

1. Migration SQL (`is_public`, `page_type`)
2. `migrateBlocksToTipTap.ts` (função pura, testável isoladamente)
3. `TipTapRenderer.tsx` (read-only, sem editor)
4. Atualizar `/sobre`, `/planos`, `/contato` para usar `TipTapRenderer` (fallback automático para `PageRenderer` enquanto conteúdo ainda for legado)
5. `TipTapEditor.tsx` (extensões base, sem custom nodes)
6. `usePageEditor.ts` (hook com save/load/migração)
7. Tela de lista `/admin/paginas`
8. Tela de editor `/admin/paginas/:id`
9. `CalloutNode` e `CTANode` (custom nodes)
10. Upload R2 integrado ao Image node
11. Rota pública `/pagina/:slug` restaurada
12. Card no Painel Admin (categoria CONTEÚDO)
13. Documentação e atualização de docs existentes

---

## 9. Fora de Escopo

- Preview em tempo real em janela separada (pode ser adicionado depois)
- Versionamento de conteúdo / histórico de revisões
- Colaboração simultânea
- Migração em batch das páginas legadas (é lazy, no primeiro save)
