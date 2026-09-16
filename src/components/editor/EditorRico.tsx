// src/components/editor/EditorRico.tsx
// Editor visual único do portal. Guarda o conteúdo como HTML nas colunas de
// texto já existentes (páginas, posts, eventos, planos, negócios, bios...),
// mas quem edita nunca vê código: só a barra de ferramentas.
import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import { useR2Storage } from '@/hooks/useR2Storage';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon, Video, Undo, Redo, Trash2, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EditorRicoProps {
  /** Conteúdo atual em HTML (aceita HTML legado sem conversão). */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Pasta no Cloudflare R2 onde as imagens deste editor são guardadas. */
  pasta?: string;
  className?: string;
  /** Altura mínima da área de escrita. */
  minHeight?: number;
  /** Versão reduzida: sem tabelas nem vídeos (bios, apresentações curtas). */
  simples?: boolean;
}

export function EditorRico({
  value,
  onChange,
  placeholder = 'Escreva aqui...',
  pasta = 'conteudo',
  className,
  minHeight = 260,
  simples = false,
}: EditorRicoProps) {
  const { uploadFile, uploading } = useR2Storage();
  const inputImagem = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full h-auto' } }),
      Youtube.configure({ controls: true, nocookie: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3',
        style: `min-height:${minHeight}px`,
      },
    },
  });

  // Recarrega o conteúdo quando o registro terminar de carregar do banco.
  useEffect(() => {
    if (!editor) return;
    const atual = editor.getHTML();
    const novo = value || '';
    if (novo !== atual && !editor.isFocused) {
      editor.commands.setContent(novo, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const enviarImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    const url = await uploadFile(arquivo, pasta);
    if (url) editor.chain().focus().setImage({ src: url, alt: arquivo.name }).run();
  };

  const definirLink = () => {
    const anterior = (editor.getAttributes('link').href as string) ?? '';
    const url = window.prompt('Endereço do link (comece com https://):', anterior);
    if (url === null) return;
    if (url.trim() === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const inserirVideo = () => {
    const url = window.prompt('Endereço do vídeo no YouTube:');
    if (url?.trim()) editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
  };

  const botao = (ativo: boolean, desabilitado = false) =>
    cn('h-8 w-8 p-0', ativo && 'bg-accent text-accent-foreground', desabilitado && 'opacity-40');

  return (
    <div className={cn('rounded-md border border-border bg-background overflow-hidden', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1">
        <Button type="button" variant="ghost" size="sm" className={botao(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={botao(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico">
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={botao(editor.isActive('strike'))}
          onClick={() => editor.chain().focus().toggleStrike().run()} title="Riscado">
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>

        <span className="mx-1 h-5 w-px bg-border" />

        <Button type="button" variant="ghost" size="sm" className={botao(editor.isActive('heading', { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título">
          <Heading1 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={botao(editor.isActive('heading', { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subtítulo">
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={botao(editor.isActive('heading', { level: 4 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} title="Título menor">
          <Heading3 className="h-3.5 w-3.5" />
        </Button>

        <span className="mx-1 h-5 w-px bg-border" />

        <Button type="button" variant="ghost" size="sm" className={botao(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={botao(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={botao(editor.isActive('blockquote'))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação">
          <Quote className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={botao(false)}
          onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha divisória">
          <Minus className="h-3.5 w-3.5" />
        </Button>

        <span className="mx-1 h-5 w-px bg-border" />

        <Button type="button" variant="ghost" size="sm" className={botao(editor.isActive('link'))}
          onClick={definirLink} title="Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={botao(false, uploading)}
          onClick={() => inputImagem.current?.click()} disabled={uploading} title="Enviar imagem">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
        </Button>
        <input ref={inputImagem} type="file" accept="image/*" className="hidden" onChange={enviarImagem} />

        {!simples && (
          <>
            <Button type="button" variant="ghost" size="sm" className={botao(false)}
              onClick={inserirVideo} title="Vídeo do YouTube">
              <Video className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="sm" className={botao(false)}
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              title="Tabela">
              <TableIcon className="h-3.5 w-3.5" />
            </Button>
            {editor.isActive('table') && (
              <Button type="button" variant="ghost" size="sm" className={botao(false)}
                onClick={() => editor.chain().focus().deleteTable().run()} title="Remover tabela">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </>
        )}

        <span className="mx-1 ml-auto h-5 w-px bg-border" />

        <Button type="button" variant="ghost" size="sm" className={botao(false, !editor.can().undo())}
          onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer">
          <Undo className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={botao(false, !editor.can().redo())}
          onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer">
          <Redo className="h-3.5 w-3.5" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

export default EditorRico;
