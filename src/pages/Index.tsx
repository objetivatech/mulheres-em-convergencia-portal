import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import ValueProposition from "@/components/home/ValueProposition";
import EventsAndLPsSlider from "@/components/home/EventsAndLPsSlider";
import AcademyShowcase from "@/components/home/AcademyShowcase";
import PlansPreview from "@/components/home/PlansPreview";
import BusinessShowcase from "@/components/home/BusinessShowcase";
import SocialProof from "@/components/home/SocialProof";
import { PartnersCarousel } from "@/components/partners/PartnersCarousel";
import FeaturedPosts from "@/components/home/FeaturedPosts";
import AmbassadorsShowcase from "@/components/home/AmbassadorsShowcase";
import FinalCTA from "@/components/home/FinalCTA";
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
          <meta name="description" content="Portal de conexão entre mulheres empreendedoras. Planos de associação, MeC Academy, diretório de negócios e eventos exclusivos." />
          <link rel="canonical" href={PRODUCTION_DOMAIN} />
          <meta property="og:title" content={pageContent.title} />
          <meta property="og:description" content="Rede de mulheres empreendedoras com planos de associação, cursos e diretório de negócios" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={PRODUCTION_DOMAIN} />
        </Helmet>
        <PageRenderer data={pageContent.content} />
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Mulheres em Convergência | Rede de Empreendedorismo Feminino, Cursos e Associação</title>
        <meta name="description" content="Conecte-se à melhor rede de mulheres empreendedoras. Planos de associação, MeC Academy com cursos exclusivos, diretório de negócios e eventos. Associe-se!" />
        <link rel="canonical" href={PRODUCTION_DOMAIN} />
        <meta property="og:title" content="Mulheres em Convergência | Rede, Cursos e Associação" />
        <meta property="og:description" content="Planos de associação, MeC Academy, diretório de negócios e eventos para mulheres empreendedoras" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PRODUCTION_DOMAIN} />
      </Helmet>

      <Hero />
      <ValueProposition />

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

      <EventsAndLPsSlider />
      <AcademyShowcase />
      <PlansPreview />

      <SocialProof />

      <PartnersCarousel
        title="Quem está conosco?"
        subtitle="Empresas que acreditam no empreendedorismo feminino e no impacto social"
      />

      <FeaturedPosts />
      <FinalCTA />
    </Layout>
  );
};

export default Index;
