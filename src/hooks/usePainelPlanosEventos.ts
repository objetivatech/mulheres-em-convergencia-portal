/**
 * Gestão de planos e eventos pela equipe — banco novo (MeC-v6).
 * Tudo por consulta: nenhuma contagem é gravada.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Visibilidade = 'publico' | 'oculto' | 'privado';

export type PlanoAdmin = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  tipos: string[];
  valor_centavos: number;
  periodicidade: string;
  dias_acesso: number;
  beneficios: string[];
  destaque: boolean;
  ativo: boolean;
  ordem: number;
  visibilidade: Visibilidade;
  codigo_oferta: string | null;
  oferta_validade: string | null;
  oferta_limite_usos: number | null;
  observacao_interna: string | null;
};

export type EventoAdmin = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  descricao: string | null;
  capa_url: string | null;
  online: boolean;
  link_online: string | null;
  local_nome: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  inicio_em: string;
  fim_em: string | null;
  vagas: number | null;
  gratuito: boolean;
  publicado: boolean;
  destaque: boolean;
};

export const AREAS: { valor: string; rotulo: string }[] = [
  { valor: 'diretorio', rotulo: 'Diretório de negócios' },
  { valor: 'conecta', rotulo: 'Conecta+' },
  { valor: 'academy', rotulo: 'Academy' },
  { valor: 'evento', rotulo: 'Encontros' },
  { valor: 'area_embaixadora', rotulo: 'Área da embaixadora' },
];

// --------------------------------------------------------------------------
// Planos
// --------------------------------------------------------------------------
export function usePlanosAdmin() {
  return useQuery({
    queryKey: ['painel', 'planos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('planos').select('*').order('ordem');
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        beneficios: Array.isArray(p.beneficios) ? p.beneficios : [],
        tipos: Array.isArray(p.tipos) ? p.tipos : [p.tipo].filter(Boolean),
      })) as PlanoAdmin[];
    },
  });
}

/** Quantas vezes cada plano já foi pago (usado para o limite das ofertas privadas). */
export function useUsosPorPlano() {
  return useQuery({
    queryKey: ['painel', 'planos', 'usos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('plano_id')
        .eq('situacao', 'confirmado')
        .not('plano_id', 'is', null);
      if (error) throw error;
      const mapa: Record<string, number> = {};
      for (const linha of data ?? []) {
        const id = (linha as any).plano_id as string;
        mapa[id] = (mapa[id] ?? 0) + 1;
      }
      return mapa;
    },
  });
}

export function useSalvarPlano() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Record<string, any> }) => {
      if (id) {
        const { error } = await supabase.from('planos').update(valores).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from('planos').insert(valores as any).select('id').single();
      if (error) throw error;
      return (data as any).id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['painel', 'planos'] });
      qc.invalidateQueries({ queryKey: ['planos'] });
      toast({ title: 'Plano salvo' });
    },
    onError: (e: any) =>
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' }),
  });
}

export function useExcluirPlano() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('planos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['painel', 'planos'] });
      qc.invalidateQueries({ queryKey: ['planos'] });
      toast({ title: 'Plano excluído' });
    },
    onError: (e: any) =>
      toast({
        title: 'Não foi possível excluir',
        description: 'Se o plano já tem pagamentos, prefira desativá-lo.',
        variant: 'destructive',
      }),
  });
}

// --------------------------------------------------------------------------
// Eventos
// --------------------------------------------------------------------------
export function useEventosAdmin() {
  return useQuery({
    queryKey: ['painel', 'eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('inicio_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EventoAdmin[];
    },
  });
}

export function useEventoAdmin(id?: string) {
  return useQuery({
    queryKey: ['painel', 'evento', id],
    enabled: !!id && id !== 'novo',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select(
          `*, lotes:evento_lotes(*), palestrantes:evento_palestrantes(*), cupons:evento_cupons(*)`
        )
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useSalvarEvento() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Record<string, any> }) => {
      if (id) {
        const { error } = await supabase.from('eventos').update(valores).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from('eventos').insert(valores as any).select('id').single();
      if (error) throw error;
      return (data as any).id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['painel', 'eventos'] });
      qc.invalidateQueries({ queryKey: ['painel', 'evento', id] });
      qc.invalidateQueries({ queryKey: ['eventos'] });
      toast({ title: 'Encontro salvo' });
    },
    onError: (e: any) =>
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' }),
  });
}

export function useExcluirEvento() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('eventos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['painel', 'eventos'] });
      qc.invalidateQueries({ queryKey: ['eventos'] });
      toast({ title: 'Encontro excluído' });
    },
    onError: () =>
      toast({
        title: 'Não foi possível excluir',
        description: 'Se já existem inscrições, prefira despublicar o encontro.',
        variant: 'destructive',
      }),
  });
}

/** Lotes, palestrantes e cupons: mesma mecânica de gravar e apagar. */
type Filha = 'evento_lotes' | 'evento_palestrantes' | 'evento_cupons';

export function useSalvarFilha(tabela: Filha) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Record<string, any> }) => {
      if (id) {
        const { error } = await supabase.from(tabela).update(valores).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from(tabela).insert(valores as any).select('id').single();
      if (error) throw error;
      return (data as any).id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['painel', 'evento'] }),
    onError: (e: any) =>
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' }),
  });
}

export function useExcluirFilha(tabela: Filha) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tabela).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['painel', 'evento'] }),
    onError: (e: any) =>
      toast({ title: 'Não foi possível excluir', description: e.message, variant: 'destructive' }),
  });
}

/** Inscrições de um encontro. */
export function useInscricoesEvento(eventoId?: string) {
  return useQuery({
    queryKey: ['painel', 'evento', eventoId, 'inscricoes'],
    enabled: !!eventoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_inscricoes')
        .select('id, nome, email, telefone, situacao, valor_centavos, criado_em')
        .eq('evento_id', eventoId!)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}
