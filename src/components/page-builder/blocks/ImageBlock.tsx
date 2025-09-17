import React from 'react';
import { ComponentConfig } from '@measured/puck';

export interface ImageBlockProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  align: 'left' | 'center' | 'right';
  rounded: boolean;
  shadow: boolean;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  src,
  alt,
  width,
  height,
  align,
  rounded,
  shadow
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <div className={`mb-4 ${alignClasses[align]}`}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`
          inline-block max-w-full h-auto
          ${rounded ? 'rounded-lg' : ''}
          ${shadow ? 'shadow-lg' : ''}
        `}
      />
    </div>
  );
};

export const ImageBlockConfig: ComponentConfig<ImageBlockProps> = {
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
      type: 'number',
      label: 'Largura (opcional)',
    },
    height: {
      type: 'number',
      label: 'Altura (opcional)',
    },
    align: {
      type: 'radio',
      label: 'Alinhamento',
      options: [
        { label: 'Esquerda', value: 'left' },
        { label: 'Centro', value: 'center' },
        { label: 'Direita', value: 'right' },
      ],
    },
    rounded: {
      type: 'radio',
      label: 'Bordas Arredondadas',
      options: [
        { label: 'Não', value: false },
        { label: 'Sim', value: true },
      ],
    },
    shadow: {
      type: 'radio',
      label: 'Sombra',
      options: [
        { label: 'Não', value: false },
        { label: 'Sim', value: true },
      ],
    },
  },
  defaultProps: {
    src: 'https://via.placeholder.com/600x400',
    alt: 'Imagem ilustrativa',
    align: 'center',
    rounded: true,
    shadow: false,
  },
  label: 'Imagem',
};

ImageBlock.puckConfig = ImageBlockConfig;