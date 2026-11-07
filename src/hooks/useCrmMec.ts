/**
 * CRM MeC Conecta — acesso a dados. Toda permissão é imposta no banco (RLS `e_admin()`);
 * cadastros sensíveis (pessoa provisória, contato extra) passam por funções que checam a administração.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;
const erro = (e: any) => { if (e) throw e; };

export type PessoaCrm = {
  pessoa_id: string; nome: string; nome_social: string | null; cpf_mascarado: string | null;
  email: string | null; telefone: string | null; apelidos: string[]; papeis: string[];
  assinante: boolean; conta_site: boolean; origem: string | null; primeiro_contato_em: string | null;
  oportunidade_id: string | null; etapa: string | null; proxima_tarefa_em: string | null;
  ultima_interacao_em: string | null; criado_em: string;
};

const PESSOA = 'pessoa:pessoas!{t}_pessoa_id_fkey(id, nome, nome_social)';
const comPessoa = (tabela: string) => PESSOA.replace('{t}', tabela);

/* --------------------------------------------------------------- consultas */

export function usePessoasCrm(termo: string) {
  return useQuery({
    queryKey: ['crm', 'pessoas', termo],
    queryFn: async () => {
      const { data, error } = await db.rpc('crm_pessoas', { _termo: termo.trim() || null, _limite: 1000 });
      erro(error);
      return (data ?? []) as PessoaCrm[];
    },
  });
}

export function useSemelhantes(f: { nome?: string; email?: string; telefone?: string; cpf?: string }) {
  const ativo = (f.nome?.trim().length ?? 0) >= 3 || !!f.email?.includes('@') || (f.telefone?.replace(/\D/g, '').length ?? 0) >= 10 || (f.cpf?.replace(/\D/g, '').length ?? 0) === 11;
  return useQuery({
    queryKey: ['crm', 'semelhantes', f],
    enabled: ativo,
    queryFn: async () => {
      const { data, error } = await db.rpc('crm_semelhantes', {
        _nome: f.nome || null, _email: f.email || null, _telefone: f.telefone || null, _cpf: f.cpf || null,
      });
      erro(error);
      return (data ?? []) as { pessoa_id: string; nome: string; motivo: string }[];
    },
  });
}

export function useFichaCrm(pessoaId?: string) {
  return useQuery({
    queryKey: ['crm', 'ficha', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const id = pessoaId!;
      const [pessoa, perfil, contatos, ficha, apelidos, consent, oport, interacoes, atividades, inscricoes, negocios, vinculos, pagamentos, linha] = await Promise.all([
        db.from('pessoas').select('id, nome, nome_social, cpf, data_nascimento, auth_user_id, criado_em, instagram, linkedin, site, ultimo_acesso_em').eq('id', id).maybeSingle(),
        db.from('v_meu_perfil').select('papeis, acesso_diretorio, acesso_conecta, acesso_academy, acesso_embaixadora').eq('pessoa_id', id).maybeSingle(),
        db.from('pessoa_contatos').select('id, tipo, valor, principal, verificado_em, criado_em').eq('pessoa_id', id).order('principal', { ascending: false }).order('criado_em'),
        db.from('crm_fichas').select('*').eq('pessoa_id', id).maybeSingle(),
        db.from('crm_apelidos').select('id, apelido').eq('pessoa_id', id).order('apelido'),
        db.from('crm_consentimentos').select('id, canal, situacao, origem, registrado_em').eq('pessoa_id', id).order('registrado_em', { ascending: false }),
        db.from('crm_oportunidades').select('*, plano:planos(id, nome)').eq('pessoa_id', id).order('criado_em', { ascending: false }),
        db.from('crm_interacoes').select('*').eq('pessoa_id', id).order('ocorrido_em', { ascending: false }).limit(300),
        db.from('crm_atividades').select('*').eq('pessoa_id', id).order('vence_em'),
        db.from('evento_inscricoes').select('id, situacao, valor_centavos, criado_em, evento:eventos(id, titulo, inicio_em, online, gratuito), presencas:evento_presencas(registrado_em)').eq('pessoa_id', id).order('criado_em', { ascending: false }),
        db.from('negocios').select('id, nome, slug, publicado').eq('pessoa_id', id),
        db.from('crm_negocio_vinculos').select('id, papel, negocio:negocios(id, nome, slug, publicado)').eq('pessoa_id', id),
        db.from('pagamentos').select('id, descricao, valor_centavos, situacao, confirmado_em, criado_em, plano:planos(nome)').eq('pessoa_id', id).order('criado_em', { ascending: false }),
        db.from('v_linha_tempo').select('*').eq('pessoa_id', id).order('ocorrido_em', { ascending: false }).limit(150),
      ]);
      erro(pessoa.error);
      return {
        pessoa: pessoa.data as any,
        perfil: (perfil.data ?? {}) as any,
        contatos: (contatos.data ?? []) as any[],
        ficha: ficha.data as any,
        apelidos: (apelidos.data ?? []) as any[],
        consentimentos: (consent.data ?? []) as any[],
        oportunidades: (oport.data ?? []) as any[],
        interacoes: (interacoes.data ?? []) as any[],
        atividades: (atividades.data ?? []) as any[],
        inscricoes: (inscricoes.data ?? []) as any[],
        negocios: (negocios.data ?? []) as any[],
        vinculos: (vinculos.data ?? []) as any[],
        pagamentos: (pagamentos.data ?? []) as any[],
        linha: (linha.data ?? []) as any[],
      };
    },
  });
}

