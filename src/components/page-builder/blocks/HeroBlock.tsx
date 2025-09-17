import React from 'react';
import { ComponentConfig } from '@measured/puck';
import { Button } from '@/components/ui/button';

export interface HeroBlockProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundColor: 'primary' | 'secondary' | 'gradient' | 'white';
  textColor: 'white' | 'dark';
  buttonText?: string;
  buttonLink?: string;
  height: 'sm' | 'md' | 'lg' | 'xl';
}

export const HeroBlock: React.FC<HeroBlockProps> = ({
  title,
  subtitle,
  backgroundImage,
  backgroundColor,
  textColor,
  buttonText,
  buttonLink,
  height
}) => {
  const heightClasses = {
    sm: 'h-64',
    md: 'h-80', 
    lg: 'h-96',
    xl: 'h-screen'
  };

  const backgroundClasses = {
    primary: 'bg-brand-primary',
    secondary: 'bg-brand-secondary',
    gradient: 'bg-gradient-to-br from-brand-primary to-brand-secondary',
    white: 'bg-white'
  };

  const textColorClasses = {
    white: 'text-white',
    dark: 'text-foreground'
  };

  return (
    <section 
      className={`
        relative flex items-center justify-center
        ${heightClasses[height]}
        ${backgroundClasses[backgroundColor]}
        ${textColorClasses[textColor]}
      `}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/40" />
      )}
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          {title}
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
          {subtitle}
        </p>
        
        {buttonText && buttonLink && (
          <Button
            size="lg"
            className="text-lg px-8 py-3"
            asChild
          >
            <a href={buttonLink}>
              {buttonText}
            </a>
          </Button>
        )}
      </div>
    </section>
  );
};

export const HeroBlockConfig: ComponentConfig<HeroBlockProps> = {
  fields: {
    title: {
      type: 'text',
      label: 'Título Principal',
    },
    subtitle: {
      type: 'textarea',
      label: 'Subtítulo',
    },
    backgroundImage: {
      type: 'text',
      label: 'URL da Imagem de Fundo (opcional)',
    },
    backgroundColor: {
      type: 'radio',
      label: 'Cor de Fundo',
      options: [
        { label: 'Primária', value: 'primary' },
        { label: 'Secundária', value: 'secondary' },
        { label: 'Gradiente', value: 'gradient' },
        { label: 'Branco', value: 'white' },
      ],
    },
    textColor: {
      type: 'radio',
      label: 'Cor do Texto',
      options: [
        { label: 'Branco', value: 'white' },
        { label: 'Escuro', value: 'dark' },
      ],
    },
    buttonText: {
      type: 'text',
      label: 'Texto do Botão (opcional)',
    },
    buttonLink: {
      type: 'text',
      label: 'Link do Botão (opcional)',
    },
    height: {
      type: 'radio',
      label: 'Altura',
      options: [
        { label: 'Pequena', value: 'sm' },
        { label: 'Média', value: 'md' },
        { label: 'Grande', value: 'lg' },
        { label: 'Tela Cheia', value: 'xl' },
      ],
    },
  },
  defaultProps: {
    title: 'Mulheres em Convergência',
    subtitle: 'Conectando mulheres empreendedoras e transformando negócios',
    backgroundColor: 'gradient',
    textColor: 'white',
    height: 'lg',
  },
  label: 'Hero Banner',
};

HeroBlock.puckConfig = HeroBlockConfig;