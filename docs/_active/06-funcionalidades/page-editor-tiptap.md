# Editor de Páginas TipTap

## Visão Geral

Sistema de gerenciamento de páginas baseado no editor rico [TipTap](https://tiptap.dev/). Substitui o antigo Page Builder PUCK removido em 2026-05-27.

## Funcionalidades

- Editor rich-text completo: títulos, negrito, itálico, listas, links, blockquotes, código
- Imagens com upload direto para **Cloudflare R2** (integração existente)
- Vídeos embutidos: YouTube e Vimeo
- Tabelas
- Blocos customizados: **Callout** (info/aviso/sucesso/erro) e **CTA** (call-to-action)
- Campos de SEO: título e descrição para cada página
- Toggle de visibilidade pública / interna
- Status: Rascunho / Publicado
- Migração automática do formato PUCK legado para TipTap JSON no primeiro save

## Rotas Admin

| Rota | Descrição |
|------|-----------|
| `/admin/paginas` | Listagem de todas as páginas |
| `/admin/paginas/nova` | Criar nova página |
| `/admin/paginas/:id` | Editar página existente |

## Rotas Públicas

| Rota | Descrição |
|------|-----------|
| `/pagina/:slug` | Renderiza páginas com `is_public = true` e `status = published` |

## Páginas do sistema

As páginas Sobre (`/sobre`), Planos (`/planos`) e Contato (`/contato`) têm `page_type = 'system'` e são editáveis pelo editor, mas **não podem ser excluídas** pelo admin. Elas continuam acessíveis pelas suas rotas dedicadas.

## Banco de dados

**Tabela:** `pages`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `content` | JSONB | Documento TipTap JSON ou formato PUCK legado (auto-migrado no save) |
| `page_type` | TEXT | `system` = núcleo do portal, `free` = criada pelo admin |
| `is_public` | BOOLEAN | Se `true`, renderiza em `/pagina/:slug` |
| `seo_title` | TEXT | Título para motores de busca |
| `seo_description` | TEXT | Descrição para motores de busca |

## Arquivos principais

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/migrateBlocksToTipTap.ts` | Detecta e converte formato PUCK → TipTap JSON |
| `src/components/editor/TipTapEditor.tsx` | Editor com toolbar e upload R2 |
| `src/components/editor/TipTapRenderer.tsx` | Renderizador read-only (sem dangerouslySetInnerHTML) |
| `src/components/editor/extensions/CalloutNode.ts` | Node customizado: bloco de aviso |
| `src/components/editor/extensions/CTANode.ts` | Node customizado: call-to-action |
| `src/hooks/usePageEditor.ts` | CRUD via TanStack Query |
| `src/pages/admin/AdminPages.tsx` | Tela de listagem admin |
| `src/pages/admin/AdminPageEditor.tsx` | Tela de edição admin |
| `src/pages/PublicPageView.tsx` | Renderização pública |

## Segurança

O `TipTapRenderer` renderiza conteúdo TipTap JSON via React virtual DOM com `editable: false`. **Não usa `dangerouslySetInnerHTML`** para conteúdo TipTap. Para conteúdo PUCK legado, delega ao `PageRenderer` (fallback transitório).
