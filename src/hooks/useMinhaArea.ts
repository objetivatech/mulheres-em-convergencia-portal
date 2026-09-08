/**
 * Área da associada — banco novo (MeC-v6).
 * Tudo é consulta sobre fatos: concessoes_acesso, pagamentos, evento_inscricoes,
 * matriculas, conecta_* e embaixadoras. Nenhum estado derivado é gravado.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const db = supabase as any;

export type Perfil = {
  pessoa_id: string;
  nome: string;
  nome_social: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  foto_url: string | null;
  bio: string | null;
  instagram: string | null;
  linkedin: string | null;
  site: string | null;
  email_principal: string | null;
  telefone_principal: string | null;
  papeis: string[];
  acesso_diretorio: boolean;
  acesso_conecta: boolean;
  acesso_academy: boolean;
  acesso_embaixadora: boolean;
  completude_percentual: number;
};

/** Garante o vínculo pessoa <-> conta e devolve o id da pessoa. */
export function useMinhaPessoa() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['minha-area', 'pessoa', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await db.rpc('garantir_pessoa', {});
      if (error) throw error;
      return data as string;
    },
  });
}

export function useMeuPerfil() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['minha-area', 'perfil', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await db
        .from('v_meu_perfil')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .maybeSingle();
      if (error) throw error;
      return data as Perfil | null;
    },
  });
}

export function useMeusAcessos() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['minha-area', 'acessos', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await db
        .from('concessoes_acesso')
        .select('id, tipo, origem, inicio_em, fim_em, revogado_em, motivo')
        .eq('pessoa_id', pessoaId)
        .is('revogado_em', null)
        .order('inicio_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useMeusPagamentos() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['minha-area', 'pagamentos', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await db
        .from('pagamentos')
        .select('id, descricao, valor_centavos, situacao, vencimento_em, confirmado_em, criado_em, dados_brutos')
        .eq('pessoa_id', pessoaId)
        .order('criado_em', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useMinhasInscricoesArea() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['minha-area', 'inscricoes', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await db
        .from('evento_inscricoes')
        .select(
          'id, situacao, valor_centavos, criado_em, evento:eventos(slug, titulo, inicio_em, online, link_online, local_nome, cidade, uf)'
        )
        .eq('pessoa_id', pessoaId)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useMeuNegocio() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['minha-area', 'negocio', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await db
        .from('negocios')
        .select('id, slug, nome, publicado, cidade, uf, logo_url')
        .eq('pessoa_id', pessoaId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useSalvarMeuPerfil() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();
  return useMutation({
    mutationFn: async (valores: Record<string, any>) => {
      const { error } = await db.from('pessoas').update(valores).eq('id', pessoaId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['minha-area'] }),
  });
}

export function useRegistrarContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tipo, valor }: { tipo: 'telefone' | 'whatsapp' | 'email'; valor: string }) => {
      const { error } = await db.rpc('registrar_contato', { _tipo: tipo, _valor: valor, _principal: true });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['minha-area'] }),
  });
}

export function useVincularCpf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cpf: string) => {
      const { error } = await db.rpc('vincular_cpf', { _cpf: cpf });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['minha-area'] }),
  });
}

/* ---------------------------------------------------------------- Academy */

export function useMinhasMatriculas() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['minha-area', 'matriculas', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await db
        .from('matriculas')
        .select('id, criado_em, concluido_em, curso:cursos(id, slug, titulo, resumo, capa_url)')
        .eq('pessoa_id', pessoaId)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

/* --------------------------------------------------------------- Conecta+ */

export function useMeuConecta() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['minha-area', 'conecta', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const [perfil, grupos, indicacoes] = await Promise.all([
        db.from('conecta_perfis').select('*').eq('pessoa_id', pessoaId).maybeSingle(),
        db.from('conecta_grupos').select('id, slug, nome, descricao').eq('ativo', true).order('nome'),
        db
          .from('conecta_indicacoes')
          .select('id, descricao, situacao, criado_em, de_pessoa_id, para_pessoa_id')
          .order('criado_em', { ascending: false })
          .limit(50),
      ]);
      return {
        perfil: perfil.data as any,
        grupos: (grupos.data ?? []) as any[],
        indicacoes: (indicacoes.data ?? []) as any[],
      };
    },
  });
}

export function useSalvarConectaPerfil() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();
  return useMutation({
    mutationFn: async (valores: Record<string, any>) => {
      const { error } = await db
        .from('conecta_perfis')
        .upsert({ pessoa_id: pessoaId, ...valores }, { onConflict: 'pessoa_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['minha-area', 'conecta'] }),
  });
}

/* ----------------------------------------------------------- Embaixadoras */

export function useMinhaEmbaixadora() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['minha-area', 'embaixadora', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data: ficha } = await db
        .from('embaixadoras')
        .select('*, nivel:embaixadora_niveis(nome, comissao_percentual)')
        .eq('pessoa_id', pessoaId)
        .maybeSingle();
      if (!ficha) return null;
      const [resumo, indicacoes, repasses, materiais] = await Promise.all([
        db.from('v_embaixadora_resumo').select('*').eq('embaixadora_id', ficha.id).maybeSingle(),
        db
          .from('embaixadora_indicacoes')
          .select('id, nome, email, criado_em, pagamento:pagamentos(situacao, valor_centavos)')
          .eq('embaixadora_id', ficha.id)
          .order('criado_em', { ascending: false }),
        db
          .from('embaixadora_repasses')
          .select('id, competencia, valor_centavos, situacao, pago_em')
          .eq('embaixadora_id', ficha.id)
          .order('competencia', { ascending: false }),
        db.from('embaixadora_materiais').select('id, titulo, descricao, url, tipo').eq('ativo', true).order('ordem'),
      ]);
      return {
        ficha,
        resumo: resumo.data as any,
        indicacoes: (indicacoes.data ?? []) as any[],
        repasses: (repasses.data ?? []) as any[],
        materiais: (materiais.data ?? []) as any[],
      };
    },
  });
}
