/**
 * Tamanho ideal de cada campo de imagem do site.
 * Mostrado junto ao botão de envio para orientar equipe e associadas.
 * Imagens de outro tamanho continuam funcionando: o site recorta sem distorcer.
 */
export type DicaImagem = { tamanho: string; formato: string };

const POR_CHAVE: Record<string, DicaImagem> = {
  'home.hero.imagem': { tamanho: '900 × 1150 px', formato: 'vertical' },
  'home.porque.imagem': { tamanho: '1280 × 850 px', formato: 'horizontal' },
  'home.depoimento.foto': { tamanho: '400 × 400 px', formato: 'quadrada' },
};

const POR_PREFIXO: [RegExp, DicaImagem][] = [
  [/^diretorio\.ods\d+\.imagem$/, { tamanho: '300 × 300 px', formato: 'quadrada' }],
  [/\.imagem$/, { tamanho: '1200 × 900 px', formato: 'horizontal' }],
];

const POR_PASTA: Record<string, DicaImagem> = {
  'blog-images': { tamanho: '1200 × 630 px', formato: 'horizontal' },
  negocios: { tamanho: '1200 × 675 px', formato: 'horizontal' },
  'negocios-logo': { tamanho: '400 × 400 px', formato: 'quadrada' },
  'negocios-galeria': { tamanho: '1200 × 900 px', formato: 'horizontal' },
  'negocios-produtos': { tamanho: '800 × 800 px', formato: 'quadrada' },
  'partner-logos': { tamanho: '400 × 200 px', formato: 'horizontal, fundo transparente' },
  'linha-do-tempo': { tamanho: '1200 × 800 px', formato: 'horizontal' },
  'blog-autores': { tamanho: '400 × 400 px', formato: 'quadrada' },
  perfis: { tamanho: '400 × 400 px', formato: 'quadrada' },
  academy: { tamanho: '1200 × 675 px', formato: 'horizontal' },
  'embaixadoras-campanhas': { tamanho: '1080 × 1080 px', formato: 'quadrada (ideal para redes sociais)' },
  depoimentos: { tamanho: '400 × 400 px', formato: 'quadrada' },
  site: { tamanho: '1200 × 900 px', formato: 'horizontal' },
};

export function dicaImagem(opts: { chave?: string; pasta?: string; conter?: boolean }): DicaImagem | null {
  if (opts.chave) {
    if (POR_CHAVE[opts.chave]) return POR_CHAVE[opts.chave];
    const achado = POR_PREFIXO.find(([re]) => re.test(opts.chave!));
    if (achado) return achado[1];
  }
  if (opts.conter && opts.pasta === 'negocios') return POR_PASTA['negocios-logo'];
  return (opts.pasta && POR_PASTA[opts.pasta]) || null;
}

export function textoDica(d: DicaImagem | null) {
  return d ? `Tamanho ideal: ${d.tamanho} (${d.formato}). Outros tamanhos são ajustados sem distorcer.` : '';
}
