/**
 * Conteúdo das duas Centrais de Tutoriais.
 * - TUTORIAIS_ASSOCIADA: uso da plataforma pela usuária (Minha área).
 * - TUTORIAIS_EQUIPE: rotinas administrativas (Painel da equipe).
 * Linguagem simples, passos curtos, sem termos técnicos.
 */
export type Tutorial = {
  id: string;
  modulo: string;
  titulo: string;
  resumo: string;
  passos: string[];
  dicas?: string[];
  link?: { para: string; rotulo: string };
};

export const TUTORIAIS_ASSOCIADA: Tutorial[] = [
  {
    id: 'primeiros-passos', modulo: 'Começando', titulo: 'Primeiros passos no portal',
    resumo: 'Como encontrar tudo o que você tem disponível.',
    passos: [
      'Clique no seu nome no topo do site e escolha "Minha área".',
      'No menu da esquerda estão todas as suas áreas: planos, encontros, Academy, Conecta+ e seus dados.',
      'Se uma área mostrar um convite para assinar, é porque ela não faz parte do seu plano atual.',
      'Em qualquer tela, o botão de ajuda abre o tour guiado daquela página.',
    ],
    link: { para: '/minha-area', rotulo: 'Ir para Minha área' },
  },
  {
    id: 'meus-dados', modulo: 'Meus dados', titulo: 'Atualizar meus dados e minha foto',
    resumo: 'Sua foto e seu perfil aparecem no Diretório, no Conecta+ e no blog.',
    passos: [
      'Abra "Meus dados" no menu.',
      'Em "Sua foto", clique em "Enviar do computador" e escolha uma foto.',
      'Preencha nome, apresentação e redes sociais.',
      'Clique em "Salvar".',
    ],
    dicas: ['Suas imagens ficam guardadas só para você. Outras associadas não veem o que você enviou.'],
    link: { para: '/minha-area/dados', rotulo: 'Abrir Meus dados' },
  },
  {
    id: 'meu-negocio', modulo: 'Diretório', titulo: 'Colocar meu negócio no Diretório',
    resumo: 'Divulgue seu negócio para todas as visitantes do site.',
    passos: [
      'Abra "Meu negócio" no menu (aparece quando seu plano inclui o Diretório).',
      'Preencha nome, descrição, categoria, cidade e contatos.',
      'Envie o logo e uma foto de capa.',
      'No campo de localização, digite o endereço e clique em "Encontrar no mapa". Não precisa saber números de mapa.',
      'Clique em "Salvar". A equipe confere e publica.',
    ],
    link: { para: '/minha-area/negocio', rotulo: 'Abrir Meu negócio' },
  },
  {
    id: 'encontros', modulo: 'Encontros', titulo: 'Inscrever-me em um encontro',
    resumo: 'Como garantir sua vaga e ver seu ingresso.',
    passos: [
      'No site, abra "Eventos" e escolha o encontro.',
      'Clique em "Inscrever-me" e confira seus dados.',
      'Se for pago, siga para o pagamento. A confirmação chega por e-mail.',
      'Seu ingresso fica em "Meus encontros".',
    ],
    dicas: ['Quem ainda não assina pode participar de um encontro gratuito. Assinantes participam de todos.'],
    link: { para: '/minha-area/encontros', rotulo: 'Ver meus encontros' },
  },
  {
    id: 'conecta', modulo: 'Conecta+', titulo: 'Fazer conexões no Conecta+',
    resumo: 'Encontre outras associadas, conecte-se e converse.',
    passos: [
      'Abra "Conecta+" no menu.',
      'Use a busca para achar alguém pelo nome.',
      'Clique em "Conectar". Quando a pessoa aceitar, vocês podem trocar mensagens.',
      'O número ao lado do menu mostra mensagens novas.',
    ],
    link: { para: '/minha-area/conecta', rotulo: 'Abrir Conecta+' },
  },
  {
    id: 'academy', modulo: 'Academy', titulo: 'Estudar na Academy',
    resumo: 'Cursos e aulas no seu ritmo.',
    passos: [
      'Abra "Academy" no menu.',
      'Escolha um curso e clique em "Começar".',
      'Ao terminar cada aula, marque como concluída para acompanhar seu progresso.',
    ],
    link: { para: '/minha-area/academy', rotulo: 'Abrir Academy' },
  },
  {
    id: 'planos', modulo: 'Planos', titulo: 'Assinar ou renovar meu plano',
    resumo: 'Veja o que está incluído e até quando vale.',
    passos: [
      'Abra "Meus planos" para ver o que você tem e a data de validade.',
      'Para assinar ou trocar, clique em "Conhecer os planos".',
      'Depois do pagamento confirmado, as áreas liberam sozinhas. Às vezes leva alguns minutos.',
    ],
    dicas: ['Pagou e alguma área não abriu? Saia e entre de novo. Se continuar, fale com a equipe.'],
    link: { para: '/minha-area/planos', rotulo: 'Ver meus planos' },
  },
];

