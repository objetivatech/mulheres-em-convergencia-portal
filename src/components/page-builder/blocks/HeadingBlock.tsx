import React from 'react';
import { ComponentConfig } from '@measured/puck';

export interface HeadingBlockProps {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  align: 'left' | 'center' | 'right';
  color: string;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
  text,
  level,
  align,
  color
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const getHeadingClass = (level: number) => {
    const classes = {
      1: 'text-4xl md:text-5xl font-bold',
      2: 'text-3xl md:text-4xl font-bold',
      3: 'text-2xl md:text-3xl font-semibold',
      4: 'text-xl md:text-2xl font-semibold',
      5: 'text-lg md:text-xl font-medium',
      6: 'text-base md:text-lg font-medium'
    };
    return classes[level as keyof typeof classes] || classes[1];
  };

  return (
    <Tag
      className={`font-nexa ${getHeadingClass(level)} text-${align}`}
      style={{ color: color }}
    >
      {text}
    </Tag>
  );
};

HeadingBlock.defaultProps = {
  text: 'Título da Seção',
  level: 2,
  align: 'left',
  color: 'hsl(var(--primary))'
} as HeadingBlockProps;

export const headingBlockConfig: ComponentConfig<HeadingBlockProps> = {
  fields: {
    text: {
      type: 'text',
      label: 'Texto',
    },
    level: {
      type: 'select',
      label: 'Nível',
      options: [
        { value: 1, label: 'H1' },
        { value: 2, label: 'H2' },
        { value: 3, label: 'H3' },
        { value: 4, label: 'H4' },
        { value: 5, label: 'H5' },
        { value: 6, label: 'H6' },
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
    color: {
      type: 'text',
      label: 'Cor (CSS)',
    },
  },
  defaultProps: {
    text: 'Título da Seção',
    level: 2,
    align: 'left',
    color: 'hsl(var(--primary))'
  },
  render: ({ text, level, align, color }) => (
    <HeadingBlock text={text} level={level} align={align} color={color} />
  ),
};