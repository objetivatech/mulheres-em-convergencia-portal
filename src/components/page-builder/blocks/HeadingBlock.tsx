import React from 'react';
import { ComponentConfig } from '@measured/puck';

export interface HeadingBlockProps {
  text: string;
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  align: 'left' | 'center' | 'right';
  color: 'default' | 'primary' | 'secondary';
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
  text,
  level,
  align,
  color
}) => {
  const Component = level;
  
  const colorClasses = {
    default: 'text-foreground',
    primary: 'text-brand-primary',
    secondary: 'text-brand-secondary'
  };

  const levelClasses = {
    h1: 'text-4xl md:text-5xl font-bold',
    h2: 'text-3xl md:text-4xl font-bold',
    h3: 'text-2xl md:text-3xl font-semibold',
    h4: 'text-xl md:text-2xl font-semibold',
    h5: 'text-lg md:text-xl font-semibold',
    h6: 'text-base md:text-lg font-semibold'
  };

  return (
    <Component
      className={`
        ${levelClasses[level]} 
        ${colorClasses[color]} 
        text-${align}
        mb-4
      `}
    >
      {text}
    </Component>
  );
};

export const HeadingBlockConfig: ComponentConfig<HeadingBlockProps> = {
  fields: {
    text: {
      type: 'text',
      label: 'Texto do Título',
    },
    level: {
      type: 'select',
      label: 'Nível do Título',
      options: [
        { label: 'H1', value: 'h1' },
        { label: 'H2', value: 'h2' },
        { label: 'H3', value: 'h3' },
        { label: 'H4', value: 'h4' },
        { label: 'H5', value: 'h5' },
        { label: 'H6', value: 'h6' },
      ],
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
    color: {
      type: 'radio',
      label: 'Cor',
      options: [
        { label: 'Padrão', value: 'default' },
        { label: 'Primária', value: 'primary' },
        { label: 'Secundária', value: 'secondary' },
      ],
    },
  },
  defaultProps: {
    text: 'Título da Seção',
    level: 'h2',
    align: 'left',
    color: 'default',
  },
  label: 'Título',
};

// Export the configured component
HeadingBlock.puckConfig = HeadingBlockConfig;