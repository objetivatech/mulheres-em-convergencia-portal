import React from 'react';
import { ComponentConfig } from '@measured/puck';
import { Button } from '@/components/ui/button';

export interface ButtonBlockProps {
  text: string;
  link: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size: 'default' | 'sm' | 'lg' | 'icon';
  align: 'left' | 'center' | 'right';
  fullWidth: boolean;
}

export const ButtonBlock: React.FC<ButtonBlockProps> = ({
  text,
  link,
  variant,
  size,
  align,
  fullWidth
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <div className={`mb-4 ${alignClasses[align]}`}>
      <Button
        variant={variant}
        size={size}
        className={fullWidth ? 'w-full' : ''}
        asChild
      >
        <a href={link}>
          {text}
        </a>
      </Button>
    </div>
  );
};

export const ButtonBlockConfig: ComponentConfig<ButtonBlockProps> = {
  fields: {
    text: {
      type: 'text',
      label: 'Texto do Botão',
    },
    link: {
      type: 'text',
      label: 'Link',
    },
    variant: {
      type: 'select',
      label: 'Estilo',
      options: [
        { label: 'Padrão', value: 'default' },
        { label: 'Destrutivo', value: 'destructive' },
        { label: 'Contorno', value: 'outline' },
        { label: 'Secundário', value: 'secondary' },
        { label: 'Fantasma', value: 'ghost' },
        { label: 'Link', value: 'link' },
      ],
    },
    size: {
      type: 'radio',
      label: 'Tamanho',
      options: [
        { label: 'Pequeno', value: 'sm' },
        { label: 'Padrão', value: 'default' },
        { label: 'Grande', value: 'lg' },
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
    fullWidth: {
      type: 'radio',
      label: 'Largura Total',
      options: [
        { label: 'Não', value: false },
        { label: 'Sim', value: true },
      ],
    },
  },
  defaultProps: {
    text: 'Clique Aqui',
    link: '#',
    variant: 'default',
    size: 'default',
    align: 'left',
    fullWidth: false,
  },
  label: 'Botão',
};

ButtonBlock.puckConfig = ButtonBlockConfig;