import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import EventsAndLPsSlider from "@/components/home/EventsAndLPsSlider";
import FeaturedPosts from "@/components/home/FeaturedPosts";
import BusinessShowcase from "@/components/home/BusinessShowcase";
import { PartnersCarousel } from "@/components/partners/PartnersCarousel";
import { usePageBuilder } from '@/hooks/usePageBuilder';
import { PageRenderer } from '@/components/page-builder/PageRenderer';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const Index = () => {
  const { pageContent, loading } = usePageBuilder('home');

  // Se existe conteúdo do Page Builder publicado, usa ele
  if (pageContent && !loading) {
    return (
      <Layout>
        <Helmet>
          <title>{pageContent.title} | Mulheres em Convergência</title>
          <meta name="description" content="Portal de conexão entre mulheres empreendedoras. Encontre negócios liderados por mulheres, networking, cursos e oportunidades de crescimento." />
          <link rel="canonical" href={PRODUCTION_DOMAIN} />
          <meta property="og:title" content={pageContent.title} />
          <meta property="og:description" content="Portal de conexão entre mulheres empreendedoras" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={PRODUCTION_DOMAIN} />
        </Helmet>
        <PageRenderer data={pageContent.content} />
      </Layout>
    );
  }

  // Senão, mostra a página estática original
  return (
    <Layout>
        <Helmet>
          <title>Mulheres em Convergência | Portal de Empreendedorismo Feminino</title>
          <meta name="description" content="Portal de conexão entre mulheres empreendedoras. Encontre negócios liderados por mulheres, networking, cursos e oportunidades de crescimento." />
          <link rel="canonical" href={PRODUCTION_DOMAIN} />
          <meta property="og:title" content="Mulheres em Convergência" />
          <meta property="og:description" content="Portal de conexão entre mulheres empreendedoras" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={PRODUCTION_DOMAIN} />
        </Helmet>
      
      <Hero />
      
      {/* Slider de Eventos e LPs - Logo após o Hero */}
      <EventsAndLPsSlider />
      
      <BusinessShowcase
        title="Empreendedoras Destaque"
        subtitle="Conheça as empreendedoras dos planos Intermediário e Impulso"
        featured={true}
        className="bg-tertiary/10"
      />
      
      <BusinessShowcase
        title="Nossos Negócios"
        subtitle="Descubra a diversidade de empreendimentos em nossa rede"
        featured={false}
      />
      
      <PartnersCarousel 
        title="Quem está conosco?"
        subtitle="Empresas que acreditam no empreendedorismo feminino e no impacto social"
      />
      
      <FeaturedPosts />
    </Layout>
  );
};

export default Index;