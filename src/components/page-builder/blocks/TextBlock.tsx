import React from 'react';
import { ComponentConfig } from '@measured/puck';

export interface TextBlockProps {
  text: string;
  align: 'left' | 'center' | 'right' | 'justify';
  size: 'sm' | 'base' | 'lg' | 'xl';
  color: 'default' | 'muted' | 'primary';
}

export const TextBlock: React.FC<TextBlockProps> = ({
  text,
  align,
  size,
  color
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const colorClasses = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    primary: 'text-brand-primary'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        text-${align}
        leading-relaxed
        mb-4
      `}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};

export const TextBlockConfig: ComponentConfig<TextBlockProps> = {
  fields: {
    text: {
      type: 'textarea',
      label: 'Texto',
    },
    align: {
      type: 'radio',
      label: 'Alinhamento',
      options: [
        { label: 'Esquerda', value: 'left' },
        { label: 'Centro', value: 'center' },
        { label: 'Direita', value: 'right' },
        { label: 'Justificado', value: 'justify' },
      ],
    },
    size: {
      type: 'radio',
      label: 'Tamanho',
      options: [
        { label: 'Pequeno', value: 'sm' },
        { label: 'Normal', value: 'base' },
        { label: 'Grande', value: 'lg' },
        { label: 'Extra Grande', value: 'xl' },
      ],
    },
    color: {
      type: 'radio',
      label: 'Cor',
      options: [
        { label: 'Padrão', value: 'default' },
        { label: 'Esmaecido', value: 'muted' },
        { label: 'Primária', value: 'primary' },
      ],
    },
  },
  defaultProps: {
    text: 'Digite aqui o texto do parágrafo. Você pode usar HTML básico para formatação.',
    align: 'left',
    size: 'base',
    color: 'default',
  },
  label: 'Texto',
};

TextBlock.puckConfig = TextBlockConfig;