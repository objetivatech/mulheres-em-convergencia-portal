import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import FeaturedPosts from "@/components/home/FeaturedPosts";
import BusinessShowcase from "@/components/home/BusinessShowcase";
import { usePageBuilder } from '@/hooks/usePageBuilder';
import { PageRenderer } from '@/components/page-builder/PageRenderer';

const Index = () => {
  const { pageContent, loading } = usePageBuilder('home');

  // Se existe conteúdo do Page Builder publicado, usa ele
  if (pageContent && !loading) {
    return (
      <Layout>
        <Helmet>
          <title>{pageContent.title} | Mulheres em Convergência</title>
          <meta name="description" content="Portal de conexão entre mulheres empreendedoras. Encontre negócios liderados por mulheres, networking, cursos e oportunidades de crescimento." />
          <meta name="keywords" content="empreendedorismo feminino, mulheres, negócios, networking, economia criativa" />
          <meta property="og:title" content={pageContent.title} />
          <meta property="og:description" content="Portal de conexão entre mulheres empreendedoras" />
          <meta property="og:type" content="website" />
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
        <meta name="keywords" content="empreendedorismo feminino, mulheres, negócios, networking, economia criativa" />
        <meta property="og:title" content="Mulheres em Convergência" />
        <meta property="og:description" content="Portal de conexão entre mulheres empreendedoras" />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <Hero />
      
      <BusinessShowcase
        title="Empreendedoras Destaque"
        subtitle="Conheça as empreendedoras dos planos intermediário e master"
        featured={true}
        className="bg-tertiary/10"
      />
      
      <BusinessShowcase
        title="Nossos Negócios"
        subtitle="Descubra a diversidade de empreendimentos em nossa rede"
        featured={false}
      />
      
      <FeaturedPosts />
    </Layout>
  );
};

export default Index;