export function useAtividades(opcoes: { abertas: boolean }) {
  return useQuery({
    queryKey: ['crm', 'atividades', opcoes],
    queryFn: async () => {
      let q = db.from('crm_atividades').select(`*, ${comPessoa('crm_atividades')}`);
      q = opcoes.abertas
        ? q.is('concluida_em', null).is('cancelada_em', null).order('vence_em')
        : q.or('concluida_em.not.is.null,cancelada_em.not.is.null').order('atualizado_em', { ascending: false });
      const { data, error } = await q.limit(1000);
      erro(error);
      return (data ?? []) as any[];
    },
  });
}

export function useOportunidades() {
  return useQuery({
    queryKey: ['crm', 'oportunidades'],
    queryFn: async () => {
      const { data, error } = await db
        .from('crm_oportunidades')
        .select(`*, ${comPessoa('crm_oportunidades')}, plano:planos(id, nome)`)
        .order('atualizado_em', { ascending: false })
        .limit(1000);
      erro(error);
      return (data ?? []) as any[];
    },
  });
}

export function useAgendaHoje() {
  return useQuery({
    queryKey: ['crm', 'agenda'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const em7 = new Date(Date.now() + 7 * 864e5).toISOString();
      const [atividades, aniversarios, oportunidades, participantes, eventos] = await Promise.all([
        db.from('crm_atividades').select(`*, ${comPessoa('crm_atividades')}`)
          .is('concluida_em', null).is('cancelada_em', null).lte('vence_em', em7).order('vence_em').limit(500),
        db.from('pessoas').select('id, nome, nome_social, data_nascimento').not('data_nascimento', 'is', null).limit(5000),
        db.from('crm_oportunidades').select(`id, etapa, atualizado_em, fechada_em, valor_centavos, proxima_acao, ${comPessoa('crm_oportunidades')}`).limit(2000),
        db.rpc('participantes_eventos'),
        db.from('eventos').select('id, titulo, inicio_em, online, cidade').eq('publicado', true).gte('inicio_em', new Date().toISOString()).order('inicio_em').limit(3),
      ]);
      erro(atividades.error);
      return {
        atividades: (atividades.data ?? []) as any[],
        aniversarios: (aniversarios.data ?? []) as any[],
        oportunidades: (oportunidades.data ?? []) as any[],
        participantes: (participantes.data ?? []) as any[],
        eventos: (eventos.data ?? []) as any[],
      };
    },
  });
}

export function useModelos(somenteAtivos = false) {
  return useQuery({
    queryKey: ['crm', 'modelos', somenteAtivos],
    queryFn: async () => {
      let q = db.from('crm_modelos_mensagem').select('*').order('ordem').order('titulo');
      if (somenteAtivos) q = q.eq('ativo', true);
      const { data, error } = await q;
      erro(error);
      return (data ?? []) as any[];
    },
  });
}

export function usePlanosParaCrm() {
  return useQuery({
    queryKey: ['crm', 'planos'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await db.from('planos').select('id, nome, valor_centavos, ativo').order('ordem');
      return (data ?? []) as any[];
    },
  });
}

