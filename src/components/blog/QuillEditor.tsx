import { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from 'sonner';

interface QuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  className?: string;
}

export const QuillEditor = ({ 
  value, 
  onChange, 
  height = 400,
  placeholder = 'Digite o conteúdo...',
  className = ''
}: QuillEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);
  const { uploadImage } = useImageUpload();
  const [isLoaded, setIsLoaded] = useState(false);

  // Custom image handler for uploads
  const imageHandler = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const imageUrl = await uploadImage(file);
          if (imageUrl && quillRef.current) {
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection();
            quill.insertEmbed(range?.index || 0, 'image', imageUrl);
          }
        } catch (error) {
          toast.error('Erro ao fazer upload da imagem');
        }
      }
    };
  };

  // Quill modules configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }, { 'align': [] }],
        ['link', 'image', 'video', 'formula'],
        ['blockquote', 'code-block'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    history: {
      delay: 1000,
      maxStack: 500,
      userOnly: true
    },
    clipboard: {
      matchVisual: false
    }
  };

  // Formats allowed
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'direction',
    'code-block', 'formula',
    'script'
  ];

  useEffect(() => {
    // Add a small delay to ensure proper initialization
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Custom styles for the editor
  const editorStyle = {
    height: `${height}px`,
    marginBottom: '42px' // Account for toolbar height
  };

  if (!isLoaded) {
    return (
      <div className={`border rounded-md ${className}`} style={editorStyle}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Carregando editor rico...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`quill-editor-container ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{
          height: `${height}px`,
        }}
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .quill-editor-container .ql-container {
          font-family: 'Montserrat', system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .quill-editor-container .ql-editor {
          min-height: ${height - 42}px;
        }
        
        .quill-editor-container .ql-editor h1,
        .quill-editor-container .ql-editor h2,
        .quill-editor-container .ql-editor h3,
        .quill-editor-container .ql-editor h4,
        .quill-editor-container .ql-editor h5,
        .quill-editor-container .ql-editor h6 {
          font-family: 'Nexa Light', system-ui, sans-serif;
          color: hsl(var(--primary));
        }
        
        .quill-editor-container .ql-toolbar {
          border-color: hsl(var(--border));
        }
        
        .quill-editor-container .ql-container {
          border-color: hsl(var(--border));
        }
        
        .quill-editor-container .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        
        .quill-editor-container .ql-toolbar .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        
        .quill-editor-container .ql-toolbar .ql-fill {
          fill: hsl(var(--foreground));
        }
        
        .quill-editor-container .ql-toolbar .ql-picker-label {
          color: hsl(var(--foreground));
        }
        
        .quill-editor-container .ql-toolbar button:hover,
        .quill-editor-container .ql-toolbar button:focus {
          color: hsl(var(--primary));
        }
        
        .quill-editor-container .ql-toolbar button.ql-active {
          color: hsl(var(--primary));
        }
        
        .quill-editor-container .ql-toolbar .ql-picker.ql-expanded .ql-picker-label {
          color: hsl(var(--primary));
        }
      `}} />
    </div>
  );
};