import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
  image: string;
}

const timelineData: TimelineItem[] = [
  {
    id: 'apae-gravatai',
    date: 'Maio 2015',
    title: 'APAE Gravataí',
    description: 'Trabalho voluntário na APAE de Gravataí, aulas semanais de artesanato com as mães das crianças e jovens atendidos na entidade. Começamos a perceber as barreiras e dificuldades enfrentadas pelas mulheres.',
    image: '/assets/timeline/timeline-apae-gravatai.jpg'
  },
  {
    id: 'aulas-artesanato',
    date: 'Setembro 2015',
    title: 'Aulas de Artesanato',
    description: 'Aulas de artesanato para as mulheres da comunidade, Jardim Algarve, em Alvorada parceria com a Rádio Comunitária Acácia FM 87.9.',
    image: '/assets/timeline/timeline-aulas-artesanato.jpg'
  },
  {
    id: 'multifeira',
    date: '2015 - 2017',
    title: 'Multifeira',
    description: 'Em um chamamento nas redes sociais, reunimos aproximadamente 20 moradores entre artesãos e empreendedores da área da alimentação e formamos a Multifeira do Jardim Algarve, fazendo feiras mensais nas praças do bairro.',
    image: '/assets/timeline/timeline-multifeira.jpg'
  },
  {
    id: 'acao-fgtas',
    date: 'Março 2017',
    title: 'Ação FGTAS',
    description: 'Confecção das carteirinhas de artesão pelo FGTAS, realizada na comunidade. Conseguimos em parceria com a SMDE, trazer os examinadores para realizar mais de 40 carteirinhas, para os artesãos da Multifeira Jardim Algarve e outros das comunidades próximas.',
    image: '/assets/timeline/timeline-fgtas.jpg'
  },
  {
    id: 'acao-acessuas',
    date: 'Abril 2018',
    title: 'Ação ACESSUAS - PMA',
    description: 'Parceria com a Secretaria de Assistência Social da Prefeitura de Alvorada, através da diretora do ACESSUAS, Vera Lúcia Alves, aulas sobre letramento digital para artesãs do município.',
    image: '/assets/timeline/timeline-acessuas.jpg'
  },
  {
    id: 'portal-vida',
    date: 'Março - Dezembro 2019',
    title: 'Portal da Vida',
    description: 'Trabalho voluntário no projeto Portal da Vida, da ativista social Karen Monteiro, escuta ativa de mulheres em situação de vulnerabilidade, encontros quinzenais com as atendidas pelo projeto na sede da Rádio Comunitária Acácia FM.',
    image: '/assets/timeline/timeline-portal-vida.jpg'
  },
  {
    id: 'motiva-artesao',
    date: 'Agosto - Outubro 2019',
    title: 'Motiva Artesão - IFRS',
    description: 'Projeto de educação empreendedora, O MOTIVA ARTESÃO, foram 10 aulas sobre empreendedorismo, gestão e planejamento, formamos 20 alunas em parceria com o IFRS Alvorada.',
    image: '/assets/timeline/timeline-motiva-artesao.jpg'
  },
  {
    id: 'ela-pode-palestras',
    date: 'Durante 2019',
    title: 'Ela Pode - Palestras',
    description: 'Trabalho voluntário no projeto Ela Pode, da RME, patrocinado pelo Google, facilitadora de conteúdos sobre empreendedorismo feminino. Feira do Livro, palestra para o grupo Empreendedoras Restinga / Workshop no IFRS Alvorada.',
    image: '/assets/timeline/timeline-ela-pode-1.jpg'
  },
  {
    id: 'ela-pode-senac',
    date: 'Durante 2019',
    title: 'Ela Pode - Workshops SENAC',
    description: 'Trabalho voluntário no projeto Ela Pode, da RME, patrocinado pelo Google, facilitadora de conteúdos sobre empreendedorismo feminino. Workshop para as alunas do SENAC Comunidade/Porto Alegre.',
    image: '/assets/timeline/timeline-ela-pode-2.jpg'
  },
  {
    id: 'ela-pode-comunidades',
    date: 'Durante 2019',
    title: 'Ela Pode - Comunidades',
    description: 'Trabalho voluntário no projeto Ela Pode, da RME, patrocinado pelo Google, facilitadora de conteúdos sobre empreendedorismo feminino. Workshops nas comunidades Vila Elza, Jardim Algarve, Piratini e 11 de Abril em Alvorada.',
    image: '/assets/timeline/timeline-ela-pode-3.jpg'
  },
  {
    id: 'ela-pode-centros',
    date: 'Durante 2019',
    title: 'Ela Pode - Centros Profissionalizantes',
    description: 'Trabalho voluntário no projeto Ela Pode, da RME, patrocinado pelo Google, facilitadora de conteúdos sobre empreendedorismo feminino. Workshops no Centro Profissionalizante Florestan Fernandes em Alvorada e na Kurti Festas em Viamão.',
    image: '/assets/timeline/timeline-ela-pode-4.jpg'
  },
  {
    id: 'coletivo-tpm',
    date: '2019 - 2022',
    title: 'Coletivo TPM',
    description: 'Coletivo TPM – **Todas Podem Mais** – formado a partir do desejo das empreendedoras em continuar formando conexões e aprendendo sobre empreendedorismo feminino; começou no final de 2019, onde conseguimos realizar algumas feiras, durou durante toda pandemia, se mantendo como um grupo de Whatsapp, onde havia troca de informações, indicação de cursos e locais de feiras e eventos. Foi desativado em 2022.',
    image: '/assets/timeline/timeline-coletivo-tpm.jpg'
  },
  {
    id: 'mulheres-proposito',
    date: 'Dezembro 2019',
    title: 'Mulheres com Propósito Pepsico',
    description: 'Mulheres com Propósito da Pepsico e Banco de Alimentos, participamos das atividades em Porto Alegre, contribuindo com palestras e formações sobre empreendedorismo e gestão.',
    image: '/assets/timeline/timeline-mulheres-proposito.jpg'
  },
  {
    id: 'eventos-online-1',
    date: 'Durante 2020',
    title: 'Eventos Online - Pandemia',
    description: 'A partir de abril de 2020 nossas atividades tiveram de mudar de formato. Palestras, cursos, clube de negócios, mentorias, tudo passou a ser online para empreendedoras.',
    image: '/assets/timeline/timeline-eventos-online-1.jpg'
  },
  {
    id: 'eventos-online-2',
    date: 'Durante 2020',
    title: 'Acelera Empreendedora Online',
    description: 'Continuidade dos eventos online durante a pandemia, mantendo o apoio às empreendedoras através de palestras, cursos e networking virtual.',
    image: '/assets/timeline/timeline-eventos-online-2.jpg'
  },
  {
    id: 'podcast',
    date: '2020 - 2021',
    title: 'Podcast Convergência Feminina',
    description: 'Em abril de 2021, nasce o Podcast Convergência Feminina, que começa de forma solo. Em novembro de 2022 com a flexibilização da pandemia, acontecem as primeiras entrevistas com convidadas. Está pausado agora, mas voltaremos com certeza, quem sabe em 2026.',
    image: '/assets/timeline/timeline-podcast.jpg'
  },
  {
    id: 'economia-solidaria',
    date: '2021 - 2023',
    title: 'Economia Solidária Alvorada',
    description: 'Participamos dos encontros para reativação e fortalecimento da economia solidária no município de Alvorada, representando o coletivo TPM.',
    image: '/assets/timeline/timeline-economia-solidaria.jpg'
  },
  {
    id: 'projeto-nasce',
    date: 'Fevereiro 2022',
    title: 'Nasce o projeto Mulheres em Convergência',
    description: 'Nasce também o MULHERES EM CONVERGÊNCIA, programa de capacitação de empreendedoras, o primeiro encontro foi no jardim Algarve em Alvorada, com um pequeno grupo de mulheres.',
    image: '/assets/timeline/timeline-projeto-nasce.jpg'
  },
  {
    id: 'projeto-morro-santana',
    date: 'Março 2022',
    title: 'Projeto - Morro Santana',
    description: 'Capacitação no Bairro Morro Santana em Porto Alegre, com o grupo de mulheres do coletivo **Bazarte no morro**. 1º encontro em abril.',
    image: '/assets/timeline/timeline-projeto-morro-santana.jpg'
  },
  {
    id: 'projeto-sumare',
    date: 'Abril 2022',
    title: 'Projeto - Sumaré',
    description: 'Capacitação no Bairro Sumaré em Alvorada, com o grupo de mulheres do coletivo TPM.',
    image: '/assets/timeline/timeline-projeto-sumare.jpg'
  },
  {
    id: 'projeto-formosa',
    date: 'Abril 2022',
    title: 'Projeto - Formosa',
    description: 'Capacitação no Bairro Formosa em Alvorada, com o grupo de mulheres do coletivo TPM.',
    image: '/assets/timeline/timeline-projeto-formosa.jpg'
  },
  {
    id: 'acelera-presencial',
    date: 'Maio 2022',
    title: 'Acelera Empreendedora Presencial',
    description: 'Realizamos um encontro presencial de empreendedoras, o ACELERA EMPREENDEDORA, onde reunimos mais de 40 mulheres. Tivemos palestras, pitch e rodada de negócios.',
    image: '/assets/timeline/timeline-acelera-empreendedora.jpg'
  },
  {
    id: 'planejamento-financeiro',
    date: 'Junho 2022',
    title: 'Workshop Planejamento Financeiro',
    description: 'Workshop sobre Organização e Produtividade, realizado no Bairro Jardim Algarve.',
    image: '/assets/timeline/timeline-planejamento-financeiro.jpg'
  },
  {
    id: 'adelino-borba',
    date: 'Outubro 2023',
    title: 'Palestra Centro Adelino Borba',
    description: 'Palestra sobre Empreendedorismo – Mais Mulheres a frente de negócios – realizada no centro municipal de capacitação profissional Adelino Borba, em Alvorada.',
    image: '/assets/timeline/timeline-adelino-borba.jpg'
  }
];

