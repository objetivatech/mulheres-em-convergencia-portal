import { Editor } from '@tinymce/tinymce-react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  height = 500,
  placeholder = 'Escreva o conteúdo do seu post...' 
}: RichTextEditorProps) => {
  const { uploadImage } = useImageUpload();

  const handleImageUpload = async (blobInfo: any, success: (url: string) => void, failure: (msg: string) => void) => {
    const file = blobInfo.blob();
    const imageUrl = await uploadImage(file);
    
    if (imageUrl) {
      success(imageUrl);
    } else {
      failure('Erro ao fazer upload da imagem');
    }
  };

  return (
    <div className="w-full">
      <Editor
        apiKey="your-tinymce-api-key" // You'll need to get a free API key from TinyMCE
        value={value}
        onEditorChange={onChange}
        init={{
          height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | image media link | code preview | help',
          content_style: `
            body { 
              font-family: 'Montserrat', system-ui, sans-serif; 
              font-size: 14px;
              line-height: 1.6;
              color: hsl(222.2, 84%, 4.9%);
            }
            h1, h2, h3, h4, h5, h6 {
              font-family: 'Nexa Light', system-ui, sans-serif;
              color: hsl(337, 49%, 57%);
            }
          `,
          placeholder,
          branding: false,
          promotion: false,
          images_upload_handler: handleImageUpload,
          images_upload_url: false,
          paste_data_images: true,
          automatic_uploads: true,
          file_picker_types: 'image',
          image_dimensions: false,
          image_class_list: [
            { title: 'Responsiva', value: 'img-responsive' },
            { title: 'Centralizada', value: 'mx-auto' },
            { title: 'À esquerda', value: 'float-left' },
            { title: 'À direita', value: 'float-right' }
          ],
          link_class_list: [
            { title: 'Link padrão', value: '' },
            { title: 'Link primário', value: 'text-primary hover:text-primary/80' },
            { title: 'Link externo', value: 'external-link' }
          ],
          table_class_list: [
            { title: 'Tabela padrão', value: 'table' },
            { title: 'Tabela listrada', value: 'table table-striped' }
          ],
          block_formats: 'Parágrafo=p; Título 1=h1; Título 2=h2; Título 3=h3; Título 4=h4; Título 5=h5; Título 6=h6; Pré-formatado=pre',
          style_formats: [
            { title: 'Destaque', inline: 'mark', styles: { backgroundColor: 'hsl(337, 49%, 57%, 0.2)' } },
            { title: 'Citação', block: 'blockquote', styles: { borderLeft: '4px solid hsl(337, 49%, 57%)', paddingLeft: '1rem', fontStyle: 'italic' } },
            { title: 'Código inline', inline: 'code', styles: { backgroundColor: 'hsl(220, 13%, 91%)', padding: '2px 4px', borderRadius: '3px' } }
          ]
        }}
      />
    </div>
  );
};