export function useNegociosParaVinculo() {
  return useQuery({
    queryKey: ['crm', 'negocios-lista'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await db.from('negocios').select('id, nome').order('nome').limit(2000);
      return (data ?? []) as any[];
    },
  });
}

/* --------------------------------------------------------------- ações */

function useAcao<T>(fn: (v: T) => Promise<any>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });
}

export const useCriarPessoa = () =>
  useAcao(async (v: {
    nome: string; email?: string; telefone?: string; cpf?: string; apelido?: string;
    origem?: string; primeiro_contato_em?: string | null; observacao?: string;
  }) => {
    const { data, error } = await db.rpc('crm_criar_pessoa', {
      _nome: v.nome, _email: v.email || null, _telefone: v.telefone || null, _cpf: v.cpf || null,
      _apelido: v.apelido || null, _origem: v.origem || null,
      _primeiro_contato_em: v.primeiro_contato_em || null, _observacao: v.observacao || null,
    });
    erro(error);
    return data as string;
  });

export const useAtualizarPessoa = () =>
  useAcao(async ({ id, valores }: { id: string; valores: { nome_social?: string | null; data_nascimento?: string | null } }) => {
    const { error } = await db.from('pessoas').update(valores).eq('id', id);
    erro(error);
  });

export const useSalvarFicha = () =>
  useAcao(async (v: { pessoa_id: string; origem?: string | null; origem_detalhe?: string | null; primeiro_contato_em?: string | null; observacoes?: string | null }) => {
    const { error } = await db.from('crm_fichas').upsert(v, { onConflict: 'pessoa_id' });
    erro(error);
  });

export const useAdicionarContato = () =>
  useAcao(async (v: { pessoa_id: string; tipo: 'email' | 'telefone' | 'whatsapp'; valor: string; principal?: boolean }) => {
    const { error } = await db.rpc('crm_adicionar_contato', {
      _pessoa_id: v.pessoa_id, _tipo: v.tipo, _valor: v.valor, _principal: !!v.principal,
    });
    erro(error);
  });

export const useApelido = () =>
  useAcao(async (v: { acao: 'incluir'; pessoa_id: string; apelido: string } | { acao: 'remover'; id: string }) => {
    if (v.acao === 'incluir') {
      const { error } = await db.from('crm_apelidos').insert({ pessoa_id: v.pessoa_id, apelido: v.apelido.trim(), origem: 'crm' });
      erro(error);
    } else {
      const { error } = await db.from('crm_apelidos').delete().eq('id', v.id);
      erro(error);
    }
  });

export const useRegistrarConsentimento = () =>
  useAcao(async (v: { pessoa_id: string; canal: string; situacao: 'autorizado' | 'recusado'; origem?: string }) => {
    const { error } = await db.from('crm_consentimentos').insert({ ...v, origem: v.origem ?? 'registrado pela equipe' });
    erro(error);
  });

export const useRegistrarInteracao = () =>
  useAcao(async (v: {
    pessoa_id: string; oportunidade_id?: string | null; canal: string; tipo: string;
    resumo: string; objecao?: string | null; ocorrido_em?: string;
  }) => {
    const { error } = await db.from('crm_interacoes').insert({
      ...v, oportunidade_id: v.oportunidade_id || null, objecao: v.objecao || null,
      ocorrido_em: v.ocorrido_em || new Date().toISOString(),
    });
    erro(error);
  });

export const useSalvarAtividade = () =>
  useAcao(async ({ id, valores }: { id?: string; valores: Record<string, any> }) => {
    if (id) {
      const { error } = await db.from('crm_atividades').update(valores).eq('id', id);
      erro(error);
    } else {
      const { error } = await db.from('crm_atividades').insert(valores);
      erro(error);
    }
  });

/** Regras automáticas do funil: criam uma única tarefa por oportunidade, sem duplicar. */
const TAREFA_AUTOMATICA: Record<string, { titulo: string; tipo: string; dias: number }> = {
  plano_apresentado: { titulo: 'Retornar sobre o plano apresentado', tipo: 'conversao', dias: 3 },
  associada: { titulo: 'Dar boas-vindas e ajudar a completar o perfil', tipo: 'ativacao', dias: 1 },
};

