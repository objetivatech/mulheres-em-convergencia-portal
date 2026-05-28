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
