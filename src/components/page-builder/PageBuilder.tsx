import React from 'react';
import { Puck, Config, Data } from '@measured/puck';
import '@measured/puck/dist/index.css';

// Import components for the page builder
import { HeadingBlock } from './blocks/HeadingBlock';
import { TextBlock } from './blocks/TextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { HeroBlock } from './blocks/HeroBlock';
import { CardGridBlock } from './blocks/CardGridBlock';
import { ButtonBlock } from './blocks/ButtonBlock';

// Configure the blocks available in Puck
const config: Config = {
  components: {
    HeadingBlock,
    TextBlock,
    ImageBlock,
    HeroBlock,
    CardGridBlock,
    ButtonBlock,
  },
  categories: {
    'Conteúdo': ['HeadingBlock', 'TextBlock', 'ImageBlock'],
    'Layout': ['HeroBlock', 'CardGridBlock'],
    'Interação': ['ButtonBlock'],
  },
};

interface PageBuilderProps {
  data: Data;
  onPublish: (data: Data) => void;
  onChange?: (data: Data) => void;
}

export const PageBuilder: React.FC<PageBuilderProps> = ({
  data,
  onPublish,
  onChange
}) => {
  return (
    <div className="h-screen">
      <Puck
        config={config}
        data={data}
        onPublish={onPublish}
        onChange={onChange}
        headerTitle="Editor de Páginas - Mulheres em Convergência"
        headerPath="/admin/pages"
      />
    </div>
  );
};

export default PageBuilder;