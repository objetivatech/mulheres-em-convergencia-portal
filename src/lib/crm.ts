/**
 * CRM MeC Conecta — regras puras (sem banco), usadas pelas telas e testadas em `crm.test.ts`.
 * Nada aqui envia mensagem: o WhatsApp só é aberto com o texto pronto para a equipe revisar.
 */

export type Etapa =
  | 'nova' | 'em_conversa' | 'plano_apresentado' | 'aguardando_decisao'
  | 'associada' | 'sem_interesse' | 'perdida';

export const ETAPAS: { v: Etapa; r: string; fechada: boolean }[] = [
  { v: 'nova', r: 'Nova interessada', fechada: false },
  { v: 'em_conversa', r: 'Em conversa', fechada: false },
  { v: 'plano_apresentado', r: 'Plano apresentado', fechada: false },
  { v: 'aguardando_decisao', r: 'Aguardando decisão', fechada: false },
  { v: 'associada', r: 'Associada', fechada: true },
  { v: 'sem_interesse', r: 'Sem interesse', fechada: true },
  { v: 'perdida', r: 'Perdida / encerrada', fechada: true },
];
export const rotuloEtapa = (e?: string | null) => ETAPAS.find((x) => x.v === e)?.r ?? '—';

export const CANAIS = [
  { v: 'whatsapp', r: 'WhatsApp' },
  { v: 'instagram', r: 'Instagram' },
  { v: 'facebook', r: 'Facebook' },
  { v: 'email', r: 'E-mail' },
  { v: 'telefone', r: 'Ligação' },
  { v: 'presencial', r: 'Presencial' },
  { v: 'site', r: 'Site' },
  { v: 'indicacao', r: 'Indicação' },
  { v: 'outro', r: 'Outro' },
];
export const rotuloCanal = (c?: string | null) =>
  c === 'sistema' ? 'Automático' : CANAIS.find((x) => x.v === c)?.r ?? c ?? '—';

export const TIPOS_INTERACAO = [
  { v: 'conversa', r: 'Conversa' },
  { v: 'nota', r: 'Anotação' },
  { v: 'apresentacao', r: 'Apresentei o plano' },
  { v: 'objecao', r: 'Objeção / dúvida' },
  { v: 'follow_up', r: 'Retorno' },
  { v: 'mensagem', r: 'Mensagem enviada' },
];

export const ORIGENS = [
  { v: 'instagram', r: 'Instagram' },
  { v: 'whatsapp', r: 'WhatsApp' },
  { v: 'facebook', r: 'Facebook' },
  { v: 'evento', r: 'Encontro / evento' },
  { v: 'indicacao', r: 'Indicação' },
  { v: 'site', r: 'Site' },
  { v: 'lista_antiga', r: 'Lista antiga' },
  { v: 'outro', r: 'Outro' },
];
export const rotuloOrigem = (o?: string | null) => ORIGENS.find((x) => x.v === o)?.r ?? (o || 'Não informada');

export const TIPOS_ATIVIDADE = [
  { v: 'conversao', r: 'Conversão' },
  { v: 'relacionamento', r: 'Relacionamento' },
  { v: 'ativacao', r: 'Ativação' },
];
export const rotuloTipoAtividade = (t?: string | null) => TIPOS_ATIVIDADE.find((x) => x.v === t)?.r ?? '—';

export const CATEGORIAS_MODELO = [
  { v: 'reconexao', r: 'Reconexão' },
  { v: 'diagnostico', r: 'Diagnóstico' },
  { v: 'apresentacao', r: 'Apresentação' },
  { v: 'objecao', r: 'Objeções' },
  { v: 'follow_up', r: 'Retorno' },
  { v: 'aniversario', r: 'Aniversário' },
  { v: 'boas_vindas', r: 'Boas-vindas' },
  { v: 'convite_evento', r: 'Convite para encontro' },
  { v: 'outro', r: 'Outro' },
];

export const CANAIS_CONSENTIMENTO = [
  { v: 'whatsapp', r: 'WhatsApp' },
  { v: 'email_comercial', r: 'E-mail comercial' },
  { v: 'telefone', r: 'Ligação' },
];