export const useSalvarOportunidade = () =>
  useAcao(async ({ id, valores }: { id?: string; valores: Record<string, any> }) => {
    let registro: any;
    if (id) {
      const { data, error } = await db.from('crm_oportunidades').update(valores).eq('id', id).select().single();
      erro(error);
      registro = data;
    } else {
      const { data, error } = await db.from('crm_oportunidades').insert(valores).select().single();
      if (error?.code === '23505') throw new Error('Esta pessoa já tem uma oportunidade aberta. Abra a ficha e mude a etapa dela.');
      erro(error);
      registro = data;
    }
    const regra = valores.etapa ? TAREFA_AUTOMATICA[valores.etapa] : undefined;
    if (regra && registro) {
      const { data: existe } = await db.from('crm_atividades').select('id')
        .eq('oportunidade_id', registro.id).eq('titulo', regra.titulo).limit(1);
      if (!existe?.length) {
        await db.from('crm_atividades').insert({
          pessoa_id: registro.pessoa_id, oportunidade_id: registro.id, titulo: regra.titulo, tipo: regra.tipo,
          vence_em: new Date(Date.now() + regra.dias * 864e5).toISOString(),
        });
      }
    }
    return registro;
  });

export const useSalvarModelo = () =>
  useAcao(async ({ id, valores }: { id?: string; valores: Record<string, any> }) => {
    const q = id ? db.from('crm_modelos_mensagem').update(valores).eq('id', id) : db.from('crm_modelos_mensagem').insert(valores);
    const { error } = await q;
    erro(error);
  });

export const useExcluirModelo = () =>
  useAcao(async (id: string) => {
    const { error } = await db.from('crm_modelos_mensagem').delete().eq('id', id);
    erro(error);
  });

/* --------------------------------------------------------------- Fase 2: radar, repetidas, união, importação */

export type LinhaRadar = {
  evento_id: string; evento_titulo: string; evento_inicio: string; evento_online: boolean; evento_tem_portaria: boolean;
  inscricao_id: string; pessoa_id: string | null; nome: string; email: string | null; telefone: string | null;
  compareceu: boolean; assinante: boolean; oportunidade_id: string | null; etapa: string | null;
  contato_depois: string | null; tarefa_aberta: boolean; tarefa_feita: boolean; whatsapp_recusado: boolean;
};

export function useRadar(dias: number) {
  return useQuery({
    queryKey: ['crm', 'radar', dias],
    queryFn: async () => {
      const { data, error } = await db.rpc('crm_radar', { _dias: dias });
      erro(error);
      return (data ?? []) as LinhaRadar[];
    },
  });
}

export const useRadarAcionar = () =>
  useAcao(async (v: { evento_id: string; pessoas: string[]; acao: 'oportunidade' | 'agradecer' | 'sentimos_falta' }) => {
    const { data, error } = await db.rpc('crm_radar_acionar', { _evento_id: v.evento_id, _pessoas: v.pessoas, _acao: v.acao });
    erro(error);
    return data as { criadas: number; ja_existiam: number; ignoradas: number };
  });

export type ParRepetido = { pessoa_a: string; nome_a: string; pessoa_b: string; nome_b: string; motivos: string[]; forte: boolean };

export function useDuplicadas() {
  return useQuery({
    queryKey: ['crm', 'duplicadas'],
    queryFn: async () => {
      const { data, error } = await db.rpc('crm_duplicadas');
      erro(error);
      return (data ?? []) as ParRepetido[];
    },
  });
}

export const useIgnorarDuplicada = () =>
  useAcao(async (v: { a: string; b: string; motivo?: string }) => {
    const { error } = await db.rpc('crm_ignorar_duplicada', { _a: v.a, _b: v.b, _motivo: v.motivo || null });
    erro(error);
  });

export function useHistoricoRepetidas() {
  return useQuery({
    queryKey: ['crm', 'repetidas-historico'],
    queryFn: async () => {
      const [fusoes, ignoradas] = await Promise.all([
        db.from('crm_fusoes').select('id, pessoa_mantida_id, nome_mantido, nome_removido, motivo, movimentos, realizado_em')
          .order('realizado_em', { ascending: false }).limit(100),
        db.from('crm_duplicadas_ignoradas')
          .select('id, motivo, registrado_em, a:pessoas!crm_duplicadas_ignoradas_pessoa_a_fkey(id, nome), b:pessoas!crm_duplicadas_ignoradas_pessoa_b_fkey(id, nome)')
          .order('registrado_em', { ascending: false }).limit(100),
      ]);
      erro(fusoes.error); erro(ignoradas.error);
      return { fusoes: (fusoes.data ?? []) as any[], ignoradas: (ignoradas.data ?? []) as any[] };
    },
  });
}

