import { LandingPageContent } from '@/types/landing-page';

/**
 * Configuração do Produto: Método Criar & Converter
 * Este arquivo contém todo o conteúdo editável da LP
 */
export const criarConverterContent: LandingPageContent = {
  product: {
    id: 'criar-converter-2026',
    slug: 'criar-converter',
    name: 'Método Criar & Converter',
    tagline: 'Imersão presencial de marketing para mulheres empreendedoras',
    price: 297.00,
    paymentDescription: 'Método Criar & Converter - Imersão Presencial',
    eventDates: '21, 22 e 23 de janeiro',
    eventDuration: '+20 horas',
    eventFormat: 'presencial',
    eventLocation: 'A definir',
  },

  hero: {
    headline: 'Você cria conteúdo, mas não consegue vender?',
    subheadline: 'Aprenda a transformar divulgação confusa em vendas reais com método, clareza e estratégia.',
    description: 'O Método Criar & Converter é uma imersão presencial criada para mulheres empreendedoras que querem organizar sua comunicação, criar conteúdos estratégicos e transformar isso em resultado real para seus negócios.',
    ctaPrimary: 'QUERO APRENDER A VENDER COM ESTRATÉGIA',
    ctaSecondary: 'Garantir minha vaga agora',
  },

  painPoints: {
    title: 'Você se identifica com alguma dessas situações?',
    painPoints: [
      { text: 'Não sabe o que postar e nem por onde começar' },
      { text: 'Já tentou várias estratégias, mas nada parece funcionar' },
      { text: 'Não gosta de redes sociais, mas sabe que precisa delas' },
      { text: 'Sente que perde tempo criando conteúdo sem resultado' },
      { text: 'Falta clareza, organização e segurança para vender' },
      { text: '👉 Se você se identificou com pelo menos uma dessas situações, esse workshop foi criado para você.' },
    ],
    closingText: 'O problema não é você.',
    closingHighlight: 'É a falta de método.',
  },

  method: {
    title: 'O Método Criar & Converter',
    description: 'O Método Criar & Converter entrega um caminho claro para vender, mesmo que você não goste de marketing..',
    benefits: [
      'Criar com clareza',
      'Organizar sua comunicação',
      'Converter com consistência',
    ],
    closingText: 'Marketing não é só postar. É narrativa, estratégia, processo e decisão.',
  },

  pillars: {
    title: 'Os 3 Pilares do Método',
    pillars: [
      {
        id: 'pilar-1',
        title: 'Pilar 01',
        subtitle: 'Clareza Estratégica',
        description: 'Entenda o marketing, seus processos internos e externos e como tudo se conecta com o seu negócio.',
        icon: 'Lightbulb',
      },
      {
        id: 'pilar-2',
        title: 'Pilar 02',
        subtitle: 'Conteúdo com Estratégia',
        description: 'Aprenda a usar ferramentas para criar conteúdo de forma leve, conectada ao seu negócio e com foco em resultados reais (marketing orgânico).',
        icon: 'Target',
      },
      {
        id: 'pilar-3',
        title: 'Pilar 03',
        subtitle: 'Produção em Abundância com IA',
        description: 'Construa cronogramas e calendários de conteúdo usando ferramentas digitais e IAs generativas, com estratégia e produtividade.',
        icon: 'Sparkles',
      },
    ],
  },

  included: {
    title: 'O Que Você Vai Receber',
    items: [
      { text: 'Workshop presencial de 03 dias', highlight: true },
      { text: 'Método Criar & Converter (passo a passo)' },
      { text: 'Materiais práticos e aplicáveis' },
      { text: '03 Mentorias em grupo', highlight: true },
      { text: 'Grupo de networking no WhatsApp' },
      { text: 'Mais de 20 horas de Conteúdos Exclusivos', highlight: true },
      { text: 'Aula bônus online e ao vivo sobre SEO e posicionamento online com o especialista Diogo Devitte', isBonus: true },
    ],
  },

  targetAudience: {
    title: 'Para Quem É o Criar & Converter',
    profiles: [
      'Mulheres empreendedoras',
      'Quem precisa aprender marketing e estratégia',
      'Quem se sente perdida sobre o que e como postar',
      'Quem não gosta de redes sociais, mas precisa aprender',
      'Quem valoriza aprendizado prático e acompanhamento',
      'Quem quer usar ferramentas digitais e IA para ganhar produtividade',
    ],
    ctaPrimary: 'Se você quer vender com mais segurança, sem depender de sorte ou indicação, esse método é para você.',
  },

  transformation: {
    title: 'Depois do Método, Você:',
    transformations: [
      { text: 'Sabe exatamente o que criar' },
      { text: 'Tem clareza sobre seu cliente' },
      { text: 'Organiza seu conteúdo com estratégia' },
      { text: 'Ganha segurança para vender' },
      { text: 'Para de perder tempo' },
      { text: 'Transforma ideias em oportunidades reais' },
    ],
    ctaPrimary: 'Você não vai sair sabendo mais. Vai sair vendendo melhor.',
  },

  eventDetails: {
    title: 'Detalhes do Evento',
    dates: '21, 22 e 23 de janeiro de 2026',
    duration: '+ de 20 horas de conteúdos',
    format: 'Presencial',
    location: 'A confirmar',
  },

  investment: {
    title: 'Investimento',
    price: 'R$ 297,00',
    priceValue: 297.00,
    description: 'Uma imersão completa para parar de errar, parar de improvisar e começar a trabalhar com método, clareza e estratégia.',
    ctaText: 'GARANTIR MINHA VAGA AGORA',
  },
};
