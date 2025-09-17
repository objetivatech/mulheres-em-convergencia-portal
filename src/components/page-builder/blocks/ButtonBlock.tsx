import React from 'react';
import { ComponentConfig } from '@measured/puck';

export interface ButtonBlockProps {
  text: string;
  link: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  align: 'left' | 'center' | 'right';
  openInNewTab: boolean;
}

export const ButtonBlock: React.FC<ButtonBlockProps> = ({
  text,
  link,
  variant,
  size,
  align,
  openInNewTab
}) => {
  const getVariantClass = (variant: string) => {
    const classes = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground'
    };
    return classes[variant as keyof typeof classes] || classes.primary;
  };

  const getSizeClass = (size: string) => {
    const classes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg'
    };
    return classes[size as keyof typeof classes] || classes.md;
  };

  const getAlignClass = (align: string) => {
    const classes = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    return classes[align as keyof typeof classes] || classes.left;
  };

  return (
    <div className={getAlignClass(align)}>
      <a
        href={link}
        target={openInNewTab ? '_blank' : '_self'}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={`inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background ${getVariantClass(variant)} ${getSizeClass(size)}`}
      >
        {text}
      </a>
    </div>
  );
};

ButtonBlock.defaultProps = {
  text: 'Clique Aqui',
  link: '#',
  variant: 'primary',
  size: 'md',
  align: 'left',
  openInNewTab: false
} as ButtonBlockProps;

export const buttonBlockConfig: ComponentConfig<ButtonBlockProps> = {
  fields: {
    text: {
      type: 'text',
      label: 'Texto do Botão',
    },
    link: {
      type: 'text',
      label: 'URL do Link',
    },
    variant: {
      type: 'select',
      label: 'Estilo',
      options: [
        { value: 'primary', label: 'Primário' },
        { value: 'secondary', label: 'Secundário' },
        { value: 'outline', label: 'Contorno' },
        { value: 'ghost', label: 'Fantasma' },
      ],
    },
    size: {
      type: 'select',
      label: 'Tamanho',
      options: [
        { value: 'sm', label: 'Pequeno' },
        { value: 'md', label: 'Médio' },
        { value: 'lg', label: 'Grande' },
      ],
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
    openInNewTab: {
      type: 'radio',
      label: 'Abrir em Nova Aba',
      options: [
        { value: true, label: 'Sim' },
        { value: false, label: 'Não' },
      ],
    },
  },
  defaultProps: {
    text: 'Clique Aqui',
    link: '#',
    variant: 'primary',
    size: 'md',
    align: 'left',
    openInNewTab: false
  },
  render: ({ text, link, variant, size, align, openInNewTab }) => (
    <ButtonBlock 
      text={text} 
      link={link} 
      variant={variant}
      size={size}
      align={align}
      openInNewTab={openInNewTab}
    />
  ),
};