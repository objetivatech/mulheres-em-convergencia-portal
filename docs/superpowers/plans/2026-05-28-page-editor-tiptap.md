# Editor de Páginas TipTap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the removed PUCK Page Builder with a full TipTap rich-text page editor, allowing admins to create and edit all portal pages (Sobre, Planos, Contato + free pages) with images uploaded to R2, custom blocks (CTA, Callout), video embeds, and a tabbed admin UI.

**Architecture:** TipTap JSON stored in the existing `pages` table (JSONB). Read-only rendering via a `TipTapRenderer` that detects legacy PUCK format and falls back to the existing `PageRenderer`. Admin UI follows the landing-page editor pattern (tabs: Conteúdo / SEO / Configurações + sticky sidebar).

**Tech Stack:** `@tiptap/react`, `@tiptap/starter-kit`, TipTap extension suite (link, image, youtube, table, placeholder, character-count), custom TipTap Nodes for Callout and CTA, `useR2Storage` hook, TanStack Query, Shadcn/Radix UI, React Router v6.

---

## File Map

| Path | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260528000001_pages_editor_columns.sql` | **Create** | Add `is_public`, `page_type`, `seo_title`, `seo_description` |
| `src/integrations/supabase/types.ts` | **Modify** | Add new columns to `pages` Row/Insert/Update types |
| `src/lib/migrateBlocksToTipTap.ts` | **Create** | Detect PUCK vs TipTap JSON; convert blocks to TipTap nodes |
| `src/components/editor/extensions/CalloutNode.ts` | **Create** | TipTap Node extension for callout/alert boxes |
| `src/components/editor/extensions/CTANode.ts` | **Create** | TipTap Node extension for call-to-action blocks |
| `src/components/editor/TipTapEditor.tsx` | **Create** | Editable TipTap instance with toolbar + R2 image upload |
| `src/components/editor/TipTapRenderer.tsx` | **Create** | Read-only renderer; detects format and delegates |
| `src/hooks/usePageEditor.ts` | **Create** | TanStack Query hooks for pages CRUD |
| `src/pages/Sobre.tsx` | **Modify** | Replace `PageRenderer` with `TipTapRenderer` |
| `src/pages/Planos.tsx` | **Modify** | Replace `PageRenderer` with `TipTapRenderer` |
| `src/pages/Contato.tsx` | **Modify** | Replace `PageRenderer` with `TipTapRenderer` |
| `src/pages/admin/AdminPages.tsx` | **Create** | Admin list: table of all pages with status/type/actions |
| `src/pages/admin/AdminPageEditor.tsx` | **Create** | Admin editor: tabs + sidebar, TipTapEditor + SEO + Config |
| `src/pages/PublicPageView.tsx` | **Create** | Public renderer for `/pagina/:slug` |
| `src/pages/Admin.tsx` | **Modify** | Add "Gerenciador de Páginas" card under CONTEÚDO |
| `src/App.tsx` | **Modify** | Add routes for admin pages, editor, and public view |
| `docs/_active/06-funcionalidades/page-editor-tiptap.md` | **Create** | Feature documentation |
| `docs/_active/04-usuarios/user-management-complete.md` | **Modify** | Update role management section |
| `docs/_active/04-usuarios/sistema-roles-seguro.md` | **Modify** | Add trigger UI behavior notes |
| `docs/_active/06-funcionalidades/page-builder-implementacao-completa.md` | **Archive** | Move to `docs/_archive/` |
| `docs/_active/CHANGELOG-2026-05-27.md` | **Create** | Session changelog |

---

## Task 0: Install TipTap Packages

**Files:** `package.json` (modified by npm)

- [ ] **Step 1: Install TipTap dependencies**

```bash
cd "D:/OTPerfil/Documents/GitHub/mulheres-em-convergencia-portal"
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-link @tiptap/extension-image \
  @tiptap/extension-youtube @tiptap/extension-table \
  @tiptap/extension-table-row @tiptap/extension-table-cell \
  @tiptap/extension-table-header @tiptap/extension-placeholder \
  @tiptap/extension-character-count
```

Expected: all packages install without peer-dep errors. TipTap peer dep is `@tiptap/pm` (already in the list) and a React version ≥ 17 (this project uses React 18 ✓).

- [ ] **Step 2: Verify build still passes**

```bash
npm run build
```

Expected: build completes with no new errors. Ignore any pre-existing warnings.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: instala dependências TipTap para editor de páginas"
```

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260528000001_pages_editor_columns.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260528000001_pages_editor_columns.sql

-- Add editor metadata columns to pages table
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS is_public   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS page_type   TEXT    NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS seo_title   TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Mark the three system pages so they can't be deleted from admin UI
UPDATE public.pages SET page_type = 'system' WHERE slug IN ('sobre', 'planos', 'contato');

-- Add a comment explaining the page_type values
COMMENT ON COLUMN public.pages.page_type IS
  'system = core pages (sobre/planos/contato) that cannot be deleted; free = admin-created pages';

COMMENT ON COLUMN public.pages.is_public IS
  'When true the page is rendered at /pagina/:slug. When false it is internal only.';
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `mcp__supabase__apply_migration` tool with the SQL above. Project ref is the `mulheres-em-convergencia` project.

Alternatively, run from Supabase CLI:
```bash
supabase db push
```

