import { useEffect, useRef } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface TrumbowygEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  className?: string;
}

export const TrumbowygEditor = ({ 
  value, 
  onChange, 
  height = 400,
  placeholder = 'Digite o conteúdo...',
  className = ''
}: TrumbowygEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { uploadImage } = useImageUpload();

  useEffect(() => {
    const loadTrumbowyg = async () => {
      if (typeof window === 'undefined' || !editorRef.current) return;

      try {
        // Import styles first
        await import('trumbowyg/dist/ui/trumbowyg.min.css');
        await import('trumbowyg/dist/plugins/colors/ui/trumbowyg.colors.min.css');
        await import('trumbowyg/dist/plugins/emoji/ui/trumbowyg.emoji.min.css');
        await import('trumbowyg/dist/plugins/table/ui/trumbowyg.table.min.css');
        
        // Import jQuery
        const $ = (await import('jquery')).default;
        (window as any).$ = (window as any).jQuery = $;

        // Import Trumbowyg core
        await import('trumbowyg');

        // Import plugins
        await import('trumbowyg/dist/langs/pt_br.min.js');
        await import('trumbowyg/dist/plugins/cleanpaste/trumbowyg.cleanpaste.min.js');
        await import('trumbowyg/dist/plugins/colors/trumbowyg.colors.min.js');
        await import('trumbowyg/dist/plugins/emoji/trumbowyg.emoji.min.js');
        await import('trumbowyg/dist/plugins/fontfamily/trumbowyg.fontfamily.min.js');
        await import('trumbowyg/dist/plugins/fontsize/trumbowyg.fontsize.min.js');
        await import('trumbowyg/dist/plugins/history/trumbowyg.history.min.js');
        await import('trumbowyg/dist/plugins/table/trumbowyg.table.min.js');

        // Initialize Trumbowyg
        const $editor = $(editorRef.current!) as any;
        
        $editor.trumbowyg({
          lang: 'pt_br',
          
          btns: [
            ['viewHTML'],
            ['undo', 'redo'],
            ['formatting'],
            ['fontfamily'],
            ['fontsize'],
            ['foreColor', 'backColor'],
            ['strong', 'em', 'del'],
            ['superscript', 'subscript'],
            ['link'],
            ['insertImage'],
            ['emoji'],
            ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
            ['unorderedList', 'orderedList'],
            ['horizontalRule'],
            ['removeformat'],
            ['table']
          ],

          plugins: {
            cleanpaste: true,
            
            fontfamily: {
              fontList: [
                { name: 'Arial', family: 'Arial, sans-serif' },
                { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
                { name: 'Tahoma', family: 'Tahoma, Geneva, sans-serif' },
                { name: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
                { name: 'Times New Roman', family: 'Times New Roman, Times, serif' },
                { name: 'Montserrat', family: 'Montserrat, sans-serif' },
                { name: 'Quicksand', family: 'Quicksand, sans-serif' },
                { name: 'Poppins', family: 'Poppins, sans-serif' },
                { name: 'Lato', family: 'Lato, sans-serif' }
              ]
            },

            fontsize: {
              sizeList: ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '60px']
            }
          },

          autogrow: true,
          removeformatPasted: true,
          
          semantic: {
            'b': 'strong',
            'i': 'em',
            's': 'del'
          }
        })
        .on('tbwchange', () => {
          const content = $editor.trumbowyg('html');
          onChange(content);
        })
        .on('tbwinit', () => {
          if (value) {
            $editor.trumbowyg('html', value);
          }
        });

      } catch (error) {
        console.error('Error loading Trumbowyg:', error);
        // Fallback to simple textarea
        if (editorRef.current) {
          editorRef.current.innerHTML = `<textarea 
            style="width: 100%; min-height: ${height}px; padding: 1rem; border: 1px solid hsl(var(--border)); border-radius: 8px;" 
            placeholder="${placeholder}">${value}</textarea>`;
          
          const textarea = editorRef.current.querySelector('textarea') as HTMLTextAreaElement;
          if (textarea) {
            textarea.addEventListener('input', (e) => {
              onChange((e.target as HTMLTextAreaElement).value);
            });
          }
        }
      }
    };

    loadTrumbowyg();

    return () => {
      // Cleanup
      if (editorRef.current && typeof window !== 'undefined' && (window as any).$) {
        try {
          const $editor = (window as any).$(editorRef.current) as any;
          if ($editor.data && $editor.data('trumbowyg')) {
            $editor.trumbowyg('destroy');
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Update content when value prop changes
  useEffect(() => {
    if (editorRef.current && typeof window !== 'undefined' && (window as any).$) {
      try {
        const $editor = (window as any).$(editorRef.current) as any;
        if ($editor.data && $editor.data('trumbowyg')) {
          const currentContent = $editor.trumbowyg('html');
          if (currentContent !== value) {
            $editor.trumbowyg('html', value);
          }
        }
      } catch (e) {
        // Ignore update errors
      }
    }
  }, [value]);

  return (
    <div className={`trumbowyg-editor-wrapper ${className}`}>
      <div 
        ref={editorRef}
        style={{ minHeight: height }}
        data-placeholder={placeholder}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
        .trumbowyg-box {
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          overflow: hidden;
        }
        .trumbowyg-button-pane {
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
        }
        .trumbowyg-button-pane button {
          color: hsl(var(--foreground));
          background: transparent;
        }
        .trumbowyg-button-pane button:hover {
          background: hsl(var(--accent));
        }
        .trumbowyg-editor {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: 'Montserrat', system-ui, sans-serif;
          line-height: 1.6;
          min-height: ${height}px;
          padding: 1rem;
        }
      `}} />
    </div>
  );
};