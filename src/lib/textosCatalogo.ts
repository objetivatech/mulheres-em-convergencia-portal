/**
 * Catálogo dos textos fixos do site que a equipe pode editar pelo painel.
 * Cada chave vira uma linha em `textos_site` na primeira vez que for salva.
 * O valor padrão é o que aparece enquanto ninguém editou.
 */
export type TextoCatalogo = {
  chave: string;
  grupo: string;
  rotulo: string;
  padrao: string;
  tipo?: 'texto' | 'rico' | 'imagem' | 'link';
};

export const CATALOGO_TEXTOS: TextoCatalogo[] = [
  // Menu do site (topo, celular e rodapé)
  { chave: 'menu.inicio', grupo: 'Menu do site', rotulo: 'Item do menu — página inicial', padrao: 'Início' },
  { chave: 'menu.diretorio', grupo: 'Menu do site', rotulo: 'Item do menu — diretório', padrao: 'Diretório' },
  { chave: 'menu.convergindo', grupo: 'Menu do site', rotulo: 'Item do menu — blog', padrao: 'Convergindo' },
  { chave: 'menu.academy', grupo: 'Menu do site', rotulo: 'Item do menu — cursos', padrao: 'Academy' },
  { chave: 'menu.eventos', grupo: 'Menu do site', rotulo: 'Item do menu — eventos', padrao: 'Eventos' },
  { chave: 'menu.sobre', grupo: 'Menu do site', rotulo: 'Item do menu — sobre', padrao: 'Sobre' },

  // Página inicial
  { chave: 'home.hero.botao_secundario', grupo: 'Página inicial', rotulo: 'Botão secundário do topo', padrao: 'Ver o diretório' },
  { chave: 'home.negocios.titulo', grupo: 'Página inicial', rotulo: 'Título — negócios da rede', padrao: 'Negócios da rede' },
  { chave: 'home.negocios.subtitulo', grupo: 'Página inicial', rotulo: 'Subtítulo — negócios da rede', padrao: 'Empreendedoras com acesso em dia no diretório.' },
  { chave: 'home.blog.titulo', grupo: 'Página inicial', rotulo: 'Título — blog', padrao: 'Convergindo' },
  { chave: 'home.blog.subtitulo', grupo: 'Página inicial', rotulo: 'Subtítulo — blog', padrao: 'Histórias e aprendizados da nossa rede.' },
  { chave: 'home.cta.titulo', grupo: 'Página inicial', rotulo: 'Chamada final — título', padrao: 'Sua vez de fazer parte da convergência' },
  { chave: 'home.cta.subtitulo', grupo: 'Página inicial', rotulo: 'Chamada final — texto', padrao: 'Escolha um plano e comece hoje.' },
  { chave: 'home.cta.botao', grupo: 'Página inicial', rotulo: 'Chamada final — botão', padrao: 'Conhecer os planos' },

  { chave: 'home.hero.selo', grupo: 'Página inicial', rotulo: 'Topo — selo acima do título (use {n} para o nº de negócios)', padrao: '+{n} negócios liderados por mulheres' },
  { chave: 'home.hero.titulo', grupo: 'Página inicial', rotulo: 'Topo — título principal', padrao: 'Sua rede de apoio para transformar o negócio numa empresa que sustenta sua vida' },
  { chave: 'home.hero.subtitulo', grupo: 'Página inicial', rotulo: 'Topo — texto de apoio', padrao: 'Formação prática, networking ativo e visibilidade no diretório — feito para quem concilia negócio, casa e o resto da vida.' },
  { chave: 'home.hero.botao', grupo: 'Página inicial', rotulo: 'Topo — botão principal', padrao: 'Quero fazer parte' },
  { chave: 'home.hero.botao_link', grupo: 'Página inicial', rotulo: 'Topo — link do botão principal', padrao: '/planos', tipo: 'link' },
  { chave: 'home.hero.botao_secundario_link', grupo: 'Página inicial', rotulo: 'Topo — link do botão secundário', padrao: '/diretorio', tipo: 'link' },
  { chave: 'home.hero.imagem', grupo: 'Página inicial', rotulo: 'Topo — foto', padrao: '', tipo: 'imagem' },
  { chave: 'home.numeros.1', grupo: 'Página inicial', rotulo: 'Números — rótulo 1', padrao: 'negócios no diretório' },
  { chave: 'home.numeros.2', grupo: 'Página inicial', rotulo: 'Números — rótulo 2', padrao: 'áreas de atuação' },
  { chave: 'home.numeros.3', grupo: 'Página inicial', rotulo: 'Números — rótulo 3', padrao: 'encontros realizados' },
  { chave: 'home.numeros.4', grupo: 'Página inicial', rotulo: 'Números — rótulo 4', padrao: 'cidades' },
  { chave: 'home.depoimento.texto', grupo: 'Página inicial', rotulo: 'Depoimento — texto', padrao: 'Entrei buscando clientes e encontrei uma rede que me ensinou a precificar, organizar as finanças e finalmente sair do zero a zero todo mês.' },
  { chave: 'home.depoimento.autora', grupo: 'Página inicial', rotulo: 'Depoimento — autora', padrao: '— Associada da rede' },
  { chave: 'home.depoimento.foto', grupo: 'Página inicial', rotulo: 'Depoimento — foto da autora', padrao: '', tipo: 'imagem' },
  { chave: 'home.pilares.titulo', grupo: 'Página inicial', rotulo: 'Pilares — título', padrao: 'Tudo que você precisa, num só lugar' },
  { chave: 'home.pilares.subtitulo', grupo: 'Página inicial', rotulo: 'Pilares — texto', padrao: 'Ferramentas pensadas para quem tem pouco tempo e muita vontade de crescer.' },
  { chave: 'home.pilar1.titulo', grupo: 'Página inicial', rotulo: 'Pilar 1 — título', padrao: 'Rede e encontros' },
  { chave: 'home.pilar1.texto', grupo: 'Página inicial', rotulo: 'Pilar 1 — texto', padrao: 'Rodas de negócio e formações presenciais e online.' },
  { chave: 'home.pilar1.link', grupo: 'Página inicial', rotulo: 'Pilar 1 — link', padrao: '/eventos', tipo: 'link' },
  { chave: 'home.pilar2.titulo', grupo: 'Página inicial', rotulo: 'Pilar 2 — título', padrao: 'Academy' },
  { chave: 'home.pilar2.texto', grupo: 'Página inicial', rotulo: 'Pilar 2 — texto', padrao: 'Cursos de marketing digital e gestão no seu ritmo.' },
  { chave: 'home.pilar2.link', grupo: 'Página inicial', rotulo: 'Pilar 2 — link', padrao: '/academy', tipo: 'link' },
  { chave: 'home.pilar3.titulo', grupo: 'Página inicial', rotulo: 'Pilar 3 — título', padrao: 'Diretório' },
  { chave: 'home.pilar3.texto', grupo: 'Página inicial', rotulo: 'Pilar 3 — texto', padrao: 'Presença online para quem procura o seu negócio.' },
  { chave: 'home.pilar3.link', grupo: 'Página inicial', rotulo: 'Pilar 3 — link', padrao: '/diretorio', tipo: 'link' },
  { chave: 'home.pilar4.titulo', grupo: 'Página inicial', rotulo: 'Pilar 4 — título', padrao: 'Embaixadoras' },
  { chave: 'home.pilar4.texto', grupo: 'Página inicial', rotulo: 'Pilar 4 — texto', padrao: 'Indique, ganhe reconhecimento e faça a rede crescer.' },
  { chave: 'home.pilar4.link', grupo: 'Página inicial', rotulo: 'Pilar 4 — link', padrao: '/embaixadoras', tipo: 'link' },
  { chave: 'home.porque.selo', grupo: 'Página inicial', rotulo: 'Por que se associar — selo', padrao: 'Por que se associar' },
  { chave: 'home.porque.titulo', grupo: 'Página inicial', rotulo: 'Por que se associar — título', padrao: 'Ser encontrada é só o começo' },
  { chave: 'home.porque.item1', grupo: 'Página inicial', rotulo: 'Por que se associar — item 1 (deixe vazio para esconder)', padrao: 'Página no diretório com contato direto e localização no mapa' },
  { chave: 'home.porque.item2', grupo: 'Página inicial', rotulo: 'Por que se associar — item 2 (deixe vazio para esconder)', padrao: 'Cursos de marketing e gestão na Academy' },
  { chave: 'home.porque.item3', grupo: 'Página inicial', rotulo: 'Por que se associar — item 3 (deixe vazio para esconder)', padrao: 'Encontros e rodas de negócio pela sua cidade' },
  { chave: 'home.porque.item4', grupo: 'Página inicial', rotulo: 'Por que se associar — item 4 (deixe vazio para esconder)', padrao: 'Indicações via Conecta+ entre associadas' },
  { chave: 'home.porque.botao', grupo: 'Página inicial', rotulo: 'Por que se associar — botão', padrao: 'Ver os planos' },
  { chave: 'home.porque.imagem', grupo: 'Página inicial', rotulo: 'Por que se associar — foto', padrao: '', tipo: 'imagem' },
  { chave: 'home.planos.titulo', grupo: 'Página inicial', rotulo: 'Planos — título', padrao: 'Escolha o plano certo para você' },
  { chave: 'home.planos.subtitulo', grupo: 'Página inicial', rotulo: 'Planos — texto', padrao: 'Cancele quando quiser. Sem burocracia.' },
  { chave: 'home.planos.link', grupo: 'Página inicial', rotulo: 'Planos — link para comparar', padrao: 'Ver todos os planos e comparar →' },

  // Diretório
  { chave: 'diretorio.titulo', grupo: 'Diretório', rotulo: 'Título da página', padrao: 'Diretório de negócios' },
  { chave: 'diretorio.subtitulo', grupo: 'Diretório', rotulo: 'Texto de apoio', padrao: 'Descubra empreendedoras da rede e fale direto com elas.' },

  // Blog
  { chave: 'blog.titulo', grupo: 'Blog Convergindo', rotulo: 'Título da página', padrao: 'Convergindo' },
  { chave: 'blog.subtitulo', grupo: 'Blog Convergindo', rotulo: 'Texto de apoio', padrao: 'Conteúdo feito por e para mulheres empreendedoras.' },

  // Encontros
  { chave: 'eventos.titulo', grupo: 'Encontros', rotulo: 'Título da página', padrao: 'Encontros e eventos' },
  { chave: 'eventos.subtitulo', grupo: 'Encontros', rotulo: 'Texto de apoio', padrao: 'Rodas de negócio, formações e celebrações da nossa rede.' },

  // Planos
  { chave: 'planos.titulo', grupo: 'Planos', rotulo: 'Título da página', padrao: 'Planos' },
  { chave: 'planos.subtitulo', grupo: 'Planos', rotulo: 'Texto de apoio', padrao: 'Faça parte da rede: seu negócio no diretório, presença nos encontros e acesso à comunidade.' },

  { chave: 'diretorio.selo', grupo: 'Diretório', rotulo: 'Selo acima do título (opcional)', padrao: '' },
  { chave: 'diretorio.imagem', grupo: 'Diretório', rotulo: 'Imagem da abertura (opcional)', padrao: '', tipo: 'imagem' },
  { chave: 'eventos.selo', grupo: 'Encontros', rotulo: 'Selo acima do título (opcional)', padrao: '' },
  { chave: 'eventos.imagem', grupo: 'Encontros', rotulo: 'Imagem da abertura (opcional)', padrao: '', tipo: 'imagem' },
  { chave: 'planos.selo', grupo: 'Planos', rotulo: 'Selo acima do título (opcional)', padrao: '' },
  { chave: 'planos.imagem', grupo: 'Planos', rotulo: 'Imagem da abertura (opcional)', padrao: '', tipo: 'imagem' },
  { chave: 'academy.selo', grupo: 'Academy', rotulo: 'Selo acima do título (opcional)', padrao: '' },
  { chave: 'academy.imagem', grupo: 'Academy', rotulo: 'Imagem da abertura (opcional)', padrao: '', tipo: 'imagem' },
  { chave: 'blog.selo', grupo: 'Blog Convergindo', rotulo: 'Selo acima do título (opcional)', padrao: '' },
  { chave: 'blog.imagem', grupo: 'Blog Convergindo', rotulo: 'Imagem da abertura (opcional)', padrao: '', tipo: 'imagem' },
  { chave: 'embaixadoras.selo', grupo: 'Embaixadoras', rotulo: 'Selo acima do título (opcional)', padrao: 'Quem faz a rede crescer' },
  { chave: 'embaixadoras.imagem', grupo: 'Embaixadoras', rotulo: 'Imagem da abertura (opcional)', padrao: '', tipo: 'imagem' },
  { chave: 'academy.titulo', grupo: 'Academy', rotulo: 'Título da página', padrao: 'Academy' },
  { chave: 'academy.subtitulo', grupo: 'Academy', rotulo: 'Texto de apoio', padrao: 'Conteúdo prático para fazer seu negócio crescer, no seu ritmo.' },
  { chave: 'planos.passo1.titulo', grupo: 'Planos', rotulo: 'Como funciona — passo 1 título', padrao: '1. Crie sua conta' },
  { chave: 'planos.passo1.texto', grupo: 'Planos', rotulo: 'Como funciona — passo 1 texto', padrao: 'Leva um minuto. Só precisamos do seu nome, e-mail e CPF.' },
  { chave: 'planos.passo2.titulo', grupo: 'Planos', rotulo: 'Como funciona — passo 2 título', padrao: '2. Escolha e pague' },
  { chave: 'planos.passo2.texto', grupo: 'Planos', rotulo: 'Como funciona — passo 2 texto', padrao: 'Pix, boleto ou cartão. Escolha mensal, semestral ou anual.' },
  { chave: 'planos.passo3.titulo', grupo: 'Planos', rotulo: 'Como funciona — passo 3 título', padrao: '3. Tudo liberado' },
  { chave: 'planos.passo3.texto', grupo: 'Planos', rotulo: 'Como funciona — passo 3 texto', padrao: 'Com o pagamento confirmado, as áreas do plano abrem sozinhas na sua Minha Área.' },
  { chave: 'planos.faq.titulo', grupo: 'Planos', rotulo: 'Título das perguntas frequentes', padrao: 'Perguntas frequentes' },
  { chave: 'embaixadoras.titulo', grupo: 'Embaixadoras', rotulo: 'Título da página', padrao: 'Nossas Embaixadoras' },
  { chave: 'embaixadoras.subtitulo', grupo: 'Embaixadoras', rotulo: 'Texto de apoio', padrao: 'Cada nova associada que chega à rede tem por trás uma mulher que acreditou e compartilhou. Elas abrem portas, fazem pontes e espalham o Mulheres em Convergência por todo o Brasil.' },

  { chave: 'embaixadoras.programa.titulo', grupo: 'Embaixadoras', rotulo: 'Como funciona — título', padrao: 'Como funciona o programa' },
  { chave: 'embaixadoras.passo1.titulo', grupo: 'Embaixadoras', rotulo: 'Passo 1 — título', padrao: 'Ela é convidada' },
  { chave: 'embaixadoras.passo1.texto', grupo: 'Embaixadoras', rotulo: 'Passo 1 — texto', padrao: 'A equipe convida associadas que vivem a rede e querem levá-la mais longe.' },
  { chave: 'embaixadoras.passo2.titulo', grupo: 'Embaixadoras', rotulo: 'Passo 2 — título', padrao: 'Ela compartilha' },
  { chave: 'embaixadoras.passo2.texto', grupo: 'Embaixadoras', rotulo: 'Passo 2 — texto', padrao: 'Recebe campanhas prontas e um link próprio para indicar novas empreendedoras.' },
  { chave: 'embaixadoras.passo3.titulo', grupo: 'Embaixadoras', rotulo: 'Passo 3 — título', padrao: 'A rede cresce' },
  { chave: 'embaixadoras.passo3.texto', grupo: 'Embaixadoras', rotulo: 'Passo 3 — texto', padrao: 'Cada indicação que vira associada é reconhecida e valorizada pela comunidade.' },
  { chave: 'embaixadoras.cta.texto', grupo: 'Embaixadoras', rotulo: 'Chamada final — texto', padrao: 'Quer fazer parte dessa rede de mulheres que fazem acontecer?' },
  { chave: 'embaixadoras.cta.botao', grupo: 'Embaixadoras', rotulo: 'Chamada final — botão', padrao: 'Conheça os planos' },

  { chave: 'negocio.rotulo_dona', grupo: 'Página do negócio', rotulo: 'Rótulo abaixo do nome da dona', padrao: 'Empreendedora' },
  { chave: 'negocio.titulo_contato', grupo: 'Página do negócio', rotulo: 'Título — contato', padrao: 'Fale com ela' },
  { chave: 'negocio.titulo_comodidades', grupo: 'Página do negócio', rotulo: 'Título — comodidades', padrao: 'Comodidades' },
  { chave: 'negocio.titulo_areas', grupo: 'Página do negócio', rotulo: 'Título — onde atende', padrao: 'Onde atende' },
  { chave: 'negocio.titulo_galeria', grupo: 'Página do negócio', rotulo: 'Título — galeria', padrao: 'Galeria' },

  // Rodapé e topo
  { chave: 'rodape.sobre', grupo: 'Rodapé', rotulo: 'Texto do rodapé', padrao: 'Rede de mulheres empreendedoras: conexão, formação e visibilidade para o seu negócio.' },
  { chave: 'rodape.assinatura', grupo: 'Rodapé', rotulo: 'Assinatura final', padrao: 'Mulheres em Convergência. Todos os direitos reservados.' },
  { chave: 'topo.botao_entrar', grupo: 'Topo do site', rotulo: 'Botão entrar', padrao: 'Entrar' },
  { chave: 'topo.botao_associar', grupo: 'Topo do site', rotulo: 'Botão fazer parte', padrao: 'Fazer parte' },

  // Parceiros e linha do tempo
  { chave: 'parceiros.titulo', grupo: 'Parceiros', rotulo: 'Título da vitrine', padrao: 'Parceiros' },
  { chave: 'parceiros.subtitulo', grupo: 'Parceiros', rotulo: 'Texto de apoio', padrao: 'Quem caminha com a gente.' },
];

export const PADROES_TEXTOS: Record<string, string> = Object.fromEntries(
  CATALOGO_TEXTOS.map((t) => [t.chave, t.padrao])
);
