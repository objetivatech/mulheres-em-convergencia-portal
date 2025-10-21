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

export const TinyMCESelfHosted: React.FC<TinyMCESelfHostedProps> = ({
  value,
  onChange,
  height = 400,
  placeholder = "Digite seu conteúdo aqui...",
  className = ""
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { uploadImage } = useImageUpload();
  const editorId = 'tinymce-editor-' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let cdnFailed = false;

    // Load TinyMCE script dynamically with CDN first, then self-hosted fallback
    if (!window.tinymce) {
      const script = document.createElement('script');
      
      // Try CDN first for reliability and speed
      script.src = 'https://cdn.jsdelivr.net/npm/tinymce@8.1.2/tinymce.min.js';
      
      // Set timeout to fallback if CDN is slow
      timeoutId = setTimeout(() => {
        if (!window.tinymce && !cdnFailed) {
          console.warn('CDN TinyMCE timeout, trying self-hosted...');
          cdnFailed = true;
          loadSelfHosted();
        }
      }, 5000);
      
      script.onload = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (!cdnFailed) {
          console.log('TinyMCE loaded from CDN');
          initTinyMCE();
        }
      };
      
      // Fallback to self-hosted if CDN fails
      script.onerror = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (!cdnFailed) {
          console.warn('CDN TinyMCE failed, trying self-hosted...');
          cdnFailed = true;
          loadSelfHosted();
        }
      };
      
      document.head.appendChild(script);
    } else {
      initTinyMCE();
    }

    function loadSelfHosted() {
      const fallbackScript = document.createElement('script');
      fallbackScript.src = '/tinymce_8.1.2/tinymce/js/tinymce/tinymce.min.js';
      fallbackScript.onload = () => {
        console.log('TinyMCE loaded from self-hosted');
        // Set base_url for self-hosted plugins/skins resolution
        if (window.tinymce) {
          window.tinymce.baseURL = '/tinymce_8.1.2/tinymce/js/tinymce';
        }
        initTinyMCE();
      };
      fallbackScript.onerror = () => {
        console.error('TinyMCE failed to load from all sources');
        // Show error message to user
        if (editorRef.current) {
          editorRef.current.placeholder = 'Erro ao carregar editor. Por favor, recarregue a página.';
        }
      };
      document.head.appendChild(fallbackScript);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (window.tinymce) {
        window.tinymce.remove(`#${editorId}`);
      }
    };
  }, []);

  const initTinyMCE = () => {
    if (!window.tinymce) return;

    window.tinymce.init({
      selector: `#${editorId}`,
      height: height,
      license_key: 'gpl',
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | blocks | ' +
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
      elementpath: false
    });
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