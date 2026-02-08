/**
 * Conteúdo da Landing Page de Convite para Indicações
 * Estrutura modular para conversão de indicadas em assinantes
 */

export interface ConvitePageContent {
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  benefits: {
    title: string;
    subtitle: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  idealFor: {
    title: string;
    profiles: Array<{
      emoji: string;
      text: string;
    }>;
  };
  transformation: {
    title: string;
    items: string[];
    ctaText: string;
  };
  faq: {
    title: string;
    subtitle: string;
  };
  cta: {
    title: string;
    description: string;
    buttonText: string;
  };
}

export const convitePageContent: ConvitePageContent = {
  hero: {
    badge: 'Você foi indicada!',
    headline: 'Faça parte da maior comunidade de mulheres empreendedoras do Brasil',
    subheadline: 'Conecte-se. Cresça. Transforme.',
    description: 'Junte-se a milhares de mulheres que estão construindo negócios de sucesso através de networking estratégico, aprendizado contínuo e oportunidades exclusivas.',
    ctaPrimary: 'QUERO FAZER PARTE',
    ctaSecondary: 'Ver planos disponíveis',
  },
  benefits: {
    title: 'O que você ganha como associada',
    subtitle: 'Benefícios exclusivos para impulsionar sua jornada empreendedora',
    items: [
      {
        icon: 'Users',
        title: 'Comunidade Ativa',
        description: 'Acesso a uma rede de mulheres empreendedoras prontas para colaborar, trocar experiências e criar parcerias.',
      },
      {
        icon: 'GraduationCap',
        title: 'Conteúdos Exclusivos',
        description: 'Workshops, cursos e materiais desenvolvidos especialmente para o crescimento do seu negócio.',
      },
      {
        icon: 'Store',
        title: 'Vitrine para seu Negócio',
        description: 'Seu negócio no Diretório de Associadas, visível para milhares de pessoas que buscam serviços e produtos.',
      },
      {
        icon: 'Calendar',
        title: 'Eventos Presenciais e Online',
        description: 'Encontros de networking, mentorias em grupo e eventos exclusivos com descontos especiais.',
      },
      {
        icon: 'Award',
        title: 'Reconhecimento e Visibilidade',
        description: 'Destaque nas redes sociais, indicações e oportunidades de ser reconhecida na comunidade.',
      },
      {
        icon: 'Headphones',
        title: 'Suporte Dedicado',
        description: 'Equipe pronta para ajudar com dúvidas, orientações e suporte técnico para seu perfil.',
      },
    ],
  },
  idealFor: {
    title: 'Para quem é a assinatura',
    profiles: [
      { emoji: '👩‍💼', text: 'Empreendedoras que querem expandir sua rede de contatos' },
      { emoji: '🛍️', text: 'Donas de pequenos negócios buscando mais visibilidade' },
      { emoji: '💻', text: 'Profissionais liberais que oferecem serviços' },
      { emoji: '🌱', text: 'Mulheres iniciando sua jornada empreendedora' },
      { emoji: '🚀', text: 'Empresárias em fase de crescimento e expansão' },
      { emoji: '🤝', text: 'Quem valoriza networking e colaboração entre mulheres' },
    ],
  },
  transformation: {
    title: 'Depois de se tornar associada, você:',
    items: [
      'Terá acesso a uma comunidade engajada e acolhedora',
      'Poderá divulgar seu negócio no nosso Diretório',
      'Receberá descontos exclusivos em eventos e cursos',
      'Participará de mentorias e encontros de networking',
      'Será vista por milhares de pessoas todos os meses',
      'Fará parte de algo maior: uma rede de apoio real',
    ],
    ctaText: '💪 Essa é a sua chance de crescer junto!',
  },
  faq: {
    title: 'Perguntas Frequentes',
    subtitle: 'Tire suas dúvidas sobre a assinatura',
  },
  cta: {
    title: 'Pronta para fazer parte?',
    description: 'Escolha o plano ideal para você e comece sua jornada na comunidade Mulheres em Convergência.',
    buttonText: 'ESCOLHER MEU PLANO',
  },
};
