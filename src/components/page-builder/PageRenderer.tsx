import React from 'react';
import { Render } from '@measured/puck';
import { headingBlockConfig } from './blocks/HeadingBlock';
import { textBlockConfig } from './blocks/TextBlock';
import { heroBlockConfig } from './blocks/HeroBlock';
import { buttonBlockConfig } from './blocks/ButtonBlock';
import { imageBlockConfig } from './blocks/ImageBlock';
import { cardGridBlockConfig } from './blocks/CardGridBlock';

const config = {
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

interface PageRendererProps {
  data: any;
}

export const PageRenderer: React.FC<PageRendererProps> = ({ data }) => {
  return <Render config={config} data={data} />;
};