/**
 * Roteiros de tour por módulo (Fase 3).
 *
 * Subir a `versao` de um módulo faz o tour abrir sozinho de novo para todas,
 * sem apagar histórico. Textos em linguagem simples, sem jargão.
 */
import type { TourPasso } from './useTour';

export const TOUR_VERSAO: Record<string, number> = {
  'meu-painel': 1,
  conecta: 1,
  academy: 1,
  embaixadoras: 1,
  'meu-negocio': 1,
};

export const TOUR_PASSOS: Record<string, TourPasso[]> = {
  'meu-painel': [
    {
      titulo: 'Bem-vinda ao seu painel',
      texto: 'Aqui você encontra tudo o que é seu: seus dados, sua assinatura e seus atalhos.',
    },
    {
      alvo: '[data-tour="painel-perfil"]',
      titulo: 'Seus dados',
      texto: 'Mantenha nome, telefone e endereço em dia. É por eles que a gente fala com você.',
    },
    {
      alvo: '[data-tour="painel-assinatura"]',
      titulo: 'Sua assinatura',
      texto: 'Mostra até quando seu acesso está válido e o que ele libera.',
    },
    {
      titulo: 'Pronto!',
      texto: 'Sempre que quiser rever isto, clique no botão de ajuda no canto da tela.',
    },
  ],
  conecta: [
    {
      titulo: 'Este é o Conecta+',
      texto: 'O espaço de negócios entre as associadas: indicações, encontros e parcerias.',
    },
    {
      alvo: '[data-tour="conecta-indicacoes"]',
      titulo: 'Indicações',
      texto: 'Registre aqui quando indicar alguém. É isso que gera seus pontos.',
    },
    {
      alvo: '[data-tour="conecta-encontros"]',
      titulo: 'Encontros',
      texto: 'Marque conversas de um para um e acompanhe as já realizadas.',
    },
  ],
  academy: [
    {
      titulo: 'Sua área de cursos',
      texto: 'Aqui ficam as aulas liberadas para você e o seu progresso.',
    },
    {
      alvo: '[data-tour="academy-catalogo"]',
      titulo: 'Catálogo',
      texto: 'Veja todos os cursos e comece pelo que fizer mais sentido agora.',
    },
  ],
  embaixadoras: [
    {
      titulo: 'Painel da embaixadora',
      texto: 'Acompanhe suas indicações, comissões e materiais de divulgação.',
    },
    {
      alvo: '[data-tour="embaixadora-link"]',
      titulo: 'Seu link',
      texto: 'Compartilhe este link: toda associada que entrar por ele conta para você.',
    },
  ],
  'meu-negocio': [
    {
      titulo: 'A página do seu negócio',
      texto: 'É o que as outras pessoas veem no diretório. Capriche na foto e na descrição.',
    },
    {
      alvo: '[data-tour="negocio-logo"]',
      titulo: 'Sua marca',
      texto: 'Envie a logo quadrada. Ela aparece na busca e no seu perfil.',
    },
  ],
};
