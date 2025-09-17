import React from 'react';
import { ComponentConfig } from '@measured/puck';

export interface TextBlockProps {
  text: string;
  align: 'left' | 'center' | 'right' | 'justify';
  size: 'sm' | 'base' | 'lg' | 'xl';
  color: string;
  maxWidth: string;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  text,
  align,
  size,
  color,
  maxWidth
}) => {
  const getSizeClass = (size: string) => {
    const classes = {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl'
    };
    return classes[size as keyof typeof classes] || classes.base;
  };

  return (
    <div 
      className={`${getSizeClass(size)} text-${align} leading-relaxed`}
      style={{ 
        color: color,
        maxWidth: maxWidth || 'none'
      }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};

TextBlock.defaultProps = {
  text: '<p>Digite seu texto aqui. Você pode usar <strong>negrito</strong>, <em>itálico</em> e outros elementos HTML.</p>',
  align: 'left',
  size: 'base',
  color: 'hsl(var(--foreground))',
  maxWidth: 'none'
} as TextBlockProps;

export const textBlockConfig: ComponentConfig<TextBlockProps> = {
  fields: {
    text: {
      type: 'textarea',
      label: 'Texto (HTML)',
    },
    align: {
      type: 'radio',
      label: 'Alinhamento',
      options: [
        { value: 'left', label: 'Esquerda' },
        { value: 'center', label: 'Centro' },
        { value: 'right', label: 'Direita' },
        { value: 'justify', label: 'Justificado' },
      ],
    },
    size: {
      type: 'select',
      label: 'Tamanho',
      options: [
        { value: 'sm', label: 'Pequeno' },
        { value: 'base', label: 'Normal' },
        { value: 'lg', label: 'Grande' },
        { value: 'xl', label: 'Extra Grande' },
      ],
    },
    color: {
      type: 'text',
      label: 'Cor (CSS)',
    },
    maxWidth: {
      type: 'text',
      label: 'Largura Máxima (CSS)',
    },
  },
  defaultProps: {
    text: '<p>Digite seu texto aqui. Você pode usar <strong>negrito</strong>, <em>itálico</em> e outros elementos HTML.</p>',
    align: 'left',
    size: 'base',
    color: 'hsl(var(--foreground))',
    maxWidth: 'none'
  },
  render: ({ text, align, size, color, maxWidth }) => (
    <TextBlock text={text} align={align} size={size} color={color} maxWidth={maxWidth} />
  ),
};