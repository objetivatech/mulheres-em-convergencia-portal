import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useGetLandingPageBySlug } from '@/hooks/useLandingPages';
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
  LPTestimonials,
} from '@/components/landing-page';
import NotFound from './NotFound';

const DynamicLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading } = useGetLandingPageBySlug(slug);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!page || !page.content) {
    return <NotFound />;
  }

  const content = page.content;
  const sections = page.sections_enabled || {};
  const isEnabled = (key: string) => sections[key] !== false;

  const scrollToInvestment = () => {
    document.getElementById('investimento')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCtaClick = () => {
    setCheckoutOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{page.seo_title || `${content.product.name} | Mulheres em Convergência`}</title>
        <meta name="description" content={page.seo_description || content.hero.description} />
        <meta property="og:title" content={page.seo_title || content.product.name} />
        <meta property="og:description" content={page.seo_description || content.hero.description} />
        <meta property="og:type" content="product" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://mulheresemconvergencia.com.br/lp/${page.slug}`} />
      </Helmet>

      <Layout>
        {isEnabled('hero') && (
          <LPHero content={content.hero} onCtaClick={handleCtaClick} onScrollClick={scrollToInvestment} />
        )}
        {isEnabled('painPoints') && <LPPainPoints content={content.painPoints} />}
        {isEnabled('method') && <LPMethod content={content.method} />}
        {isEnabled('pillars') && <LPPillars content={content.pillars} />}
        {isEnabled('included') && <LPIncluded content={content.included} />}
        {isEnabled('targetAudience') && <LPTargetAudience content={content.targetAudience} />}
        {isEnabled('transformation') && <LPTransformation content={content.transformation} />}
        {isEnabled('testimonials') && content.testimonials && content.testimonials.testimonials.length > 0 && (
          <LPTestimonials content={content.testimonials} />
        )}
        {isEnabled('eventDetails') && <LPEventDetails content={content.eventDetails} />}
        {isEnabled('investment') && (
          <LPInvestment content={content.investment} product={content.product} onCtaClick={handleCtaClick} />
        )}
        <LPCheckoutForm product={content.product} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
      </Layout>
    </>
  );
};

export default DynamicLandingPage;
