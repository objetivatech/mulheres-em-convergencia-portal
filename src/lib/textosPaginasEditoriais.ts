/**
 * Conteúdo padrão das páginas editoriais (Elisângela Aranda, Nossa história e Manifesto).
 * Tudo aqui é editável no Editor de páginas; o padrão é o texto original do site.
 */
import type { TextoCatalogo } from './textosCatalogo';

const E = 'Página da Elisângela';
const S = 'Nossa história (Sobre)';
const M = 'Manifesto';
const F = '/assets/elisangela/';

export const TEXTOS_EDITORIAIS: TextoCatalogo[] = [
  // Elisângela
  { chave: 'elis.titulo', grupo: E, rotulo: 'Topo — nome', padrao: 'Elisângela Aranda' },
  { chave: 'elis.subtitulo', grupo: E, rotulo: 'Topo — descrição', padrao: 'Empreendedora social, educadora e fundadora do Mulheres em Convergência' },
  { chave: 'elis.capa', grupo: E, rotulo: 'Topo — foto de capa', padrao: `${F}IMG_20251219_120518.jpg`, tipo: 'imagem' },
  { chave: 'elis.abertura', grupo: E, rotulo: 'Frase de abertura', padrao: 'Sou Elisângela Martins Aranda. Mãe de duas, empreendedora social, educadora e uma mulher movida por um otimismo teimoso e por uma resiliência construída na prática da vida.' },
  { chave: 'elis.bloco1.texto', grupo: E, rotulo: 'Bloco 1 — texto', padrao: 'Minha história profissional começa cedo. Aos 14 anos, iniciei minha trajetória na construção civil, um ambiente majoritariamente masculino, onde aprendi disciplina, responsabilidade, organização e, sobretudo, a importância do trabalho bem feito. Ao longo dos anos, atuei em áreas operacionais, técnicas e administrativas, acumulando uma visão prática e realista sobre processos, gestão e pessoas. Essa vivência moldou meu olhar para os negócios: pé no chão, foco em soluções e respeito pela trajetória de cada pessoa.\n\nMas foi em 2017 que algo mudou profundamente. Senti que precisava fazer uma transição — não apenas de carreira, mas de propósito. Passei a atuar como multiplicadora e facilitadora de conteúdos para mulheres, especialmente aquelas que empreendem por necessidade, que carregam a responsabilidade do sustento familiar e que raramente tiveram acesso à educação empreendedora. Ali, me reconheci. Ali, encontrei sentido.' },
  { chave: 'elis.bloco1.foto', grupo: E, rotulo: 'Bloco 1 — foto', padrao: `${F}IMG_20200510_114436.jpg`, tipo: 'imagem' },
  { chave: 'elis.bloco2.texto', grupo: E, rotulo: 'Bloco 2 — texto', padrao: 'Desde então, venho unindo minha experiência prática com estudos em gestão de negócios, planejamento estratégico, marketing e liderança, oferecendo mentorias, formações, oficinas e consultorias, tanto de forma remunerada quanto voluntária. Atuei e sigo atuando em programas e iniciativas de impacto social, como a Rede Mulher Empreendedora e a Aliança Empreendedora, além de projetos executados em parceria com o IF Alvorada.\n\nTambém tive uma experiência marcante na Rádio Comunitária Acácia FM 87.9, onde, entre 2014 e 2019, apresentei e produzi programas voltados à comunidade, ampliando vozes e fortalecendo narrativas locais.\n\nSou Tecnóloga em Processos Gerenciais, com formação técnica em Edificações, e atuo há mais de cinco anos diretamente com empreendedorismo popular, lideranças femininas e desenvolvimento de pequenos negócios. Minha atuação é atravessada pelo terceiro setor, pelo voluntariado e pela construção de redes de apoio comunitário, porque acredito que ninguém cresce sozinho — e que o acesso ao conhecimento transforma realidades.' },
  { chave: 'elis.bloco2.foto', grupo: E, rotulo: 'Bloco 2 — foto', padrao: `${F}IMG_20241109_075240.jpg`, tipo: 'imagem' },
  { chave: 'elis.bloco3.texto', grupo: E, rotulo: 'Bloco 3 — texto', padrao: 'Ao longo dessa caminhada, idealizei e conduzi projetos como Motiva Artesão e Construindo Trajetórias, voltados ao empreendedorismo colaborativo e feminino em Alvorada (RS). Em 2023, atuei como diretora social da Associação Arecuja, reforçando meu compromisso com impacto social estruturado e contínuo.\n\nSou fundadora da A Confraria Networking, um espaço que nasce com um princípio claro: educação empreendedora como instrumento de ascensão social e desenvolvimento pessoal. Na Confraria, não buscamos apenas clientes — buscamos parceiras. Mulheres que desejam crescer juntas, criar soluções personalizadas e fortalecer seus negócios sem abrir mão da sua essência.\n\nDesse movimento nasceu também o Mulheres em Convergência — um programa educativo voltado especialmente para mulheres chefes de domicílio, que une capacitação em negócios, impacto comunitário, pertencimento e rede. Além disso, idealizei e organizo eventos como o Happy Hour Conecta, encontros de networking que promovem conexões reais, trocas honestas e oportunidades concretas entre mulheres empreendedoras.' },
  { chave: 'elis.bloco3.foto', grupo: E, rotulo: 'Bloco 3 — foto', padrao: `${F}IMG_20241218_192057.jpg`, tipo: 'imagem' },
  { chave: 'elis.citacao', grupo: E, rotulo: 'Citação em destaque (deixe vazio para esconder)', padrao: 'Um ambiente de networking onde o feminino pode se manifestar de forma livre é radicalmente transformador.' },
  { chave: 'elis.bloco4.texto', grupo: E, rotulo: 'Bloco 4 — texto', padrao: 'Meu propósito de vida é despertar a essência das empreendedoras, fortalecer o potencial que cada mulher já carrega e oferecer ferramentas práticas para que elas criem, sustentem e expandam seus negócios com autonomia, consciência e dignidade. Trabalho para que mulheres deixem de apenas "tentar sobreviver" empreendendo e passem a construir trajetórias sólidas, possíveis e prósperas.' },
  { chave: 'elis.bloco4.foto', grupo: E, rotulo: 'Bloco 4 — foto', padrao: `${F}IMG_20250816_121548.jpg`, tipo: 'imagem' },
  { chave: 'elis.final.titulo', grupo: E, rotulo: 'Encerramento — frase lema', padrao: 'Sou artesã de coração, educadora por vocação e empreendedora por convicção.' },
  { chave: 'elis.final.texto', grupo: E, rotulo: 'Encerramento — texto', padrao: 'Acredito na educação como ponte, na coletividade como força e no empreendedorismo feminino como motor de transformação social.' },
  { chave: 'elis.final.assinatura', grupo: E, rotulo: 'Encerramento — frase final', padrao: 'Essa não é apenas a minha biografia. É a história de um propósito que segue em movimento.' },

  // Sobre
  { chave: 'sobre.selo', grupo: S, rotulo: 'Topo — selo', padrao: 'Quem somos' },
  { chave: 'sobre.titulo', grupo: S, rotulo: 'Topo — título', padrao: 'Nossa história' },
  { chave: 'sobre.subtitulo', grupo: S, rotulo: 'Topo — texto', padrao: 'Conheça a jornada do Mulheres em Convergência e como estamos transformando vidas através do empreendedorismo feminino.' },
  { chave: 'sobre.imagem', grupo: S, rotulo: 'Topo — foto (opcional)', padrao: '', tipo: 'imagem' },
  { chave: 'sobre.intro', grupo: S, rotulo: 'Texto de abertura', padrao: 'O Mulheres em Convergência nasceu da percepção de que mulheres empreendedoras precisam de mais do que apenas conhecimento técnico para prosperar em seus negócios. Elas precisam de uma rede de apoio, de conexões significativas e de um espaço seguro para crescer.' },
  { chave: 'sobre.pilar1.titulo', grupo: S, rotulo: 'Pilar 1 — título', padrao: 'Conectar' },
  { chave: 'sobre.pilar1.texto', grupo: S, rotulo: 'Pilar 1 — texto', padrao: 'Criamos pontes entre mulheres empreendedoras, facilitando networking e parcerias estratégicas.' },
  { chave: 'sobre.pilar2.titulo', grupo: S, rotulo: 'Pilar 2 — título', padrao: 'Educar' },
  { chave: 'sobre.pilar2.texto', grupo: S, rotulo: 'Pilar 2 — texto', padrao: 'Oferecemos conteúdo de qualidade, workshops e mentorias para desenvolver habilidades empreendedoras.' },
  { chave: 'sobre.pilar3.titulo', grupo: S, rotulo: 'Pilar 3 — título', padrao: 'Impulsionar' },
  { chave: 'sobre.pilar3.texto', grupo: S, rotulo: 'Pilar 3 — texto', padrao: 'Apoiamos o crescimento dos negócios através de ferramentas, recursos e oportunidades únicas.' },
  { chave: 'sobre.impacto', grupo: S, rotulo: 'Frase de impacto coletivo', padrao: 'Nosso projeto tem como base a crença de que quando uma mulher prospera, toda a comunidade se beneficia. Por isso, focamos não apenas no sucesso individual, mas no impacto coletivo que essas empreendedoras podem gerar.' },
  { chave: 'sobre.valores.titulo', grupo: S, rotulo: 'Valores — título', padrao: 'Nossos valores' },
  { chave: 'sobre.valor1.titulo', grupo: S, rotulo: 'Valor 1 — título', padrao: 'Sororidade' },
  { chave: 'sobre.valor1.texto', grupo: S, rotulo: 'Valor 1 — texto', padrao: 'Acreditamos na força da união feminina e no apoio mútuo como pilares fundamentais para o crescimento coletivo.' },
  { chave: 'sobre.valor2.titulo', grupo: S, rotulo: 'Valor 2 — título', padrao: 'Empoderamento' },
  { chave: 'sobre.valor2.texto', grupo: S, rotulo: 'Valor 2 — texto', padrao: 'Fornecemos ferramentas e conhecimento para que cada mulher possa tomar as rédeas de sua vida profissional e pessoal.' },
  { chave: 'sobre.valor3.titulo', grupo: S, rotulo: 'Valor 3 — título', padrao: 'Inovação' },
  { chave: 'sobre.valor3.texto', grupo: S, rotulo: 'Valor 3 — texto', padrao: 'Buscamos constantemente novas formas de conectar, educar e impulsionar mulheres empreendedoras.' },
  { chave: 'sobre.valor4.titulo', grupo: S, rotulo: 'Valor 4 — título', padrao: 'Impacto social' },
  { chave: 'sobre.valor4.texto', grupo: S, rotulo: 'Valor 4 — texto', padrao: 'Nosso objetivo vai além do sucesso individual — buscamos transformar comunidades inteiras.' },
  { chave: 'sobre.fundadora.titulo', grupo: S, rotulo: 'Fundadora — título', padrao: 'Conheça nossa fundadora' },
  { chave: 'sobre.fundadora.texto', grupo: S, rotulo: 'Fundadora — texto', padrao: 'Elisângela Aranda: artesã de coração, educadora por vocação e empreendedora por convicção.' },
  { chave: 'sobre.fundadora.foto', grupo: S, rotulo: 'Fundadora — foto', padrao: `${F}IMG_20251219_120518.jpg`, tipo: 'imagem' },

  // Manifesto (texto provisório até a versão oficial)
  { chave: 'manifesto.selo', grupo: M, rotulo: 'Topo — selo', padrao: 'Manifesto' },
  { chave: 'manifesto.titulo', grupo: M, rotulo: 'Topo — título', padrao: 'No que acreditamos' },
  { chave: 'manifesto.subtitulo', grupo: M, rotulo: 'Topo — texto', padrao: 'Um chamado para mulheres que empreendem e escolhem crescer juntas.' },
  { chave: 'manifesto.imagem', grupo: M, rotulo: 'Topo — foto (opcional)', padrao: '', tipo: 'imagem' },
  { chave: 'manifesto.p1', grupo: M, rotulo: 'Parágrafo 1', padrao: 'Acreditamos que nenhuma mulher deveria empreender sozinha.' },
  { chave: 'manifesto.p2', grupo: M, rotulo: 'Parágrafo 2', padrao: 'Acreditamos que conhecimento prático abre portas que a necessidade, sozinha, não abre.' },
  { chave: 'manifesto.p3', grupo: M, rotulo: 'Parágrafo 3', padrao: 'Acreditamos que, quando uma mulher prospera, a comunidade inteira prospera com ela.' },
  { chave: 'manifesto.p4', grupo: M, rotulo: 'Parágrafo 4 (deixe vazio para esconder)', padrao: 'Acreditamos em rede, em sororidade e em negócios que sustentam vidas com dignidade.' },
  { chave: 'manifesto.p5', grupo: M, rotulo: 'Parágrafo 5 (deixe vazio para esconder)', padrao: '' },
  { chave: 'manifesto.p6', grupo: M, rotulo: 'Parágrafo 6 (deixe vazio para esconder)', padrao: '' },
  { chave: 'manifesto.assinatura', grupo: M, rotulo: 'Assinatura', padrao: 'Mulheres em Convergência' },
];
