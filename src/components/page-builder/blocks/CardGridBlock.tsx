import React from 'react';
import { ComponentConfig } from '@measured/puck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface CardItem {
  title: string;
  content: string;
  image?: string;
}

export interface CardGridBlockProps {
  cards: CardItem[];
  columns: 1 | 2 | 3 | 4;
  spacing: 'sm' | 'md' | 'lg';
}

export const CardGridBlock: React.FC<CardGridBlockProps> = ({
  cards,
  columns,
  spacing
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const spacingClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${spacingClasses[spacing]} mb-8`}>
      {cards.map((card, index) => (
        <Card key={index} className="h-fit">
          {card.image && (
            <div className="aspect-video overflow-hidden rounded-t-lg">
              <img 
                src={card.image} 
                alt={card.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-lg">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: card.content }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const CardGridBlockConfig: ComponentConfig<CardGridBlockProps> = {
  fields: {
    cards: {
      type: 'array',
      label: 'Cards',
      arrayFields: {
        title: {
          type: 'text',
          label: 'Título',
        },
        content: {
          type: 'textarea',
          label: 'Conteúdo',
        },
        image: {
          type: 'text',
          label: 'URL da Imagem (opcional)',
        },
      },
      defaultItemProps: {
        title: 'Título do Card',
        content: 'Conteúdo do card. Você pode usar HTML básico.',
      },
    },
    columns: {
      type: 'radio',
      label: 'Colunas',
      options: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
      ],
    },
    spacing: {
      type: 'radio',
      label: 'Espaçamento',
      options: [
        { label: 'Pequeno', value: 'sm' },
        { label: 'Médio', value: 'md' },
        { label: 'Grande', value: 'lg' },
      ],
    },
  },
  defaultProps: {
    cards: [
      {
        title: 'Card 1',
        content: 'Conteúdo do primeiro card.',
      },
      {
        title: 'Card 2', 
        content: 'Conteúdo do segundo card.',
      },
      {
        title: 'Card 3',
        content: 'Conteúdo do terceiro card.',
      },
    ],
    columns: 3,
    spacing: 'md',
  },
  label: 'Grade de Cards',
};

CardGridBlock.puckConfig = CardGridBlockConfig;