import React, { useRef, useEffect } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface TinyMCESelfHostedProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    tinymce: any;
  }
}

type TinyMCESource = 'cdn' | 'self' | 'existing';

const TINYMCE_VERSION = '8.1.2';
const TINYMCE_CDN_BASE_URL = `https://cdn.jsdelivr.net/npm/tinymce@${TINYMCE_VERSION}`;
const TINYMCE_CDN_URL = `${TINYMCE_CDN_BASE_URL}/tinymce.min.js`;
const TINYMCE_SELF_BASE_URL = `/tinymce_${TINYMCE_VERSION}/tinymce/js/tinymce`;
const TINYMCE_SELF_URL = `${TINYMCE_SELF_BASE_URL}/tinymce.min.js`;

let tinymceLoadPromise: Promise<TinyMCESource> | null = null;

function loadScriptOnce(src: string, loaderKey: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-tinymce-loader="${loaderKey}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      if (window.tinymce) return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error(`Falha ao carregar script TinyMCE: ${src}`)),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    script.dataset.tinymceLoader = loaderKey;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar script TinyMCE: ${src}`));

    document.head.appendChild(script);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('timeout')), ms);

    promise
      .then((v) => {
        clearTimeout(timeoutId);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timeoutId);
        reject(e);
      });
  });
}

async function loadTinyMCE(): Promise<TinyMCESource> {
  if (typeof window === 'undefined') throw new Error('TinyMCE só pode carregar no browser');
  if (window.tinymce) return 'existing';
  if (tinymceLoadPromise) return tinymceLoadPromise;

  tinymceLoadPromise = (async () => {
    try {
      const source: TinyMCESource = await withTimeout(
        loadScriptOnce(TINYMCE_CDN_URL, 'cdn').then(() => 'cdn' as const),
        5000
      ).catch(async () => {
        await loadScriptOnce(TINYMCE_SELF_URL, 'self');
        return 'self' as const;
      });

      if (!window.tinymce) {
        throw new Error('TinyMCE carregou, mas window.tinymce não foi definido');
      }

      // Define baseURL para resolver skins/plugins corretamente
      window.tinymce.baseURL = source === 'self' ? TINYMCE_SELF_BASE_URL : TINYMCE_CDN_BASE_URL;

      return source;
    } catch (e) {
      tinymceLoadPromise = null; // permite retry em próximas tentativas
      throw e;
    }
  })();

  return tinymceLoadPromise;
}

