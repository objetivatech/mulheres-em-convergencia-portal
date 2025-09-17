import React from 'react';
import { ComponentConfig } from '@measured/puck';

export interface HeroBlockProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  buttonLink: string;
  height: 'sm' | 'md' | 'lg' | 'xl';
  overlay: boolean;
}

export const HeroBlock: React.FC<HeroBlockProps> = ({
  title,
  subtitle,
  backgroundImage,
  backgroundColor,
  textColor,
  buttonText,
  buttonLink,
  height,
  overlay
}) => {
  const getHeightClass = (height: string) => {
    const classes = {
      sm: 'h-64',
      md: 'h-80',
      lg: 'h-96',
      xl: 'h-screen'
    };
    return classes[height as keyof typeof classes] || classes.md;
  };

  return (
    <section
      className={`relative flex items-center justify-center ${getHeightClass(height)} overflow-hidden`}
      style={{
        backgroundColor: backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {overlay && backgroundImage && (
        <div className="absolute inset-0 bg-black/40" />
      )}
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 
          className="text-4xl md:text-6xl font-bold font-nexa mb-6"
          style={{ color: textColor }}
        >
          {title}
        </h1>
        
        {subtitle && (
          <p 
            className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
            style={{ color: textColor }}
          >
            {subtitle}
          </p>
        )}
        
        {buttonText && buttonLink && (
          <a
            href={buttonLink}
            className="inline-block px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
};

HeroBlock.defaultProps = {
  title: 'Bem-vindas ao Futuro',
  subtitle: 'Conectando mulheres empreendedoras em todo o Brasil',
  backgroundImage: '',
  backgroundColor: 'hsl(var(--primary))',
  textColor: 'white',
  buttonText: 'Saiba Mais',
  buttonLink: '#',
  height: 'lg',
  overlay: true
} as HeroBlockProps;

export const heroBlockConfig: ComponentConfig<HeroBlockProps> = {
  fields: {
    title: {
      type: 'text',
      label: 'Título',
    },
    subtitle: {
      type: 'textarea',
      label: 'Subtítulo',
    },
    backgroundImage: {
      type: 'text',
      label: 'URL da Imagem de Fundo',
    },
    backgroundColor: {
      type: 'text',
      label: 'Cor de Fundo (CSS)',
    },
    textColor: {
      type: 'text',
      label: 'Cor do Texto (CSS)',
    },
    buttonText: {
      type: 'text',
      label: 'Texto do Botão',
    },
    buttonLink: {
      type: 'text',
      label: 'Link do Botão',
    },
    height: {
      type: 'select',
      label: 'Altura',
      options: [
        { value: 'sm', label: 'Pequena' },
        { value: 'md', label: 'Média' },
        { value: 'lg', label: 'Grande' },
        { value: 'xl', label: 'Tela Cheia' },
      ],
    },
    overlay: {
      type: 'radio',
      label: 'Sobreposição Escura',
      options: [
        { value: true, label: 'Sim' },
        { value: false, label: 'Não' },
      ],
    },
  },
  defaultProps: {
    title: 'Bem-vindas ao Futuro',
    subtitle: 'Conectando mulheres empreendedoras em todo o Brasil',
    backgroundImage: '',
    backgroundColor: 'hsl(var(--primary))',
    textColor: 'white',
    buttonText: 'Saiba Mais',
    buttonLink: '#',
    height: 'lg',
    overlay: true
  },
  render: ({ title, subtitle, backgroundImage, backgroundColor, textColor, buttonText, buttonLink, height, overlay }) => (
    <HeroBlock 
      title={title} 
      subtitle={subtitle} 
      backgroundImage={backgroundImage}
      backgroundColor={backgroundColor}
      textColor={textColor}
      buttonText={buttonText}
      buttonLink={buttonLink}
      height={height}
      overlay={overlay}
    />
  ),
};