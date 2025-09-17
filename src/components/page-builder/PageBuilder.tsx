import React from 'react';
import { Puck, Config } from '@measured/puck';
import '@measured/puck/puck.css';

// Block configurations
import { headingBlockConfig } from './blocks/HeadingBlock';
import { textBlockConfig } from './blocks/TextBlock';
import { heroBlockConfig } from './blocks/HeroBlock';
import { buttonBlockConfig } from './blocks/ButtonBlock';
import { imageBlockConfig } from './blocks/ImageBlock';
import { cardGridBlockConfig } from './blocks/CardGridBlock';

const config: Config = {
  components: {
    HeadingBlock: headingBlockConfig,
    TextBlock: textBlockConfig,
    HeroBlock: heroBlockConfig,
    ButtonBlock: buttonBlockConfig,
    ImageBlock: imageBlockConfig,
    CardGridBlock: cardGridBlockConfig,
  },
  categories: {
    layout: {
      components: ['HeroBlock', 'CardGridBlock'],
    },
    typography: {
      components: ['HeadingBlock', 'TextBlock'],
    },
    interactive: {
      components: ['ButtonBlock'],
    },
    media: {
      components: ['ImageBlock'],
    },
  },
};

interface PageBuilderProps {
  data: any;
  onPublish: (data: any) => void;
  mode?: 'edit' | 'preview';
}

export const PageBuilder: React.FC<PageBuilderProps> = ({
  data,
  onPublish,
  mode = 'edit'
}) => {
  return (
    <div className="page-builder-container">
      <Puck
        config={config}
        data={data}
        onPublish={onPublish}
        headerTitle="Editor de Páginas"
        headerPath="Mulheres em Convergência"
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .page-builder-container {
          height: 100vh;
          width: 100%;
        }
        
        .Puck {
          --puck-color-primary: hsl(var(--primary));
          --puck-color-primary-light: hsl(var(--primary) / 0.1);
          --puck-color-background: hsl(var(--background));
          --puck-color-foreground: hsl(var(--foreground));
          --puck-color-muted: hsl(var(--muted));
          --puck-color-border: hsl(var(--border));
        }
        
        .PuckPreview {
          font-family: 'Montserrat', system-ui, sans-serif;
        }
        
        .PuckPreview h1,
        .PuckPreview h2,
        .PuckPreview h3,
        .PuckPreview h4,
        .PuckPreview h5,
        .PuckPreview h6 {
          font-family: 'Nexa Light', system-ui, sans-serif;
        }
      `}} />
    </div>
  );
};