import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from "@/components/layout/Layout";
import { Timeline } from '@/components/timeline/Timeline';
import { PartnersCarousel } from "@/components/partners/PartnersCarousel";
import { CheckCircle, Users, Target, Heart } from "lucide-react";
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { usePageBuilder } from '@/hooks/usePageBuilder';
import { PageRenderer } from '@/components/page-builder/PageRenderer';

const Sobre = () => {
  const { pageContent, loading } = usePageBuilder('sobre');

  // Se existe conteúdo do Page Builder publicado, usa ele
  if (pageContent && !loading) {
    return (
      <Layout>
        <Helmet>
          <title>{pageContent.title} | Mulheres em Convergência</title>
          <meta name="description" content="Conheça nossa missão de empoderar mulheres empreendedoras através da educação, comunidade e oportunidades de crescimento." />
          <link rel="canonical" href={`${PRODUCTION_DOMAIN}/sobre`} />
        </Helmet>
        <PageRenderer data={pageContent.content} />
      </Layout>
    );
  }

  // Senão, mostra a página estática original
  return (
    <>
      <Helmet>
        <title>Sobre Nós - Mulheres em Convergência</title>
        <meta name="description" content="Conheça nossa missão de empoderar mulheres empreendedoras através da educação, comunidade e oportunidades de crescimento." />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/sobre`} />
      </Helmet>
      
      <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-tertiary/20 via-background to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Nossa <span className="text-primary">História</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Conheça a jornada do Mulheres em Convergência e como estamos 
              transformando vidas através do empreendedorismo feminino.
            </p>
          </div>
        </div>
      </section>

      {/* História */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                O <strong>Mulheres em Convergência</strong> nasceu da percepção de que 
                mulheres empreendedoras precisam de mais do que apenas conhecimento técnico 
                para prosperar em seus negócios. Elas precisam de uma rede de apoio, 
                de conexões significativas e de um espaço seguro para crescer.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-brand-secondary">Conectar</h3>
                  <p className="text-muted-foreground">
                    Criamos pontes entre mulheres empreendedoras, facilitando 
                    networking e parcerias estratégicas.
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-brand-secondary">Educar</h3>
                  <p className="text-muted-foreground">
                    Oferecemos conteúdo de qualidade, workshops e mentorias 
                    para desenvolver habilidades empreendedoras.
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-brand-secondary">Impulsionar</h3>
                  <p className="text-muted-foreground">
                    Apoiamos o crescimento dos negócios através de 
                    ferramentas, recursos e oportunidades únicas.
                  </p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Nosso projeto tem como base a crença de que quando uma mulher prospera, 
                toda a comunidade se beneficia. Por isso, focamos não apenas no sucesso 
                individual, mas no <strong>impacto coletivo</strong> que essas 
                empreendedoras podem gerar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Interativa */}
      <Timeline />

      {/* Valores */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-brand-secondary mb-8">
              Nossos Valores
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">Sororidade</h3>
                <p className="text-muted-foreground">
                  Acreditamos na força da união feminina e no apoio mútuo 
                  como pilares fundamentais para o crescimento coletivo.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">Empoderamento</h3>
                <p className="text-muted-foreground">
                  Fornecemos ferramentas e conhecimento para que cada mulher 
                  possa tomar as rédeas de sua vida profissional e pessoal.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">Inovação</h3>
                <p className="text-muted-foreground">
                  Buscamos constantemente novas formas de conectar, educar 
                  e impulsionar mulheres empreendedoras.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">Impacto Social</h3>
                <p className="text-muted-foreground">
                  Nosso objetivo vai além do sucesso individual - 
                  buscamos transformar comunidades inteiras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parceiros e Apoiadores */}
      <PartnersCarousel 
        title="Parceiros e Apoiadores"
        subtitle="Conheça quem caminha conosco nessa jornada"
        className="bg-tertiary/10"
      />
      </Layout>
    </>
  );
};

export default Sobre;