/** Telefone para o link do WhatsApp: só números, com 55 do Brasil. Nulo quando incompleto. */
export function telefoneWhatsApp(valor?: string | null): string | null {
  const d = (valor ?? '').replace(/\D/g, '');
  if (!d) return null;
  if (d.length >= 12 && d.startsWith('55')) return d.length <= 13 ? d : null;
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return null;
}

export function linkWhatsApp(telefone?: string | null, texto = ''): string | null {
  const n = telefoneWhatsApp(telefone);
  if (!n) return null;
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

/**
 * Onde abrir o WhatsApp no computador. O WhatsApp Web não permite que outro site reaproveite a aba
 * já aberta (ele isola a própria janela), então a opção "app" abre o aplicativo instalado, sem novas abas.
 * No celular sempre usamos o link universal (wa.me), que abre o aplicativo do aparelho.
 */
export type ModoWhatsApp = 'web' | 'app';

export function linkWhatsAppModo(
  telefone: string | null | undefined, texto: string, modo: ModoWhatsApp, celular: boolean,
): string | null {
  const n = telefoneWhatsApp(telefone);
  if (!n) return null;
  if (celular) return linkWhatsApp(telefone, texto);
  const q = `phone=${n}${texto ? `&text=${encodeURIComponent(texto)}` : ''}`;
  return modo === 'app' ? `whatsapp://send?${q}` : `https://web.whatsapp.com/send?${q}`;
}

export function primeiroNome(nome?: string | null): string {
  const p = (nome ?? '').trim().split(/\s+/)[0] ?? '';
  if (!p) return '';
  return p.charAt(0).toLocaleUpperCase('pt-BR') + p.slice(1).toLocaleLowerCase('pt-BR');
}

/** Troca {primeiro_nome} e {nome}. Usa o nome preferido quando houver. */
export function preencherModelo(texto: string, pessoa: { nome?: string | null; nome_social?: string | null }): string {
  const base = pessoa.nome_social?.trim() || pessoa.nome || '';
  return texto
    .replace(/\{primeiro_nome\}/g, primeiroNome(base))
    .replace(/\{nome\}/g, base.trim());
}

export function mascararCpf(cpf?: string | null): string {
  const d = (cpf ?? '').replace(/\D/g, '');
  if (d.length !== 11) return '—';
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

export type SituacaoTarefa = 'concluida' | 'cancelada' | 'atrasada' | 'hoje' | 'futura';

/** Situação da tarefa calculada na hora (nada gravado). "Hoje" segue o dia local de quem usa. */
export function situacaoTarefa(
  t: { vence_em: string; concluida_em?: string | null; cancelada_em?: string | null },
  agora: Date = new Date(),
): SituacaoTarefa {
  if (t.concluida_em) return 'concluida';
  if (t.cancelada_em) return 'cancelada';
  const vence = new Date(t.vence_em);
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const fimHoje = new Date(inicioHoje.getTime() + 24 * 60 * 60 * 1000);
  if (vence < inicioHoje) return 'atrasada';
  if (vence < fimHoje) return 'hoje';
  return 'futura';
}

/** Aniversário a partir da data de nascimento (AAAA-MM-DD), sem fuso. */
export function aniversario(dataNascimento?: string | null, agora: Date = new Date()): 'hoje' | 'mes' | null {
  if (!dataNascimento) return null;
  const [, m, d] = dataNascimento.slice(0, 10).split('-').map(Number);
  if (!m || !d) return null;
  if (m !== agora.getMonth() + 1) return null;
  return d === agora.getDate() ? 'hoje' : 'mes';
}

/** Dias inteiros desde uma data (para "sem contato há X dias"). */
export function diasDesde(iso?: string | null, agora: Date = new Date()): number | null {
  if (!iso) return null;
  return Math.floor((agora.getTime() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

/** Situação atual de consentimento por canal: vale o registro mais recente. */
export function consentimentoAtual(
  registros: { canal: string; situacao: string; registrado_em: string }[],
  canal: string,
): 'autorizado' | 'recusado' | null {
  const r = registros
    .filter((x) => x.canal === canal)
    .sort((a, b) => b.registrado_em.localeCompare(a.registrado_em))[0];
  return (r?.situacao as any) ?? null;
}