Expected: migration applied, columns exist on `pages` table.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260528000001_pages_editor_columns.sql
git commit -m "feat(db): adiciona colunas is_public, page_type, seo_title, seo_description à tabela pages"
```

---

## Task 2: Update Supabase TypeScript Types

**Files:**
- Modify: `src/integrations/supabase/types.ts` (lines ~4774–4806)

The TypeScript type for `pages` must include the new columns so the compiler catches mistakes.

- [ ] **Step 1: Locate the pages type block**

Search for `pages:` in `src/integrations/supabase/types.ts` — it's around line 4774.

- [ ] **Step 2: Update the Row type**

Find this block and replace:

```typescript
      pages: {
        Row: {
          author_id: string | null
          content: Json
          created_at: string
          id: string
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
```

Replace with:

```typescript
      pages: {
        Row: {
          author_id: string | null
          content: Json
          created_at: string
          id: string
          is_public: boolean
          page_type: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          is_public?: boolean
          page_type?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          is_public?: boolean
          page_type?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -i "error" | head -20
```

Expected: no new TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "feat(types): atualiza tipos Supabase para refletir novas colunas da tabela pages"
```

---

## Task 3: migrateBlocksToTipTap Utility

**Files:**
- Create: `src/lib/migrateBlocksToTipTap.ts`

This is a **pure function** — no React, no side effects. It detects PUCK format and converts to TipTap JSON.

**PUCK data shape:**
```json
{ "content": [{"type": "HeadingBlock", "props": {...}}, ...], "root": {} }
```

**TipTap doc shape:**
```json
{ "type": "doc", "content": [...nodes] }
```

- [ ] **Step 1: Create the file**

```typescript
// src/lib/migrateBlocksToTipTap.ts

/**
 * Detects whether a `pages.content` value is already TipTap JSON
 * or legacy PUCK block format, and converts if necessary.
 *
 * TipTap JSON: { type: "doc", content: [...] }
 * PUCK format: { content: [{type: "HeadingBlock", props: {...}}, ...], root: {} }
 */

export type TipTapDoc = {
  type: 'doc';
  content: TipTapNode[];
};

export type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
};

type PuckBlock = {
  type: string;
  props: Record<string, unknown>;
};

type PuckData = {
  content: PuckBlock[];
  root?: unknown;
};

/** Returns true when the value is already a TipTap document */
export function isTipTapDoc(value: unknown): value is TipTapDoc {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).type === 'doc'
  );
}

/** Returns true when the value looks like PUCK data */
export function isPuckData(value: unknown): value is PuckData {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as Record<string, unknown>).content)
  );
}

// ---------------------------------------------------------------------------
// Block converters
// ---------------------------------------------------------------------------

function textNode(text: string): TipTapNode {
  return { type: 'text', text };
}

function paragraph(children: TipTapNode[]): TipTapNode {
  return { type: 'paragraph', content: children };
}

function heading(level: number, text: string): TipTapNode {
  return {
    type: 'heading',
    attrs: { level: Math.min(Math.max(level, 1), 6) },
    content: [textNode(text)],
  };
}

function convertHeadingBlock(props: Record<string, unknown>): TipTapNode[] {
  const text = String(props.text ?? '');
  const level = Number(props.level ?? 2);
  return [heading(level, text)];
}

function convertTextBlock(props: Record<string, unknown>): TipTapNode[] {
  // TextBlock stores raw HTML in props.text — strip tags for plain text.
  // Full HTML parsing would require a DOM parser; we keep it simple here.
  const raw = String(props.text ?? '');
  const plain = raw.replace(/<[^>]+>/g, '');
  if (!plain.trim()) return [];
  return [paragraph([textNode(plain)])];
}

function convertHeroBlock(props: Record<string, unknown>): TipTapNode[] {
  const nodes: TipTapNode[] = [];
  if (props.title) nodes.push(heading(1, String(props.title)));
  if (props.subtitle) nodes.push(paragraph([textNode(String(props.subtitle))]));
  if (props.buttonText && props.buttonLink) {
    nodes.push(
      paragraph([
        {
          type: 'text',
          text: String(props.buttonText),
          marks: [{ type: 'link', attrs: { href: String(props.buttonLink) } }],
        },
      ])
    );
  }
  return nodes;
}

function convertImageBlock(props: Record<string, unknown>): TipTapNode[] {
  if (!props.src) return [];
  return [
    {
      type: 'image',
      attrs: {
        src: String(props.src),
        alt: String(props.alt ?? ''),
        title: String(props.caption ?? ''),
      },
    },
  ];
}

function convertButtonBlock(props: Record<string, unknown>): TipTapNode[] {
  if (!props.text) return [];
  return [
    paragraph([
      {
        type: 'text',
        text: String(props.text),
        marks: props.link
          ? [{ type: 'link', attrs: { href: String(props.link) } }]
          : [],
      },
    ]),
  ];
}

function convertCardGridBlock(props: Record<string, unknown>): TipTapNode[] {
  const cards = Array.isArray(props.cards) ? props.cards : [];
  const nodes: TipTapNode[] = [];
  for (const card of cards) {
    if (card.title) nodes.push(heading(3, String(card.title)));
    if (card.description) nodes.push(paragraph([textNode(String(card.description))]));
  }
  return nodes;
}

function convertBlock(block: PuckBlock): TipTapNode[] {
  const { type, props } = block;
  switch (type) {
    case 'HeadingBlock':
      return convertHeadingBlock(props);
    case 'TextBlock':
      return convertTextBlock(props);
    case 'HeroBlock':
      return convertHeroBlock(props);
    case 'ImageBlock':
      return convertImageBlock(props);
    case 'ButtonBlock':
      return convertButtonBlock(props);
    case 'CardGridBlock':
      return convertCardGridBlock(props);
    default:
      // Unknown block — preserve text if available, log for diagnosis
      console.warn(`[migrateBlocksToTipTap] Unknown block type: "${type}". Using text fallback.`);
      const fallbackText = props.text ?? props.title ?? `[${type}]`;
      return [paragraph([textNode(String(fallbackText))])];
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Given a value from `pages.content`, returns a TipTap document.
 *
 * - If already TipTap JSON → returned as-is.
 * - If PUCK format → converted to TipTap nodes.
 * - If null/unknown → returns an empty doc.
 */
export function ensureTipTapDoc(content: unknown): TipTapDoc {
  if (isTipTapDoc(content)) return content;

  if (isPuckData(content)) {
    const nodes: TipTapNode[] = content.content.flatMap(convertBlock);
    return {
      type: 'doc',
      content: nodes.length > 0 ? nodes : [paragraph([])],
    };
  }

  // Null, empty, or unrecognised — return an empty document
  return { type: 'doc', content: [paragraph([])] };
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error" | head -20
```

Expected: no TypeScript errors in the new file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/migrateBlocksToTipTap.ts
git commit -m "feat: adiciona utilitário de migração PUCK→TipTap JSON"
```

---

## Task 4: Custom TipTap Extensions (CalloutNode, CTANode)

**Files:**
- Create: `src/components/editor/extensions/CalloutNode.ts`
- Create: `src/components/editor/extensions/CTANode.ts`

- [ ] **Step 1: Create CalloutNode**

```typescript
// src/components/editor/extensions/CalloutNode.ts
import { Node, mergeAttributes } from '@tiptap/core';

export type CalloutVariant = 'info' | 'warning' | 'success' | 'error';

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>;
}

const VARIANT_LABELS: Record<CalloutVariant, string> = {
  info: 'ℹ️ Informação',
  warning: '⚠️ Atenção',
  success: '✅ Sucesso',
  error: '❌ Erro',
};

export const CalloutNode = Node.create<CalloutOptions>({
  name: 'callout',
  group: 'block',
  content: 'block+',
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      variant: {
        default: 'info' as CalloutVariant,
        parseHTML: (el) => el.getAttribute('data-variant'),
        renderHTML: ({ variant }) => ({ 'data-variant': variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-callout': '',
        class: `callout callout-${HTMLAttributes['data-variant'] ?? 'info'}`,
      }),
      0,
    ];
  },
});
```

- [ ] **Step 2: Create CTANode**

```typescript
// src/components/editor/extensions/CTANode.ts
import { Node, mergeAttributes } from '@tiptap/core';

export interface CTAOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const CTANode = Node.create<CTAOptions>({
  name: 'cta',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      title: { default: 'Título do CTA' },
      description: { default: '' },
      buttonText: { default: 'Saiba mais' },
      buttonHref: { default: '#' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-cta]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { title, description, buttonText, buttonHref, ...rest } = HTMLAttributes;
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, rest, { 'data-cta': '' }),
      ['h3', {}, title ?? ''],
      ['p', {}, description ?? ''],
      ['a', { href: buttonHref ?? '#' }, buttonText ?? ''],
    ];
  },
});
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep "error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/extensions/
git commit -m "feat: adiciona custom nodes TipTap: CalloutNode e CTANode"
```

---

## Task 5: TipTapEditor Component

**Files:**
- Create: `src/components/editor/TipTapEditor.tsx`

This is the editable instance. It wraps `useEditor` with all extensions + R2 image upload logic + a fixed toolbar.

- [ ] **Step 1: Create TipTapEditor.tsx**

```tsx
// src/components/editor/TipTapEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { CalloutNode } from './extensions/CalloutNode';
import { CTANode } from './extensions/CTANode';
import { useRef } from 'react';
import { useR2Storage } from '@/hooks/useR2Storage';
import { useToast } from '@/hooks/use-toast';
import type { TipTapDoc } from '@/lib/migrateBlocksToTipTap';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon, Video, MessageSquare, Zap, Undo, Redo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TipTapEditorProps {
  content: TipTapDoc | null;
  onChange: (doc: TipTapDoc) => void;
  placeholder?: string;
  className?: string;
}

