import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const QuemEElisangelaAranda = () => {
  return (
    <>
      <Helmet>
        <title>Quem é Elisângela Aranda | Mulheres em Convergência</title>
        <meta name="description" content="Conheça Elisângela Martins Aranda: empreendedora social, educadora e fundadora do Mulheres em Convergência. Uma trajetória de impacto e transformação." />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/quem-e-elisangela-aranda`} />
        <meta property="og:title" content="Quem é Elisângela Aranda | Mulheres em Convergência" />
        <meta property="og:description" content="Conheça a trajetória de Elisângela Martins Aranda, fundadora do Mulheres em Convergência." />
        <meta property="og:image" content="/assets/elisangela/IMG_20251219_120518.jpg" />
      </Helmet>

      <Layout>
        {/* Hero */}
        <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img
            src="/assets/elisangela/IMG_20251219_120518.jpg"
            alt="Elisângela Aranda"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="container mx-auto">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
                Elisângela <span className="text-primary">Aranda</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl">
                Empreendedora social, educadora e fundadora do Mulheres em Convergência
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <article className="py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
              Sou Elisângela Martins Aranda. Mãe de duas, empreendedora social, educadora e uma mulher 
              movida por um otimismo teimoso e por uma resiliência construída na prática da vida.
            </p>

            <div className="md:float-right md:ml-8 mb-6 md:w-2/5">
              <img
                src="/assets/elisangela/IMG_20200510_114436.jpg"
                alt="Elisângela em atividade comunitária"
                className="w-full rounded-xl shadow-lg"
              />
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Minha história profissional começa cedo. Aos 14 anos, iniciei minha trajetória na construção civil, 
              um ambiente majoritariamente masculino, onde aprendi disciplina, responsabilidade, organização e, 
              sobretudo, a importância do trabalho bem feito. Ao longo dos anos, atuei em áreas operacionais, 
              técnicas e administrativas, acumulando uma visão prática e realista sobre processos, gestão e pessoas. 
              Essa vivência moldou meu olhar para os negócios: pé no chão, foco em soluções e respeito pela 
              trajetória de cada pessoa.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Mas foi em 2017 que algo mudou profundamente. Senti que precisava fazer uma transição — não apenas 
              de carreira, mas de propósito. Passei a atuar como multiplicadora e facilitadora de conteúdos para 
              mulheres, especialmente aquelas que empreendem por necessidade, que carregam a responsabilidade do 
              sustento familiar e que raramente tiveram acesso à educação empreendedora. Ali, me reconheci. 
              Ali, encontrei sentido.
            </p>

            <div className="clear-both" />

            <div className="md:float-left md:mr-8 mb-6 md:w-2/5">
              <img
                src="/assets/elisangela/IMG_20241109_075240.jpg"
                alt="Elisângela em evento"
                className="w-full rounded-xl shadow-lg"
              />
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Desde então, venho unindo minha experiência prática com estudos em gestão de negócios, planejamento 
              estratégico, marketing e liderança, oferecendo mentorias, formações, oficinas e consultorias, tanto 
              de forma remunerada quanto voluntária. Atuei e sigo atuando em programas e iniciativas de impacto 
              social, como a Rede Mulher Empreendedora e a Aliança Empreendedora, além de projetos executados em 
              parceria com o IF Alvorada.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Também tive uma experiência marcante na Rádio Comunitária Acácia FM 87.9, onde, entre 2014 e 2019, 
              apresentei e produzi programas voltados à comunidade, ampliando vozes e fortalecendo narrativas locais.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Sou Tecnóloga em Processos Gerenciais, com formação técnica em Edificações, e atuo há mais de cinco 
              anos diretamente com empreendedorismo popular, lideranças femininas e desenvolvimento de pequenos 
              negócios. Minha atuação é atravessada pelo terceiro setor, pelo voluntariado e pela construção de 
              redes de apoio comunitário, porque acredito que ninguém cresce sozinho — e que o acesso ao conhecimento 
              transforma realidades.
            </p>

            <div className="clear-both" />

            <div className="md:float-right md:ml-8 mb-6 md:w-2/5">
              <img
                src="/assets/elisangela/IMG_20241218_192057.jpg"
                alt="Elisângela em palestra"
                className="w-full rounded-xl shadow-lg"
              />
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Ao longo dessa caminhada, idealizei e conduzi projetos como Motiva Artesão e Construindo Trajetórias, 
              voltados ao empreendedorismo colaborativo e feminino em Alvorada (RS). Em 2023, atuei como diretora 
              social da Associação Arecuja, reforçando meu compromisso com impacto social estruturado e contínuo.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Sou fundadora da <strong>A Confraria Networking</strong>, um espaço que nasce com um princípio claro: 
              educação empreendedora como instrumento de ascensão social e desenvolvimento pessoal. Na Confraria, 
              não buscamos apenas clientes — buscamos parceiras. Mulheres que desejam crescer juntas, criar soluções 
              personalizadas e fortalecer seus negócios sem abrir mão da sua essência.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Desse movimento nasceu também o <strong>Mulheres em Convergência</strong> — um programa educativo voltado 
              especialmente para mulheres chefes de domicílio, que une capacitação em negócios, impacto comunitário, 
              pertencimento e rede. Além disso, idealizei e organizo eventos como o <strong>Happy Hour Conecta</strong>, 
              encontros de networking que promovem conexões reais, trocas honestas e oportunidades concretas entre 
              mulheres empreendedoras.
            </p>

            <div className="clear-both" />

            <blockquote className="border-l-4 border-primary pl-6 py-4 my-10 bg-primary/5 rounded-r-lg">
              <p className="text-lg md:text-xl font-medium text-foreground italic">
                "Um ambiente de networking onde o feminino pode se manifestar de forma livre é radicalmente transformador."
              </p>
            </blockquote>

            <div className="md:float-left md:mr-8 mb-6 md:w-2/5">
              <img
                src="/assets/elisangela/IMG_20250816_121548.jpg"
                alt="Elisângela com grupo de empreendedoras"
                className="w-full rounded-xl shadow-lg"
              />
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Meu propósito de vida é despertar a essência das empreendedoras, fortalecer o potencial que cada 
              mulher já carrega e oferecer ferramentas práticas para que elas criem, sustentem e expandam seus 
              negócios com autonomia, consciência e dignidade. Trabalho para que mulheres deixem de apenas 
              "tentar sobreviver" empreendendo e passem a construir trajetórias sólidas, possíveis e prósperas.
            </p>

            <div className="clear-both" />

            {/* Closing */}
            <div className="mt-16 text-center py-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-tertiary/5 rounded-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Sou artesã de coração, educadora por vocação e empreendedora por convicção.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
                Acredito na educação como ponte, na coletividade como força e no empreendedorismo feminino 
                como motor de transformação social.
              </p>
              <p className="text-muted-foreground italic">
                Essa não é apenas a minha biografia. É a história de um propósito que segue em movimento.
              </p>
            </div>
          </div>
        </article>
      </Layout>
    </>
  );
};

export default QuemEElisangelaAranda;
