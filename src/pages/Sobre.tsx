import Layout from "@/components/layout/Layout";
import { CheckCircle, Users, Target, Heart } from "lucide-react";

const Sobre = () => {
  return (
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

      {/* Linha do Tempo - Placeholder */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-brand-secondary text-center mb-12">
              Nossa Jornada
            </h2>
            
            {/* Timeline placeholder - será implementada posteriormente com base no site original */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Início do Projeto
                  </h3>
                  <p className="text-muted-foreground">
                    Identificação da necessidade de criar um espaço dedicado 
                    ao desenvolvimento de mulheres empreendedoras no Brasil.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-brand-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Primeiras Conexões
                  </h3>
                  <p className="text-muted-foreground">
                    Formação da primeira rede de mulheres empreendedoras 
                    e início das atividades de mentoria e networking.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Expansão Digital
                  </h3>
                  <p className="text-muted-foreground">
                    Lançamento da plataforma digital para ampliar o alcance 
                    e conectar mais mulheres em todo o país.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
    </Layout>
  );
};

export default Sobre;