export const Timeline = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  };

  const getItemsPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return itemsPerView.mobile;
      if (window.innerWidth < 1024) return itemsPerView.tablet;
      return itemsPerView.desktop;
    }
    return itemsPerView.desktop;
  };

  const [itemsToShow, setItemsToShow] = useState(getItemsPerView);

  useEffect(() => {
    const handleResize = () => {
      setItemsToShow(getItemsPerView());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, timelineData.length - itemsToShow);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const openLightbox = (image: string) => {
    setSelectedImage(image);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
            Nossa Jornada
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conheça os principais marcos da nossa história e como chegamos até aqui
          </p>
        </header>

        <div className="relative max-w-7xl mx-auto">
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <div className="flex space-x-2">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentIndex === index 
                      ? 'bg-primary' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              disabled={currentIndex === maxIndex}
              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Timeline Slider */}
          <div className="overflow-hidden" ref={sliderRef}>
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`
              }}
            >
              {timelineData.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex-none px-4 ${
                    itemsToShow === 1 ? 'w-full' :
                    itemsToShow === 2 ? 'w-1/2' : 'w-1/3'
                  }`}
                >
                  <Card className="h-full group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-48 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                        onClick={() => openLightbox(item.image)}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <button
                        onClick={() => openLightbox(item.image)}
                        className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/30"
                      >
                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </button>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm font-medium text-primary">{item.date}</span>
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-3 text-card-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed line-clamp-4">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 w-full bg-muted rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{
                width: `${((currentIndex + 1) / (maxIndex + 1)) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Lightbox Modal */}
        <Dialog open={!!selectedImage} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 z-50"
              >
                <X className="h-6 w-6" />
              </Button>
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Timeline image"
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};