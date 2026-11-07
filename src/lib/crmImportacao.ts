/**
 * Importador de planilhas do CRM — regras puras (sem banco), testadas em `crmImportacao.test.ts`.
 * A decisão final (criar, completar, conflito) é sempre do banco; aqui só lemos e organizamos as linhas.
 */

export type CampoImportacao =
  | 'nome' | 'email' | 'telefone' | 'cpf' | 'apelido' | 'negocio' | 'observacao' | 'primeiro_contato';

export const CAMPOS_IMPORTACAO: { v: CampoImportacao; r: string; obrigatorio?: boolean }[] = [
  { v: 'nome', r: 'Nome', obrigatorio: true },
  { v: 'email', r: 'E-mail' },
  { v: 'telefone', r: 'WhatsApp / telefone' },
  { v: 'cpf', r: 'CPF' },
  { v: 'apelido', r: 'Apelido / como é chamada' },
  { v: 'negocio', r: 'Negócio / empresa' },
  { v: 'observacao', r: 'Observação' },
  { v: 'primeiro_contato', r: 'Data do primeiro contato' },
];

const SINONIMOS: Record<CampoImportacao, string[]> = {
  nome: ['nome', 'nome completo', 'name', 'participante', 'cliente', 'contato', 'associada'],
  email: ['email', 'e-mail', 'e mail', 'mail', 'correio'],
  telefone: ['telefone', 'whatsapp', 'whats', 'zap', 'celular', 'fone', 'tel', 'phone', 'contato telefonico'],
  cpf: ['cpf', 'documento'],
  apelido: ['apelido', 'nome social', 'como e chamada', 'como prefere ser chamada', 'chamada'],
  negocio: ['negocio', 'empresa', 'marca', 'loja', 'business', 'nome do negocio'],
  observacao: ['observacao', 'observacoes', 'obs', 'nota', 'notas', 'comentario', 'comentarios'],
  primeiro_contato: ['primeiro contato', 'data', 'data de contato', 'data do contato', 'data primeiro contato', 'data de cadastro'],
};

export const normalizarCabecalho = (t: unknown) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[_\-.:/()]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Sugere qual coluna da planilha corresponde a cada campo. Igualdade exata vence; depois "contém". */
export function sugerirMapeamento(cabecalhos: unknown[]): Partial<Record<CampoImportacao, number>> {
  const norm = cabecalhos.map(normalizarCabecalho);
  const usado = new Set<number>();
  const mapa: Partial<Record<CampoImportacao, number>> = {};
  for (const exato of [true, false]) {
    for (const campo of CAMPOS_IMPORTACAO.map((c) => c.v)) {
      if (mapa[campo] !== undefined) continue;
      const i = norm.findIndex((h, idx) => !usado.has(idx) && h && SINONIMOS[campo].some((s) =>
        exato ? h === s : (s.length >= 4 && h.includes(s))));
      if (i >= 0) { mapa[campo] = i; usado.add(i); }
    }
  }
  return mapa;
}

/** Converte data de planilha (Date, número do Excel, dd/mm/aaaa ou aaaa-mm-dd) em AAAA-MM-DD. */
export function dataPlanilha(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const p = (n: number) => String(n).padStart(2, '0');
  const valida = (a: number, m: number, d: number) => {
    const dt = new Date(Date.UTC(a, m - 1, d));
    return a >= 1900 && a <= 2100 && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? `${a}-${p(m)}-${p(d)}` : null;
  };
  if (v instanceof Date && !isNaN(v.getTime())) return valida(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5);
    return valida(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const ano = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
    return valida(ano, Number(m[2]), Number(m[1]));
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return valida(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

export type LinhaImportacao = {
  linha: number; // número da linha na planilha (cabeçalho = 1)
  nome: string; email: string; telefone: string; cpf: string;
  apelido: string; negocio: string; observacao: string; primeiro_contato: string | null;
};

const texto = (v: unknown) => (v instanceof Date ? '' : String(v ?? '')).replace(/\s+/g, ' ').trim();

/** Monta as linhas a partir da planilha (primeira linha = cabeçalho). Linhas totalmente vazias são puladas. */
export function montarLinhas(tabela: unknown[][], mapa: Partial<Record<CampoImportacao, number>>): LinhaImportacao[] {
  const pegar = (r: unknown[], c: CampoImportacao) => (mapa[c] === undefined ? '' : r[mapa[c]!]);
  return tabela.slice(1).map((r, i) => ({
    linha: i + 2,
    nome: texto(pegar(r, 'nome')),
    email: texto(pegar(r, 'email')).toLowerCase(),
    telefone: texto(pegar(r, 'telefone')),
    cpf: texto(pegar(r, 'cpf')),
    apelido: texto(pegar(r, 'apelido')),
    negocio: texto(pegar(r, 'negocio')),
    observacao: texto(pegar(r, 'observacao')).slice(0, 1000),
    primeiro_contato: dataPlanilha(pegar(r, 'primeiro_contato')),
  })).filter((l) => l.nome || l.email || l.telefone || l.cpf);
}

/** Chave de telefone igual à do banco: só números, sem o 55 do Brasil. */
export function chaveTelefone(t: string): string {
  const d = t.replace(/\D/g, '');
  return d.length >= 12 && d.startsWith('55') ? d.slice(2) : d;
}

/** Aponta linhas que repetem e-mail, telefone ou CPF de uma linha anterior da mesma planilha. */
export function repetidasNaPlanilha(linhas: LinhaImportacao[]): Map<number, number> {
  const vistos = new Map<string, number>();
  const rep = new Map<number, number>();
  for (const l of linhas) {
    const chaves = [
      l.email && l.email.includes('@') ? `e:${l.email}` : '',
      chaveTelefone(l.telefone).length >= 10 ? `t:${chaveTelefone(l.telefone)}` : '',
      l.cpf.replace(/\D/g, '').length === 11 ? `c:${l.cpf.replace(/\D/g, '')}` : '',
    ].filter(Boolean);
    const anterior = chaves.map((k) => vistos.get(k)).find((x) => x !== undefined);
    if (anterior !== undefined) rep.set(l.linha, anterior);
    for (const k of chaves) if (!vistos.has(k)) vistos.set(k, l.linha);
  }
  return rep;
}

export function emLotes<T>(itens: T[], tamanho: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) out.push(itens.slice(i, i + tamanho));
  return out;
}

/** Lê CSV com separador automático (vírgula ou ponto e vírgula, comum no Excel brasileiro). */
export async function lerCsv(arquivo: File): Promise<unknown[][]> {
  const Papa = (await import('papaparse')).default;
  const conteudo = await arquivo.text();
  const r = Papa.parse<string[]>(conteudo.replace(/^\uFEFF/, ''), { skipEmptyLines: 'greedy', delimiter: '' });
  return r.data as unknown[][];
}

export async function lerPlanilha(arquivo: File): Promise<unknown[][]> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith('.csv') || nome.endsWith('.txt')) return lerCsv(arquivo);
  if (nome.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser');
    return (await readSheet(arquivo)) as unknown[][];
  }
  throw new Error('Use um arquivo .xlsx (Excel) ou .csv. Arquivos .xls antigos: abra no Excel e salve como .xlsx.');
}
