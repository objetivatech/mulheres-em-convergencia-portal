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
  embaixadoras: 2,
  'meu-negocio': 2,
  planos: 1,
  encontros: 1,
  'meus-dados': 1,
  'painel-equipe': 2,
  crm: 2,
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
    {
      titulo: 'Indicações e repasses',
      texto: 'Mais abaixo você vê quem assinou pelo seu link, seu nível e os valores a receber.',
    },
    {
      titulo: 'Materiais prontos',
      texto: 'Use as artes e textos de divulgação da equipe. Dúvidas? Veja "Tutoriais" no menu.',
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
    {
      alvo: '[data-tour="negocio-mapa"]',
      titulo: 'Seu negócio no mapa',
      texto: 'Preencha bairro e cidade e clique em "Localizar pelo endereço". Não precisa digitar números: a gente acha o lugar e mostra no mapa do diretório para clientes da sua região.',
    },
    {
      alvo: '[data-tour="negocio-mapa"]',
      titulo: 'Ficou no lugar errado?',
      texto: 'Clique em "Veja como acertar". Explicamos em 4 passos como copiar a localização do Google Maps e colar aqui. Depois, é só salvar.',
    },
  ],
  planos: [
    {
      titulo: 'Seus planos',
      texto: 'Aqui você vê o que está ativo, até quando vale e o que cada plano libera.',
    },
    {
      titulo: 'Renovar é simples',
      texto: 'Quando o prazo estiver perto do fim, o botão de renovação aparece nesta mesma tela.',
    },
  ],
  encontros: [
    {
      titulo: 'Seus encontros',
      texto: 'A lista mostra onde você se inscreveu e o ingresso de cada encontro.',
    },
    {
      titulo: 'Na hora do evento',
      texto: 'Abra o ingresso pelo celular: é ele que confirma sua presença na entrada.',
    },
  ],
  'meus-dados': [
    {
      titulo: 'Seus dados',
      texto: 'Nome, contato, endereço e sua apresentação. Tudo o que a gente usa para falar com você.',
    },
    {
      titulo: 'Sua apresentação',
      texto: 'Escreva com calma: ela aparece no Conecta+ e no diretório.',
    },
  ],
  'painel-equipe': [
    {
      titulo: 'Painel da equipe',
      texto: 'Tudo o que o site mostra é editado por aqui: conteúdo, planos, encontros e acessos.',
    },
    {
      alvo: '[data-tour="painel-menu"]',
      titulo: 'Menu em grupos',
      texto: 'As áreas estão agrupadas (Site, Conteúdo, Comunidade, Vendas, Comunicação). Clique no grupo para abrir. Em "Tutoriais" há o passo a passo de cada rotina, inclusive embaixadoras e menus.',
    },
    {
      titulo: 'Sempre reversível',
      texto: 'Quase tudo pode ser despublicado em vez de apagado. Na dúvida, desligue e veja o site.',
    },
    {
      titulo: 'CRM · Relacionamento',
      texto: 'Em Comunicação → "CRM · Relacionamento" fica a sua agenda do dia, as fichas das pessoas, o funil e as mensagens prontas.',
    },
    {
      titulo: 'Vagas e divulgação dos encontros',
      texto: 'Ao editar um encontro, informe ingressos reais vendidos fora do portal e ligue "Destacar" para a tarja. Os contadores são automáticos. Quem aguarda vaga fica na aba "Lista de espera".',
    },
  ],
  crm: [
    {
      titulo: 'Bem-vinda ao CRM',
      texto: 'Aqui você acompanha cada pessoa: quem precisa de retorno hoje, em que ponto está a conversa e tudo o que já aconteceu.',
    },
    {
      alvo: '[data-tour="crm-abas"]',
      titulo: 'As áreas do CRM',
      texto: '"Hoje" é a sua agenda. "Pessoas" tem as fichas. "Funil" mostra as conversas sobre associação. "Tarefas" e "Mensagens prontas" completam.',
    },
    {
      alvo: '[data-tour="crm-abas"]',
      titulo: 'Depois dos encontros e das listas',
      texto: '"Radar pós-encontro" mostra quem foi aos encontros e merece um próximo passo. "Fichas repetidas" une cadastros da mesma pessoa. "Importar planilha" traz listas antigas, sempre com conferência antes.',
    },
    {
      alvo: '[data-tour="crm-busca"]',
      titulo: 'Busca rápida',
      texto: 'Procure por nome, apelido, e-mail, telefone, CPF ou nome do negócio. Acentos não atrapalham.',
    },
    {
      titulo: 'WhatsApp com 1 clique',
      texto: 'O botão WhatsApp abre a conversa com uma mensagem pronta para você revisar. Nada é enviado sozinho.',
    },
    {
      titulo: 'Registre depois de conversar',
      texto: 'Na ficha, use "Registrar contato" e, se quiser, já marque o próximo passo. Ele aparece na sua agenda no dia certo.',
    },
  ],
};
