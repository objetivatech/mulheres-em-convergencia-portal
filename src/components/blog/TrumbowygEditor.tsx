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
        // Import jQuery first
        const $ = (await import('jquery')).default;
        (window as any).$ = (window as any).jQuery = $;

        // Import styles and core in parallel
        await Promise.all([
          import('trumbowyg/dist/ui/trumbowyg.min.css'),
          import('trumbowyg/dist/plugins/colors/ui/trumbowyg.colors.min.css'),
          import('trumbowyg/dist/plugins/emoji/ui/trumbowyg.emoji.min.css'),
          import('trumbowyg/dist/plugins/table/ui/trumbowyg.table.min.css'),
          import('trumbowyg/dist/plugins/upload/ui/trumbowyg.upload.min.css'),
          import('trumbowyg')
        ]);

        // Import plugins in parallel
        await Promise.all([
          import('trumbowyg/dist/langs/pt_br.min.js'),
          import('trumbowyg/dist/plugins/allowtagsfrompaste/trumbowyg.allowtagsfrompaste.min.js'),
          import('trumbowyg/dist/plugins/cleanpaste/trumbowyg.cleanpaste.min.js'),
          import('trumbowyg/dist/plugins/colors/trumbowyg.colors.min.js'),
          import('trumbowyg/dist/plugins/emoji/trumbowyg.emoji.min.js'),
          import('trumbowyg/dist/plugins/fontfamily/trumbowyg.fontfamily.min.js'),
          import('trumbowyg/dist/plugins/fontsize/trumbowyg.fontsize.min.js'),
          import('trumbowyg/dist/plugins/giphy/trumbowyg.giphy.min.js'),
          import('trumbowyg/dist/plugins/history/trumbowyg.history.min.js'),
          import('trumbowyg/dist/plugins/insertaudio/trumbowyg.insertaudio.min.js'),
          import('trumbowyg/dist/plugins/lineheight/trumbowyg.lineheight.min.js'),
          import('trumbowyg/dist/plugins/mention/trumbowyg.mention.min.js'),
          import('trumbowyg/dist/plugins/noembed/trumbowyg.noembed.min.js'),
          import('trumbowyg/dist/plugins/pasteembed/trumbowyg.pasteembed.min.js'),
          import('trumbowyg/dist/plugins/resizimg/trumbowyg.resizimg.min.js'),
          import('trumbowyg/dist/plugins/table/trumbowyg.table.min.js'),
          import('trumbowyg/dist/plugins/template/trumbowyg.template.min.js'),
          import('trumbowyg/dist/plugins/upload/trumbowyg.upload.min.js')
        ]);

        // Initialize Trumbowyg
        const $editor = $(editorRef.current!) as any;
        
        $editor.trumbowyg({
          lang: 'pt_br',
          svgPath: 'https://cdn.jsdelivr.net/npm/trumbowyg@2.31.0/dist/ui/icons.svg',
          
          btns: [
            ['viewHTML'],
            ['undo', 'redo'],
            ['formatting'],
            ['fontfamily'],
            ['fontsize', 'lineheight'],
            ['foreColor', 'backColor'],
            ['strong', 'em', 'del'],
            ['superscript', 'subscript'],
            ['link'],
            ['upload', 'insertImage', 'insertAudio'],
            ['emoji', 'giphy'],
            ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
            ['unorderedList', 'orderedList'],
            ['horizontalRule'],
            ['table'],
            ['template'],
            ['noembed'],
            ['removeformat']
          ],

          plugins: {
            allowTagsFromPaste: {
              allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 'strike', 'a', 'img', 'ul', 'ol', 'li', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td']
            },
            
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
            },

            lineheight: {
              sizeList: ['1.0', '1.2', '1.4', '1.6', '1.8', '2.0', '2.5', '3.0']
            },

            giphy: {
              apiKey: 'ZnkCWjGQ4zeheyXy0VEIsxjFxkcBINvP'
            },

            upload: {
              serverPath: '/api/upload',
              fileFieldName: 'file',
              urlPropertyName: 'url',
              imageWidthModalEdit: true,
              headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('supabase.auth.token') || '')
              },
              success: async (data: any, trumbowyg: any, $modal: any, values: any) => {
                // Custom upload to Supabase
                if (values.file) {
                  try {
                    const imageUrl = await uploadImage(values.file);
                    trumbowyg.execCmd('insertImage', imageUrl);
                  } catch (error) {
                    console.error('Upload error:', error);
                  }
                }
                return false; // Prevent default behavior
              }
            },

            mention: {
              source: [
                { label: '@admin', value: 'admin' },
                { label: '@editor', value: 'editor' }
              ]
            },

            template: {
              templates: [
                {
                  name: 'Parágrafo de Destaque',
                  html: '<div class="highlight-box"><p>Texto em destaque aqui...</p></div>'
                },
                {
                  name: 'Citação',
                  html: '<blockquote><p>Sua citação aqui...</p><footer>— Autor</footer></blockquote>'
                }
              ]
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