export const useDesfazerIgnorar = () =>
  useAcao(async (id: string) => {
    const { error } = await db.from('crm_duplicadas_ignoradas').delete().eq('id', id);
    erro(error);
  });

export type ResumoFusao = {
  id: string; nome: string; nome_social: string | null; cpf: string | null; conta_site: boolean; criado_em: string;
  contatos: string[]; inscricoes: number; pagamentos: number; conversas: number; tarefas: number; negocios: number;
  oportunidade_aberta: boolean; papeis: string[]; associada: boolean;
};

export function usePreviaFusao(manter: string | null, remover: string | null) {
  return useQuery({
    queryKey: ['crm', 'previa-fusao', manter, remover],
    enabled: !!manter && !!remover && manter !== remover,
    queryFn: async () => {
      const { data, error } = await db.rpc('crm_previa_fusao', { _manter: manter, _remover: remover });
      erro(error);
      return data as { bloqueios: string[]; avisos: string[]; manter: ResumoFusao; remover: ResumoFusao };
    },
  });
}

export const useFundirPessoas = () =>
  useAcao(async (v: { manter: string; remover: string; motivo?: string }) => {
    const { data, error } = await db.rpc('crm_fundir_pessoas', { _manter: v.manter, _remover: v.remover, _motivo: v.motivo || null });
    erro(error);
    return data as Record<string, any>;
  });

export function useImportacoes() {
  return useQuery({
    queryKey: ['crm', 'importacoes'],
    queryFn: async () => {
      const { data, error } = await db.from('crm_importacoes')
        .select('id, nome_arquivo, origem, total, resultado, criado_em').order('criado_em', { ascending: false }).limit(30);
      erro(error);
      return (data ?? []) as any[];
    },
  });
}

export type PreviaLinha = { linha: number; acao: 'criar' | 'completar' | 'conflito' | 'erro'; pessoa_id: string | null; pessoa_nome: string | null; motivo: string; aviso: string | null };
export type ResultadoLinha = { linha: number; acao: string; pessoa_id: string | null; mensagem: string | null };

/** Prévia do banco (não grava nada), enviada em partes de até 2.000 linhas. */
export async function previaImportacao(linhas: object[]): Promise<PreviaLinha[]> {
  const out: PreviaLinha[] = [];
  for (let i = 0; i < linhas.length; i += 2000) {
    const { data, error } = await db.rpc('crm_importar_previa', { _linhas: linhas.slice(i, i + 2000) });
    erro(error);
    out.push(...((data ?? []) as PreviaLinha[]));
  }
  return out;
}

export async function iniciarImportacao(nomeArquivo: string, origem: string, total: number): Promise<string> {
  const { data, error } = await db.rpc('crm_importar_iniciar', { _nome_arquivo: nomeArquivo, _origem: origem, _total: total });
  erro(error);
  return data as string;
}

export async function importarLote(id: string, linhas: object[], criarOportunidade: boolean, autorizouWhatsApp: boolean): Promise<ResultadoLinha[]> {
  const { data, error } = await db.rpc('crm_importar_lote', {
    _importacao_id: id, _linhas: linhas, _criar_oportunidade: criarOportunidade, _autorizou_whatsapp: autorizouWhatsApp,
  });
  erro(error);
  return (data ?? []) as ResultadoLinha[];
}

export const useVinculoNegocio = () =>
  useAcao(async (v: { acao: 'incluir'; pessoa_id: string; negocio_id: string; papel: string } | { acao: 'remover'; id: string }) => {
    if (v.acao === 'incluir') {
      const { error } = await db.from('crm_negocio_vinculos').insert({ pessoa_id: v.pessoa_id, negocio_id: v.negocio_id, papel: v.papel });
      if (error?.code === '23505') throw new Error('Esta pessoa já está ligada a este negócio.');
      erro(error);
    } else {
      const { error } = await db.from('crm_negocio_vinculos').delete().eq('id', v.id);
      erro(error);
    }
  });