export const TUTORIAIS_EQUIPE: Tutorial[] = [
  {
    id: 'cortesia', modulo: 'Pessoas', titulo: 'Dar uma cortesia (acesso gratuito)',
    resumo: 'Libere uma área para uma pessoa por um tempo, sem pagamento.',
    passos: [
      'Abra "Pessoas" e busque a pessoa pelo nome, CPF ou e-mail.',
      'Clique em "Abrir ficha".',
      'Na parte "Acessos", escolha a área (Diretório, Conecta+, Academy, Encontros ou Embaixadoras).',
      'Informe por quantos dias (o padrão é 31) e, se quiser, o motivo.',
      'Clique em "Dar cortesia". A liberação é imediata.',
    ],
    dicas: [
      'Só administradoras podem dar ou encerrar cortesias.',
      'Para encerrar antes do prazo, clique em "Encerrar" ao lado do acesso.',
      'Peça para a pessoa sair e entrar de novo se a área não aparecer na hora.',
    ],
    link: { para: '/painel-conteudo/pessoas', rotulo: 'Abrir Pessoas' },
  },
  {
    id: 'papeis', modulo: 'Pessoas', titulo: 'Papéis: administradora, editora, embaixadora',
    resumo: 'Papéis definem funções. Áreas pagas vêm do plano.',
    passos: [
      'Na ficha da pessoa, vá em "Papéis".',
      'Escolha o papel e clique em "Conceder". Para retirar, clique em "Revogar".',
      'Embaixadora é sempre concedida à mão pela administração; nunca vem de plano.',
    ],
    link: { para: '/painel-conteudo/pessoas', rotulo: 'Abrir Pessoas' },
  },
  {
    id: 'ver-como', modulo: 'Pessoas', titulo: 'Entender o que uma associada enxerga',
    resumo: 'Diagnóstico das áreas, pagamentos e causas prováveis de problema.',
    passos: [
      'Na ficha da pessoa, abra "Ver como associada".',
      'Confira quais áreas estão liberadas, até quando e de onde vieram.',
      'A tela indica causas prováveis quando algo não abre.',
    ],
  },
  {
    id: 'planos', modulo: 'Planos e encontros', titulo: 'Criar um plano ou oferta especial',
    resumo: 'Planos públicos, ocultos ou privados com código.',
    passos: [
      'Abra "Planos, encontros e acessos" e clique em "Novo plano".',
      'Marque as áreas incluídas, o valor e a validade.',
      'Em "Visibilidade": público aparece na página de planos; oculto só por link; privado exige código.',
      'Salve e copie o link para enviar.',
    ],
    link: { para: '/painel-conteudo/planos-eventos', rotulo: 'Abrir Planos e encontros' },
  },
  {
    id: 'eventos', modulo: 'Planos e encontros', titulo: 'Criar um encontro e acompanhar participantes',
    resumo: 'Do cadastro à lista de quem participou e ainda não assina.',
    passos: [
      'Em "Planos, encontros e acessos", clique em "Novo encontro".',
      'Preencha nome, data, local ou link, capa e lotes de ingresso.',
      'Marque "Publicado" para aparecer no site.',
      'Na aba "Participantes e conversão", veja quem participou e ainda não assina; exporte a lista se quiser.',
    ],
    link: { para: '/painel-conteudo/planos-eventos', rotulo: 'Abrir Planos e encontros' },
  },
  {
    id: 'negocios', modulo: 'Diretório', titulo: 'Publicar negócios no Diretório',
    resumo: 'Conferir, ajustar e publicar o negócio de uma associada.',
    passos: [
      'Abra "Negócios" e clique no negócio.',
      'Confira os dados e a localização ("Encontrar no mapa").',
      'Marque "Publicado" e salve.',
    ],
    link: { para: '/painel-conteudo/negocios', rotulo: 'Abrir Negócios' },
  },
  {
    id: 'conecta', modulo: 'Conecta+', titulo: 'Por que alguém não aparece no Conecta+',
    resumo: 'Só aparece quem tem o Conecta+ liberado.',
    passos: [
      'Confira na ficha da pessoa se o acesso "Conecta+" está vigente.',
      'Se não estiver, dê uma cortesia ou peça a regularização do pagamento.',
      'Grupos são gerenciados em "Conecta+" no painel.',
    ],
    link: { para: '/painel-conteudo/conecta', rotulo: 'Abrir Conecta+' },
  },
  {
    id: 'asaas', modulo: 'Financeiro', titulo: 'Pagou e não liberou: conciliar acessos',
    resumo: 'Revisa pagamentos confirmados e libera o que faltar.',
    passos: [
      'Abra "Automações".',
      'Clique em "Buscar pagamentos no Asaas" e depois em "Conciliar acessos das assinantes".',
      'Confira o resultado na ficha da pessoa.',
    ],
    link: { para: '/painel-conteudo/automacoes', rotulo: 'Abrir Automações' },
  },
  {
    id: 'imagens', modulo: 'Conteúdo', titulo: 'Biblioteca de imagens',
    resumo: 'Onde ficam as imagens e quem vê cada uma.',
    passos: [
      'Abra "Imagens". A administração vê tudo; use o filtro "Origem" para separar equipe e associadas.',
      'Cada imagem mostra a categoria e onde está sendo usada.',
      'Associadas só veem as imagens que elas mesmas enviaram.',
      'Antes de apagar, confira se a imagem não está em uso.',
    ],
    link: { para: '/painel-conteudo/imagens', rotulo: 'Abrir Imagens' },
  },
  {
    id: 'blog', modulo: 'Conteúdo', titulo: 'Publicar no blog e editar textos do site',
    resumo: 'Posts, autoras e frases do site sem mexer em código.',
    passos: [
      'Em "Blog", clique em "Novo post", escreva, coloque a capa e escolha a autora.',
      'Marque "Publicado" ou agende uma data.',
      'Em "Textos do site", altere frases e itens do menu; salve e confira no site.',
    ],
    link: { para: '/painel-conteudo/blog', rotulo: 'Abrir Blog' },
  },
  {
    id: 'emails', modulo: 'Comunicação', titulo: 'Newsletter e comunicados',
    resumo: 'Envio de e-mails pela Sender.net.',
    passos: [
      'Em "Newsletter", monte a campanha e envie um teste para você.',
      'Conferiu? Clique em enviar para a lista.',
      'Em "Comunicados", envie avisos às associadas do portal.',
    ],
    link: { para: '/painel-conteudo/newsletter', rotulo: 'Abrir Newsletter' },
  },
];