export const TinyMCESelfHosted: React.FC<TinyMCESelfHostedProps> = ({
  value,
  onChange,
  height = 400,
  placeholder = "Digite seu conteúdo aqui...",
  className = ""
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { uploadImage } = useImageUpload();

  // ID precisa ser estável entre renders; se mudar antes do script carregar,
  // o TinyMCE tenta inicializar em um selector que não existe e o editor “some”.
  const editorIdRef = useRef<string>(
    `tinymce-editor-${
      (globalThis.crypto && 'randomUUID' in globalThis.crypto
        ? (globalThis.crypto as Crypto).randomUUID()
        : Math.random().toString(36).slice(2))
    }`
  );
  const editorId = editorIdRef.current;

  useEffect(() => {
    let cancelled = false;

    loadTinyMCE()
      .then((source) => {
        if (cancelled) return;
        console.log(`TinyMCE disponível (${source})`);

        // Garante que o textarea está no DOM antes de inicializar
        const el = document.getElementById(editorId);
        if (!el) {
          // Em cenários raros, aguarda um frame
          requestAnimationFrame(() => {
            if (!cancelled) initTinyMCE();
          });
          return;
        }

        initTinyMCE();
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Falha ao carregar TinyMCE:', err);
        if (editorRef.current) {
          editorRef.current.placeholder =
            'Erro ao carregar editor. Por favor, recarregue a página.';
        }
      });

    return () => {
      cancelled = true;

      const editor = window.tinymce?.get?.(editorId);
      if (editor) {
        window.tinymce.remove(editor);
      }
    };
    // editorId é estável (useRef), mas mantemos na deps por clareza
  }, [editorId]);

  const initTinyMCE = () => {
    if (!window.tinymce) return;
    if (!document.getElementById(editorId)) return;

    // Evita instâncias duplicadas no mesmo id
    const existing = window.tinymce.get?.(editorId);
    if (existing) {
      window.tinymce.remove(existing);
    }

    try {
      const initResult = window.tinymce.init({
        selector: `#${editorId}`,
        height: height,
        license_key: 'gpl',
        plugins: [
          'advlist',
          'autolink',
          'lists',
          'link',
          'image',
          'charmap',
          'preview',
          'anchor',
          'searchreplace',
          'visualblocks',
          'code',
          'fullscreen',
          'insertdatetime',
          'media',
          'table',
          'help',
          'wordcount',
        ],
        toolbar:
          'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | image media table | code help',
        content_style: `
          body { 
            font-family: 'Montserrat', Arial, sans-serif; 
            font-size: 14px; 
            line-height: 1.6;
            color: hsl(var(--foreground));
            background: hsl(var(--background));
          }
          h1, h2, h3, h4, h5, h6 { 
            font-family: 'Nexa Light', Arial, sans-serif; 
            color: hsl(var(--primary));
          }
        `,
        setup: (editor: any) => {
          editor.on('change keyup', () => {
            const content = editor.getContent();
            onChange(content);
          });
        },
        init_instance_callback: (editor: any) => {
          console.log('TinyMCE initialized successfully');

          // Set initial content when editor is ready
          if (value && value !== editor.getContent()) {
            editor.setContent(value);
          }

          // Set up value change listener
          editor.on('SetContent', () => {
            const currentContent = editor.getContent();
            if (currentContent !== value) {
              onChange(currentContent);
            }
          });
        },
        images_upload_handler: async (blobInfo: any) => {
          const file = blobInfo.blob();
          const url = await uploadImage(file, 'blog-images');
          return url || '';
        },
        automatic_uploads: true,
        file_picker_types: 'image',
        file_picker_callback: (callback: any) => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');

          input.addEventListener('change', async (e: any) => {
            const file = e.target.files[0];
            if (file) {
              const url = await uploadImage(file, 'blog-images');
              if (url) {
                callback(url, { alt: file.name });
              }
            }
          });

          input.click();
        },
        placeholder: placeholder,
        menubar: false,
        branding: false,
        resize: true,
        statusbar: true,
        elementpath: false,
      });

      // tinymce.init retorna Promise nas versões modernas
      Promise.resolve(initResult).catch((e) => {
        console.error('Erro ao inicializar TinyMCE:', e);
        if (editorRef.current) {
          editorRef.current.placeholder =
            'Erro ao inicializar editor. Tente recarregar a página.';
        }
      });
    } catch (e) {
      console.error('Erro ao inicializar TinyMCE:', e);
      if (editorRef.current) {
        editorRef.current.placeholder =
          'Erro ao inicializar editor. Tente recarregar a página.';
      }
    }
  };

  // Update editor content when value prop changes (after initialization)
  useEffect(() => {
    if (window.tinymce && window.tinymce.get(editorId)) {
      const editor = window.tinymce.get(editorId);
      const currentContent = editor.getContent();
      if (currentContent !== value) {
        editor.setContent(value || '');
      }
    }
  }, [value, editorId]);

  return (
    <div className={`tinymce-container ${className}`}>
      <textarea
        id={editorId}
        ref={editorRef}
        defaultValue={value}
        style={{ width: '100%', minHeight: `${height}px` }}
      />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .tinymce-container .tox .tox-editor-header {
            background: hsl(var(--muted)) !important;
            border-bottom: 1px solid hsl(var(--border)) !important;
          }
          
          .tinymce-container .tox .tox-toolbar__primary {
            background: hsl(var(--muted)) !important;
          }
          
          .tinymce-container .tox .tox-edit-area__iframe {
            background: hsl(var(--background)) !important;
          }
          
          .tinymce-container .tox:not([dir=rtl]) .tox-toolbar__group:not(:last-of-type) {
            border-right: 1px solid hsl(var(--border)) !important;
          }
          
          .tinymce-container .tox .tox-tbtn {
            color: hsl(var(--foreground)) !important;
          }
          
          .tinymce-container .tox .tox-tbtn:hover {
            background: hsl(var(--accent)) !important;
          }
          
          .tinymce-container .tox .tox-statusbar {
            background: hsl(var(--muted)) !important;
            border-top: 1px solid hsl(var(--border)) !important;
            color: hsl(var(--muted-foreground)) !important;
          }
        `
      }} />
    </div>
  );
};