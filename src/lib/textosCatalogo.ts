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
  tipo?: 'texto' | 'rico';
};

export const CATALOGO_TEXTOS: TextoCatalogo[] = [
  // Página inicial
  { chave: 'home.hero.botao_secundario', grupo: 'Página inicial', rotulo: 'Botão secundário do topo', padrao: 'Ver o diretório' },
  { chave: 'home.negocios.titulo', grupo: 'Página inicial', rotulo: 'Título — negócios da rede', padrao: 'Negócios da rede' },
  { chave: 'home.negocios.subtitulo', grupo: 'Página inicial', rotulo: 'Subtítulo — negócios da rede', padrao: 'Empreendedoras com acesso em dia no diretório.' },
  { chave: 'home.blog.titulo', grupo: 'Página inicial', rotulo: 'Título — blog', padrao: 'Convergindo' },
  { chave: 'home.blog.subtitulo', grupo: 'Página inicial', rotulo: 'Subtítulo — blog', padrao: 'Histórias e aprendizados da nossa rede.' },
  { chave: 'home.cta.titulo', grupo: 'Página inicial', rotulo: 'Chamada final — título', padrao: 'Pronta para fazer parte?' },
  { chave: 'home.cta.subtitulo', grupo: 'Página inicial', rotulo: 'Chamada final — texto', padrao: 'Associe-se e ganhe presença no diretório, formação e encontros.' },
  { chave: 'home.cta.botao', grupo: 'Página inicial', rotulo: 'Chamada final — botão', padrao: 'Conhecer os planos' },

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
