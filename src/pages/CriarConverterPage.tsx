import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { criarConverterContent } from '@/data/products/criar-converter';
import {
  LPHero,
  LPPainPoints,
  LPMethod,
  LPPillars,
  LPIncluded,
  LPTargetAudience,
  LPTransformation,
  LPEventDetails,
  LPInvestment,
  LPCheckoutForm,
} from '@/components/landing-page';

const CriarConverterPage = () => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const content = criarConverterContent;

  const scrollToInvestment = () => {
    document.getElementById('investimento')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCtaClick = () => {
    setCheckoutOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{content.product.name} | Mulheres em Convergência</title>
        <meta name="description" content={content.hero.description} />
        <meta property="og:title" content={content.product.name} />
        <meta property="og:description" content={content.hero.description} />
        <meta property="og:type" content="product" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://mulheresemconvergencia.com.br/${content.product.slug}`} />
      </Helmet>

      <Layout>
        <LPHero 
          content={content.hero} 
          onCtaClick={handleCtaClick}
          onScrollClick={scrollToInvestment}
        />
        <LPPainPoints content={content.painPoints} />
        <LPMethod content={content.method} />
        <LPPillars content={content.pillars} />
        <LPIncluded content={content.included} />
        <LPTargetAudience content={content.targetAudience} />
        <LPTransformation content={content.transformation} />
        <LPEventDetails content={content.eventDetails} />
        <LPInvestment 
          content={content.investment} 
          product={content.product}
          onCtaClick={handleCtaClick}
        />

        <LPCheckoutForm 
          product={content.product}
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
        />
      </Layout>
    </>
  );
};

export default CriarConverterPage;
