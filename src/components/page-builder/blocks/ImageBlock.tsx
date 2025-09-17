import React from 'react';
import { ComponentConfig } from '@measured/puck';

export interface ImageBlockProps {
  src: string;
  alt: string;
  width: string;
  height: string;
  align: 'left' | 'center' | 'right';
  rounded: boolean;
  shadow: boolean;
  link: string;
  caption: string;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  src,
  alt,
  width,
  height,
  align,
  rounded,
  shadow,
  link,
  caption
}) => {
  const getAlignClass = (align: string) => {
    const classes = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    return classes[align as keyof typeof classes] || classes.left;
  };

  const imageClasses = [
    rounded ? 'rounded-lg' : '',
    shadow ? 'shadow-lg' : '',
    'max-w-full h-auto'
  ].filter(Boolean).join(' ');

  const imageElement = (
    <img
      src={src}
      alt={alt}
      className={imageClasses}
      style={{
        width: width || 'auto',
        height: height || 'auto'
      }}
      loading="lazy"
    />
  );

  const content = (
    <div className={getAlignClass(align)}>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {imageElement}
        </a>
      ) : (
        imageElement
      )}
      {caption && (
        <p className="text-sm text-muted-foreground mt-2 italic">
          {caption}
        </p>
      )}
    </div>
  );

  return content;
};

ImageBlock.defaultProps = {
  src: 'https://via.placeholder.com/400x300?text=Imagem',
  alt: 'Imagem',
  width: 'auto',
  height: 'auto',
  align: 'center',
  rounded: true,
  shadow: false,
  link: '',
  caption: ''
} as ImageBlockProps;

export const imageBlockConfig: ComponentConfig<ImageBlockProps> = {
  fields: {
    src: {
      type: 'text',
      label: 'URL da Imagem',
    },
    alt: {
      type: 'text',
      label: 'Texto Alternativo',
    },
    width: {
      type: 'text',
      label: 'Largura (CSS)',
    },
    height: {
      type: 'text',
      label: 'Altura (CSS)',
    },
    align: {
      type: 'radio',
      label: 'Alinhamento',
      options: [
        { value: 'left', label: 'Esquerda' },
        { value: 'center', label: 'Centro' },
        { value: 'right', label: 'Direita' },
      ],
    },
    rounded: {
      type: 'radio',
      label: 'Bordas Arredondadas',
      options: [
        { value: true, label: 'Sim' },
        { value: false, label: 'Não' },
      ],
    },
    shadow: {
      type: 'radio',
      label: 'Sombra',
      options: [
        { value: true, label: 'Sim' },
        { value: false, label: 'Não' },
      ],
    },
    link: {
      type: 'text',
      label: 'Link (opcional)',
    },
    caption: {
      type: 'text',
      label: 'Legenda (opcional)',
    },
  },
  defaultProps: {
    src: 'https://via.placeholder.com/400x300?text=Imagem',
    alt: 'Imagem',
    width: 'auto',
    height: 'auto',
    align: 'center',
    rounded: true,
    shadow: false,
    link: '',
    caption: ''
  },
  render: ({ src, alt, width, height, align, rounded, shadow, link, caption }) => (
    <ImageBlock 
      src={src} 
      alt={alt} 
      width={width}
      height={height}
      align={align}
      rounded={rounded}
      shadow={shadow}
      link={link}
      caption={caption}
    />
  ),
};