export function TipTapEditor({ content, onChange, placeholder = 'Comece a escrever...', className }: TipTapEditorProps) {
  const { uploadFile, uploading } = useR2Storage();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Youtube.configure({ controls: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
      CharacterCount,
      CalloutNode,
      CTANode,
    ],
    content: content ?? undefined,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TipTapDoc);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const url = await uploadFile(file, 'paginas');
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } else {
      toast({ title: 'Erro no upload', description: 'Não foi possível enviar a imagem.', variant: 'destructive' });
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string ?? '';
    const url = window.prompt('URL do link:', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const insertYoutube = () => {
    if (!editor) return;
    const url = window.prompt('URL do vídeo (YouTube/Vimeo):');
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  const insertCallout = () => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: 'callout',
      attrs: { variant: 'info' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Escreva aqui...' }] }],
    }).run();
  };

  const insertCTA = () => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: 'cta',
      attrs: { title: 'Título do CTA', description: 'Descrição', buttonText: 'Saiba mais', buttonHref: '#' },
    }).run();
  };

  if (!editor) return null;

  const toolbarBtn = (active: boolean, disabled = false) =>
    cn('h-8 w-8 p-0', active && 'bg-accent text-accent-foreground', disabled && 'opacity-40');

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1">
        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('strike'))}
          onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('code'))}
          onClick={() => editor.chain().focus().toggleCode().run()} title="Código inline">
          <Code className="h-3.5 w-3.5" />
        </Button>

        <span className="w-px h-5 bg-border mx-1" />

        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('heading', { level: 1 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1">
          <Heading1 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('heading', { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('heading', { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">
          <Heading3 className="h-3.5 w-3.5" />
        </Button>

        <span className="w-px h-5 bg-border mx-1" />

        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista com marcadores">
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('blockquote'))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação">
          <Quote className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={toolbarBtn(false)}
          onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal">
          <Minus className="h-3.5 w-3.5" />
        </Button>

        <span className="w-px h-5 bg-border mx-1" />

        <Button variant="ghost" size="sm" className={toolbarBtn(editor.isActive('link'))}
          onClick={setLink} title="Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>

        <Button variant="ghost" size="sm" className={toolbarBtn(false, uploading)}
          onClick={() => imageInputRef.current?.click()} title="Inserir imagem" disabled={uploading}>
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        <Button variant="ghost" size="sm" className={toolbarBtn(false)}
          onClick={insertYoutube} title="Vídeo YouTube/Vimeo">
          <Video className="h-3.5 w-3.5" />
        </Button>

        <Button variant="ghost" size="sm" className={toolbarBtn(false)}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Tabela">
          <TableIcon className="h-3.5 w-3.5" />
        </Button>

        <span className="w-px h-5 bg-border mx-1" />

        <Button variant="ghost" size="sm" className={toolbarBtn(false)}
          onClick={insertCallout} title="Bloco de aviso (Callout)">
          <MessageSquare className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={toolbarBtn(false)}
          onClick={insertCTA} title="Bloco CTA">
          <Zap className="h-3.5 w-3.5" />
        </Button>

        <span className="w-px h-5 bg-border mx-1 ml-auto" />

        <Button variant="ghost" size="sm" className={toolbarBtn(false, !editor.can().undo())}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()} title="Desfazer">
          <Undo className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={toolbarBtn(false, !editor.can().redo())}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()} title="Refazer">
          <Redo className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Character count */}
      <div className="border-t px-4 py-1 text-xs text-muted-foreground text-right">
        {editor.storage.characterCount.characters()} caracteres
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error" | head -20
```

Expected: no errors. If `cn` or `utils` import fails, check that `@/lib/utils` exports `cn`.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/TipTapEditor.tsx
git commit -m "feat: adiciona componente TipTapEditor com toolbar completa e upload R2"
```

---

## Task 6: TipTapRenderer Component

**Files:**
- Create: `src/components/editor/TipTapRenderer.tsx`

Renders content in read-only mode. Detects TipTap JSON vs PUCK format.

- [ ] **Step 1: Create TipTapRenderer.tsx**

```tsx
// src/components/editor/TipTapRenderer.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { CalloutNode } from './extensions/CalloutNode';
import { CTANode } from './extensions/CTANode';
import { isTipTapDoc, isPuckData } from '@/lib/migrateBlocksToTipTap';
import type { TipTapDoc } from '@/lib/migrateBlocksToTipTap';
import { PageRenderer } from '@/components/page-builder/PageRenderer';

interface TipTapRendererProps {
  content: unknown;
  className?: string;
}

/**
 * Read-only renderer for pages.content.
 * - TipTap JSON  → renders via TipTap with editable:false (no dangerouslySetInnerHTML)
 * - PUCK data    → delegates to <PageRenderer> (legacy fallback, used until pages are re-saved)
 * - null/unknown → renders nothing
 */
export function TipTapRenderer({ content, className }: TipTapRendererProps) {
  const isTipTap = isTipTapDoc(content);

  const editor = useEditor(
    {
      editable: false,
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
        Link.configure({ openOnClick: true }),
        Image,
        Youtube.configure({ controls: true }),
        Table,
        TableRow,
        TableCell,
        TableHeader,
        CalloutNode,
        CTANode,
      ],
      content: isTipTap ? (content as TipTapDoc) : undefined,
      editorProps: {
        attributes: {
          class: `prose prose-sm max-w-none ${className ?? ''}`,
        },
      },
    },
    [isTipTap ? JSON.stringify(content) : null]
  );

  // Legacy PUCK content: delegate to existing renderer
  if (isPuckData(content) && !isTipTap) {
    return <PageRenderer data={content} />;
  }

  if (!isTipTap || !editor) return null;

  return <EditorContent editor={editor} />;
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/TipTapRenderer.tsx
git commit -m "feat: adiciona TipTapRenderer com fallback automático para formato PUCK legado"
```

---

## Task 7: usePageEditor Hook

**Files:**
- Create: `src/hooks/usePageEditor.ts`

TanStack Query hooks for listing, fetching, saving, and deleting pages.

- [ ] **Step 1: Create usePageEditor.ts**

```typescript
// src/hooks/usePageEditor.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ensureTipTapDoc } from '@/lib/migrateBlocksToTipTap';
import type { TipTapDoc } from '@/lib/migrateBlocksToTipTap';

export interface PageRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  page_type: string;
  is_public: boolean;
  seo_title: string | null;
  seo_description: string | null;
  content: unknown;
  created_at: string;
  updated_at: string;
  author_id: string | null;
}

export interface PageSavePayload {
  id?: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  page_type?: string;
  is_public: boolean;
  seo_title?: string;
  seo_description?: string;
  content: TipTapDoc;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------
export function usePagesList() {
  return useQuery({
    queryKey: ['admin', 'pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('id, slug, title, status, page_type, is_public, seo_title, seo_description, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PageRow[];
    },
  });
}

// ---------------------------------------------------------------------------
// Single page (by id)
// ---------------------------------------------------------------------------
export function usePage(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'pages', id],
    enabled: !!id && id !== 'nova',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as PageRow;
    },
  });
}

// ---------------------------------------------------------------------------
// Save (upsert)
// ---------------------------------------------------------------------------
export function useSavePage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: PageSavePayload) => {
      const { id, ...rest } = payload;
      const body = {
        ...rest,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const { data, error } = await supabase.from('pages').update(body).eq('id', id).select().single();
        if (error) throw error;
        return data as PageRow;
      } else {
        const { data, error } = await supabase.from('pages').insert(body).select().single();
        if (error) throw error;
        return data as PageRow;
      }
    },
    onSuccess: (page) => {
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] });
      qc.setQueryData(['admin', 'pages', page.id], page);
      toast({ title: 'Salvo', description: `"${page.title}" salvo com sucesso.` });
    },
    onError: (err: Error) => {
      const isDuplicateSlug = err.message.includes('duplicate') || err.message.includes('unique');
      toast({
        title: 'Erro ao salvar',
        description: isDuplicateSlug
          ? 'Já existe uma página com esse slug. Escolha um slug diferente.'
          : err.message,
        variant: 'destructive',
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export function useDeletePage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] });
      toast({ title: 'Página excluída' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    },
  });
}

// ---------------------------------------------------------------------------
// Helper: get TipTap-ready content from a PageRow
// ---------------------------------------------------------------------------
export function getEditorContent(page: PageRow | undefined): TipTapDoc {
  return ensureTipTapDoc(page?.content ?? null);
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePageEditor.ts
git commit -m "feat: adiciona hook usePageEditor com CRUD via TanStack Query"
```

---

## Task 8: Update Sobre, Planos, Contato to use TipTapRenderer

**Files:**
- Modify: `src/pages/Sobre.tsx`
- Modify: `src/pages/Planos.tsx`
- Modify: `src/pages/Contato.tsx`

Replace `PageRenderer` import with `TipTapRenderer`. The conditional logic stays the same — only the component name changes.

- [ ] **Step 1: Update Sobre.tsx**

Find the imports block in `src/pages/Sobre.tsx` and replace:

```tsx
import { PageRenderer } from '@/components/page-builder/PageRenderer';
```

with:

```tsx
import { TipTapRenderer } from '@/components/editor/TipTapRenderer';
```

Then find every `<PageRenderer data={pageContent.content} />` and replace with:

```tsx
<TipTapRenderer content={pageContent.content} />
```

- [ ] **Step 2: Update Planos.tsx**

Same two replacements as Step 1, in `src/pages/Planos.tsx`.

- [ ] **Step 3: Update Contato.tsx**

Same two replacements in `src/pages/Contato.tsx`.

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep "error" | head -20
```

Expected: no errors. The PUCK fallback path in TipTapRenderer keeps existing pages rendering correctly.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Sobre.tsx src/pages/Planos.tsx src/pages/Contato.tsx
git commit -m "refactor: substitui PageRenderer por TipTapRenderer nas páginas do sistema"
```

---

## Task 9: AdminPages List Screen

**Files:**
- Create: `src/pages/admin/AdminPages.tsx`

- [ ] **Step 1: Create AdminPages.tsx**

```tsx
// src/pages/admin/AdminPages.tsx
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { usePagesList, useDeletePage } from '@/hooks/usePageEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Globe, Lock, ArrowLeft, ExternalLink } from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
};

const statusLabel: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
};

export default function AdminPages() {
  const navigate = useNavigate();
  const { data: pages = [], isLoading } = usePagesList();
  const deleteMutation = useDeletePage();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pageToDelete = pages.find((p) => p.id === deleteId);

  return (
    <>
      <Helmet><title>Gerenciador de Páginas - Admin</title></Helmet>
      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Gerenciador de Páginas</h1>
                <p className="text-sm text-muted-foreground">Crie e edite páginas do portal com editor rico</p>
              </div>
              <Button onClick={() => navigate('/admin/paginas/nova')}>
                <Plus className="h-4 w-4 mr-2" /> Nova Página
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Todas as Páginas ({pages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Visibilidade</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map((page) => (
                        <TableRow key={page.id}>
                          <TableCell className="font-medium">{page.title}</TableCell>
                          <TableCell>
                            <Badge variant={page.page_type === 'system' ? 'outline' : 'secondary'}>
                              {page.page_type === 'system' ? 'Sistema' : 'Livre'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[page.status] ?? 'outline'}>
                              {statusLabel[page.status] ?? page.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {page.is_public ? (
                              <span className="flex items-center gap-1 text-sm text-emerald-600">
                                <Globe className="h-3.5 w-3.5" /> Pública
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Lock className="h-3.5 w-3.5" /> Interna
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {page.is_public && page.status === 'published' ? (
                              <a
                                href={`${PRODUCTION_DOMAIN}/pagina/${page.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                /pagina/{page.slug}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">/{page.slug}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/paginas/${page.id}`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={page.page_type === 'system'}
                                title={page.page_type === 'system' ? 'Páginas do sistema não podem ser excluídas' : 'Excluir'}
                                onClick={() => setDeleteId(page.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </Layout>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{pageToDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O conteúdo da página será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { deleteMutation.mutate(deleteId!); setDeleteId(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminPages.tsx
git commit -m "feat: adiciona tela de listagem de páginas no admin"
```

---

## Task 10: AdminPageEditor Screen

**Files:**
- Create: `src/pages/admin/AdminPageEditor.tsx`

The main editor: tabs (Conteúdo / SEO / Configurações) + sticky sidebar (status, save, URL).

- [ ] **Step 1: Create AdminPageEditor.tsx**

```tsx
// src/pages/admin/AdminPageEditor.tsx
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { usePage, useSavePage, getEditorContent, type PageSavePayload } from '@/hooks/usePageEditor';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import type { TipTapDoc } from '@/lib/migrateBlocksToTipTap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Globe, Lock, ExternalLink, Loader2 } from 'lucide-react';
import slugify from '@/lib/slugify';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

export default function AdminPageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'nova';

  const { data: existing, isLoading } = usePage(isNew ? undefined : id);
  const saveMutation = useSavePage();

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isPublic, setIsPublic] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [content, setContent] = useState<TipTapDoc | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Populate form when existing data loads
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setSlug(existing.slug);
      setStatus(existing.status as 'draft' | 'published');
      setIsPublic(existing.is_public);
      setSeoTitle(existing.seo_title ?? '');
      setSeoDescription(existing.seo_description ?? '');
      setContent(getEditorContent(existing));
    }
  }, [existing]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setIsDirty(true);
    // Auto-generate slug only for new pages and only when slug is still empty/auto
    if (isNew) setSlug(slugify(value, { lower: true, strict: true }));
  };

  const handleContentChange = (doc: TipTapDoc) => {
    setContent(doc);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !content) return;
    const payload: PageSavePayload = {
      id: isNew ? undefined : id,
      title,
      slug,
      status,
      is_public: isPublic,
      page_type: existing?.page_type ?? 'free',
      seo_title: seoTitle || undefined,
      seo_description: seoDescription || undefined,
      content,
    };
    const saved = await saveMutation.mutateAsync(payload);
    setIsDirty(false);
    if (isNew) navigate(`/admin/paginas/${saved.id}`, { replace: true });
  };

  const isSystemPage = existing?.page_type === 'system';
  const publicUrl = isPublic && status === 'published' ? `${PRODUCTION_DOMAIN}/pagina/${slug}` : null;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isNew ? 'Nova Página' : `Editar: ${title}`} - Admin</title>
      </Helmet>
      <Layout>
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Header bar */}
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/paginas')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold flex-1 truncate">
                {isNew ? 'Nova Página' : title || 'Editar Página'}
              </h1>
              {isDirty && <span className="text-xs text-amber-600 font-medium">Alterações não salvas</span>}
            </div>

            <div className="flex gap-6">
              {/* Main content: tabs */}
              <div className="flex-1 min-w-0">
                <Tabs defaultValue="content">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título da página</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Ex: Sobre o projeto"
                        className="mt-1 text-lg font-semibold"
                      />
                    </div>
                    <TipTapEditor
                      content={content}
                      onChange={handleContentChange}
                      placeholder="Comece a escrever o conteúdo da página..."
                      className="mt-2"
                    />
                  </TabsContent>

                  <TabsContent value="seo" className="space-y-4">
                    <div>
                      <Label htmlFor="seo-title">Título SEO</Label>
                      <p className="text-xs text-muted-foreground mb-1">Exibido na aba do navegador e nos resultados de busca. Recomendado: 50–60 caracteres.</p>
                      <Input
                        id="seo-title"
                        value={seoTitle}
                        onChange={(e) => { setSeoTitle(e.target.value); setIsDirty(true); }}
                        placeholder={title}
                        maxLength={80}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{seoTitle.length}/80</p>
                    </div>
                    <div>
                      <Label htmlFor="seo-description">Descrição SEO</Label>
                      <p className="text-xs text-muted-foreground mb-1">Exibida nos resultados de busca. Recomendado: 120–160 caracteres.</p>
                      <Textarea
                        id="seo-description"
                        value={seoDescription}
                        onChange={(e) => { setSeoDescription(e.target.value); setIsDirty(true); }}
                        placeholder="Breve descrição do conteúdo da página..."
                        rows={3}
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{seoDescription.length}/200</p>
                    </div>
                    {/* Preview card */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Prévia no Google</p>
                      <p className="text-blue-600 text-sm font-medium truncate">{seoTitle || title || 'Título da página'}</p>
                      <p className="text-green-700 text-xs">{publicUrl ?? `${PRODUCTION_DOMAIN}/${slug || 'pagina/slug'}`}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{seoDescription || 'Descrição da página aparecerá aqui...'}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div>
                      <Label htmlFor="slug">Slug (URL)</Label>
                      <p className="text-xs text-muted-foreground mb-1">
                        {isSystemPage ? 'O slug de páginas do sistema não pode ser alterado.' : 'Identificador único na URL. Use apenas letras minúsculas, números e hifens.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">/pagina/</span>
                        <Input
                          id="slug"
                          value={slug}
                          onChange={(e) => { setSlug(e.target.value); setIsDirty(true); }}
                          disabled={isSystemPage}
                          placeholder="minha-pagina"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Visibilidade pública</Label>
                        <p className="text-xs text-muted-foreground">Quando ativado, a página fica acessível em <code>/pagina/{slug || 'slug'}</code></p>
                      </div>
                      <Switch
                        checked={isPublic}
                        onCheckedChange={(v) => { setIsPublic(v); setIsDirty(true); }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <aside className="w-64 flex-shrink-0">
                <Card className="sticky top-24">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Publicação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={status === 'published' ? 'default' : 'secondary'}>
                        {status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Visibilidade</span>
                      <span className="flex items-center gap-1 text-sm">
                        {isPublic ? <><Globe className="h-3.5 w-3.5 text-emerald-600" /> Pública</> : <><Lock className="h-3.5 w-3.5" /> Interna</>}
                      </span>
                    </div>

                    {publicUrl && (
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline break-all">
                        Ver página <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    )}

                    <Separator />

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => { setStatus(status === 'published' ? 'draft' : 'published'); setIsDirty(true); }}
                      >
                        {status === 'published' ? 'Mover para Rascunho' : 'Publicar'}
                      </Button>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={handleSave}
                        disabled={saveMutation.isPending || !title.trim() || !slug.trim()}
                      >
                        {saveMutation.isPending ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Salvando...</>
                        ) : (
                          <><Save className="h-3.5 w-3.5 mr-1.5" /> Salvar</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminPageEditor.tsx
git commit -m "feat: adiciona editor de páginas com abas Conteúdo/SEO/Config e painel lateral"
```

---

## Task 11: Routes + Admin Panel Card

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Admin.tsx`

### App.tsx

- [ ] **Step 1: Add lazy imports for new admin pages**

In `src/App.tsx`, find the block of lazy imports for admin pages (near other `const AdminX = lazy(...)` lines) and add:

```tsx
const AdminPages = lazy(() => import('@/pages/admin/AdminPages'));
const AdminPageEditor = lazy(() => import('@/pages/admin/AdminPageEditor'));
```

- [ ] **Step 2: Add routes**

Find the section in `App.tsx` where admin routes are defined (near `/admin/landing-pages`, `/admin/timeline` etc.) and add:

```tsx
<Route path="/admin/paginas" element={<AdminPages />} />
<Route path="/admin/paginas/:id" element={<AdminPageEditor />} />
```

Also find the line that redirects `/pagina/:slug` to `/` and replace it:

```tsx
{/* Before: */}
<Route path="/pagina/:slug" element={<Navigate to="/" replace />} />

{/* After: */}
<Route path="/pagina/:slug" element={<PublicPageView />} />
```

And add the lazy import for PublicPageView:

```tsx
const PublicPageView = lazy(() => import('@/pages/PublicPageView'));
```

### Admin.tsx

- [ ] **Step 3: Add "Gerenciador de Páginas" card to the CONTEÚDO category**

In `src/pages/Admin.tsx`, find the CONTEÚDO category modules array. Add the following entry after the `Landing Pages` entry:

```tsx
{
  title: 'Gerenciador de Páginas',
  description: 'Criar e editar páginas do portal com editor rico TipTap',
  icon: FileText,
  available: isAdmin,
  href: '/admin/paginas',
  comingSoon: false
},
```

Wait — `FileText` is already used for the blog editor. Import `BookOpen` from lucide-react to differentiate:

In the lucide import line at the top of `Admin.tsx`, add `BookOpen`.

Then use `icon: BookOpen` for the new card.

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep "error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/pages/Admin.tsx
git commit -m "feat: adiciona rotas e card admin para gerenciador de páginas"
```

---

## Task 12: PublicPageView

**Files:**
- Create: `src/pages/PublicPageView.tsx`

- [ ] **Step 1: Create PublicPageView.tsx**

```tsx
// src/pages/PublicPageView.tsx
import { Helmet } from 'react-helmet-async';
import { useParams, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { TipTapRenderer } from '@/components/editor/TipTapRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

export default function PublicPageView() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['public-page', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, slug, content, seo_title, seo_description, is_public, status')
        .eq('slug', slug!)
        .eq('status', 'published')
        .eq('is_public', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Page not found or not public — redirect home
  if (isError || !page) {
    return <Navigate to="/" replace />;
  }

  const title = page.seo_title || page.title;
  const description = page.seo_description ?? undefined;

  return (
    <>
      <Helmet>
        <title>{title} | Mulheres em Convergência</title>
        {description && <meta name="description" content={description} />}
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/pagina/${slug}`} />
      </Helmet>
      <Layout>
        <main className="container mx-auto px-4 py-12">
          <article className="max-w-3xl mx-auto">
            <TipTapRenderer content={page.content} />
          </article>
        </main>
      </Layout>
    </>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep "error" | head -20
```

- [ ] **Step 3: Full build check (no warnings to resolve)**

```bash
npm run build
```

Expected: clean build. This is the final functional task, so the build must be green.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PublicPageView.tsx
git commit -m "feat: restaura rota pública /pagina/:slug com TipTapRenderer"
```

---

## Task 13: Documentation Updates

**Files:**
- Create: `docs/_active/06-funcionalidades/page-editor-tiptap.md`
- Modify: `docs/_active/04-usuarios/user-management-complete.md`
- Modify: `docs/_active/04-usuarios/sistema-roles-seguro.md`
- Archive: `docs/_active/06-funcionalidades/page-builder-implementacao-completa.md` → `docs/_archive/`
- Create: `docs/_active/CHANGELOG-2026-05-27.md`

- [ ] **Step 1: Archive the old Page Builder doc**

```bash
mv "docs/_active/06-funcionalidades/page-builder-implementacao-completa.md" \
   "docs/_archive/page-builder-puck-removido.md"
```

Add a deprecation notice at the top of the archived file:

```markdown
> **⚠️ ARQUIVADO em 2026-05-27** — O Page Builder baseado em PUCK foi removido. Substituído pelo Editor TipTap. Ver: `docs/_active/06-funcionalidades/page-editor-tiptap.md`
```

- [ ] **Step 2: Create page-editor-tiptap.md**

Create `docs/_active/06-funcionalidades/page-editor-tiptap.md` with the following content:

```markdown
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
```

- [ ] **Step 3: Update user-management-complete.md**

Open `docs/_active/04-usuarios/user-management-complete.md` and find the "Gerenciar Roles" section. Replace or append:

```markdown
### ⚠️ Regras de Remoção de Roles (atualizado 2026-05-27)

- **`community_member`** é atribuída automaticamente no cadastro. O botão de remoção fica **desabilitado** na UI quando o usuário possui outras roles. Se tentada via DB, o trigger `validate_role_consistency` bloqueia com exceção.
- **`business_owner`** concede acesso ao **CONECTA+ como Membro**. Gerenciada pela assinatura.
- Ao tentar remover `community_member` com roles dependentes, a UI exibe: *"Remova primeiro todas as outras funções do usuário antes de retirar Membro da Comunidade."*
```

- [ ] **Step 4: Update sistema-roles-seguro.md**

Open `docs/_active/04-usuarios/sistema-roles-seguro.md` and add a new section after the existing content:

```markdown
## Proteção de UX (atualizado 2026-05-27)

### Trigger `validate_role_consistency`
Bloqueia a remoção de `community_member` quando o usuário possui roles dependentes (`business_owner`, `ambassador`, `blog_editor`, `admin`, etc.).

### Comportamento na UI (`UserManagement.tsx`)
- O botão de remover `community_member` é **desabilitado** quando o usuário tem outras roles
- Um ícone de cadeado e uma nota explicativa são exibidos
- `business_owner` é exibida com a label "(CONECTA+ Membro)" para clareza
- Erros do banco são exibidos em toast descritivo, nunca como erro genérico
```

- [ ] **Step 5: Create CHANGELOG-2026-05-27.md**

```markdown
# Changelog — 2026-05-27

## Correções

### Gestão de Roles (Admin)
- **Corrigido**: erro ao tentar remover role `community_member` de usuário com roles dependentes
- Botão de remoção de `community_member` agora fica desabilitado na UI quando o usuário possui outras roles
- `business_owner` agora exibe label "(CONECTA+ Membro)" para identificação clara
- Mensagens de erro do trigger `validate_role_consistency` são exibidas de forma amigável no toast

## Remoções

### Page Builder PUCK
- Removido o Page Builder baseado em PUCK (`@measured/puck`) do painel admin
- Removidas rotas: `/admin/paginas`, `/admin/construtor-paginas/novo`, `/admin/construtor-paginas/:id`
- Removidos componentes: `PageBuilder.tsx`, `PagesManagement.tsx`, `PageBuilderLink.tsx`
- `PageRenderer.tsx` e blocks **preservados** pois são usados por Sobre/Planos/Contato (migração lazy)

## Novas Funcionalidades

### Editor de Páginas TipTap
- Novo editor rico baseado em TipTap substituindo o PUCK removido
- Suporte a: headings, bold/italic, listas, links, imagens (upload R2), tabelas, blockquotes, vídeos YouTube/Vimeo, blocos Callout e CTA
- Migração automática de conteúdo PUCK → TipTap JSON no primeiro save
- Renderização segura via `TipTapRenderer` (sem `dangerouslySetInnerHTML`)
- Admin: listagem em `/admin/paginas`, editor em `/admin/paginas/:id`
- Rota pública `/pagina/:slug` restaurada
- Páginas com toggle público/interno e campos de SEO
```

- [ ] **Step 6: Commit documentation**

```bash
git add \
  docs/_archive/page-builder-puck-removido.md \
  docs/_active/06-funcionalidades/page-editor-tiptap.md \
  docs/_active/04-usuarios/user-management-complete.md \
  docs/_active/04-usuarios/sistema-roles-seguro.md \
  docs/_active/CHANGELOG-2026-05-27.md
git commit -m "docs: atualiza documentação — arquiva Page Builder, documenta editor TipTap e correções de roles"
```

---

## Self-Review Notes

### Spec coverage check
| Spec requirement | Task |
|---|---|
| TipTap JSON in JSONB column | Task 1 (migration) + Task 3 (types) |
| editable: false (no dangerouslySetInnerHTML) | Task 6 (TipTapRenderer) |
| Full rich text extensions | Task 5 (TipTapEditor) |
| Cloudflare R2 image upload | Task 5 (TipTapEditor handleImageUpload) |
| Video embeds (YouTube/Vimeo) | Task 4 + Task 5 (Youtube extension) |
| Callout + CTA custom nodes | Task 4 (custom extensions) |
| Admin list page | Task 9 (AdminPages) |
| Editor with tabs + sidebar | Task 10 (AdminPageEditor) |
| Lazy migration (PUCK → TipTap on save) | Task 3 (ensureTipTapDoc) + Task 8 (update Sobre/etc) |
| is_public toggle | Task 1 (migration) + Task 10 (editor) |
| page_type = system (no delete) | Task 1 (migration) + Task 9 (AdminPages) |
| SEO fields | Task 1 (migration) + Task 10 (SEO tab) |
| Route /pagina/:slug restored | Task 11 (routes) + Task 12 (PublicPageView) |
| Admin panel card | Task 11 (Admin.tsx) |
| Documentation plan (archive + update + create) | Task 13 |

All spec requirements have a corresponding task. ✓
