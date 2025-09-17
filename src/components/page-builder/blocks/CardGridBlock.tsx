import React from 'react';
import { ComponentConfig } from '@measured/puck';

export interface Card {
  title: string;
  description: string;
  image: string;
  link: string;
}

export interface CardGridBlockProps {
  title: string;
  subtitle: string;
  cards: Card[];
  columns: 1 | 2 | 3 | 4;
  cardStyle: 'default' | 'minimal' | 'bordered';
}

export const CardGridBlock: React.FC<CardGridBlockProps> = ({
  title,
  subtitle,
  cards,
  columns,
  cardStyle
}) => {
  const getColumnsClass = (columns: number) => {
    const classes = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    };
    return classes[columns as keyof typeof classes] || classes[3];
  };

  const getCardClass = (style: string) => {
    const classes = {
      default: 'bg-card text-card-foreground shadow-sm rounded-lg border p-6',
      minimal: 'p-6',
      bordered: 'border-2 border-border rounded-lg p-6 hover:border-primary/50 transition-colors'
    };
    return classes[style as keyof typeof classes] || classes.default;
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-nexa text-primary mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className={`grid ${getColumnsClass(columns)} gap-6`}>
          {cards.map((card, index) => (
            <div key={index} className={`group ${getCardClass(cardStyle)}`}>
              {card.image && (
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
              )}
              
              <h3 className="text-xl font-semibold font-nexa mb-3 group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              
              {card.description && (
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {card.description}
                </p>
              )}
              
              {card.link && (
                <a
                  href={card.link}
                  className="inline-flex items-center text-primary font-medium hover:underline"
                >
                  Saiba mais
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

CardGridBlock.defaultProps = {
  title: 'Nossos Serviços',
  subtitle: 'Descubra como podemos ajudar você a crescer',
  cards: [
    {
      title: 'Consultoria',
      description: 'Orientação especializada para o crescimento do seu negócio.',
      image: 'https://via.placeholder.com/400x300?text=Consultoria',
      link: '#'
    },
    {
      title: 'Networking',
      description: 'Conecte-se com outras empreendedoras e expanda sua rede.',
      image: 'https://via.placeholder.com/400x300?text=Networking',
      link: '#'
    },
    {
      title: 'Capacitação',
      description: 'Cursos e workshops para desenvolver suas habilidades.',
      image: 'https://via.placeholder.com/400x300?text=Capacitação',
      link: '#'
    }
  ],
  columns: 3,
  cardStyle: 'default'
} as CardGridBlockProps;

export const cardGridBlockConfig: ComponentConfig<CardGridBlockProps> = {
  fields: {
    title: {
      type: 'text',
      label: 'Título da Seção',
    },
    subtitle: {
      type: 'textarea',
      label: 'Subtítulo',
    },
    cards: {
      type: 'array',
      label: 'Cards',
      getItemSummary: (item) => item.title || 'Card sem título',
      arrayFields: {
        title: {
          type: 'text',
          label: 'Título do Card',
        },
        description: {
          type: 'textarea',
          label: 'Descrição',
        },
        image: {
          type: 'text',
          label: 'URL da Imagem',
        },
        link: {
          type: 'text',
          label: 'Link',
        },
      },
    },
    columns: {
      type: 'select',
      label: 'Colunas',
      options: [
        { value: 1, label: '1 Coluna' },
        { value: 2, label: '2 Colunas' },
        { value: 3, label: '3 Colunas' },
        { value: 4, label: '4 Colunas' },
      ],
    },
    cardStyle: {
      type: 'select',
      label: 'Estilo dos Cards',
      options: [
        { value: 'default', label: 'Padrão' },
        { value: 'minimal', label: 'Minimalista' },
        { value: 'bordered', label: 'Com Borda' },
      ],
    },
  },
  defaultProps: {
    title: 'Nossos Serviços',
    subtitle: 'Descubra como podemos ajudar você a crescer',
    cards: [
      {
        title: 'Consultoria',
        description: 'Orientação especializada para o crescimento do seu negócio.',
        image: 'https://via.placeholder.com/400x300?text=Consultoria',
        link: '#'
      },
      {
        title: 'Networking',
        description: 'Conecte-se com outras empreendedoras e expanda sua rede.',
        image: 'https://via.placeholder.com/400x300?text=Networking',
        link: '#'
      },
      {
        title: 'Capacitação',
        description: 'Cursos e workshops para desenvolver suas habilidades.',
        image: 'https://via.placeholder.com/400x300?text=Capacitação',
        link: '#'
      }
    ],
    columns: 3,
    cardStyle: 'default'
  },
  render: ({ title, subtitle, cards, columns, cardStyle }) => (
    <CardGridBlock 
      title={title} 
      subtitle={subtitle} 
      cards={cards}
      columns={columns}
      cardStyle={cardStyle}
    />
  ),
};