// src/components/editor/TipTapEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { CalloutNode } from './extensions/CalloutNode';
import { CTANode } from './extensions/CTANode';
import { useRef } from 'react';
import { useR2Storage } from '@/hooks/useR2Storage';
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
    }
    // useR2Storage already shows a toast on failure — no redundant toast needed here.
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
