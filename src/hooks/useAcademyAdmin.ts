/**
 * Academy — administração (banco novo MeC-v6).
 * A equipe cria cursos, aulas e categorias. O direito de assistir continua
 * sendo consulta ao núcleo de acesso (`tenho_acesso('academy')`) ou aula
 * marcada como gratuita — nada é gravado como "liberado".
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import slugify from '@/lib/slugify';

const db = supabase as any;

export type CursoAdmin = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  descricao: string | null;
  capa_url: string | null;
  categoria_id: string | null;
  nivel: string;
  carga_horaria_min: number | null;
  gratuito: boolean;
  publicado: boolean;
  destaque: boolean;
};

export type AulaAdmin = {
  id: string;
  curso_id: string;
  titulo: string;
  descricao: string | null;
  video_url: string | null;
  material_url: string | null;
  duracao_min: number | null;
  ordem: number;
  gratuita: boolean;
};

export const NIVEIS = ['iniciante', 'intermediario', 'avancado'] as const;

export function useCursosAdmin() {
  return useQuery({
    queryKey: ['painel', 'academy', 'cursos'],
    queryFn: async () => {
      const { data, error } = await db
        .from('cursos')
        .select(
          'id, slug, titulo, resumo, descricao, capa_url, categoria_id, nivel, carga_horaria_min, gratuito, publicado, destaque'
        )
        .order('titulo');
      if (error) throw error;
      return (data ?? []) as CursoAdmin[];
    },
  });
}

export function useCategoriasAdmin() {
  return useQuery({
    queryKey: ['painel', 'academy', 'categorias'],
    queryFn: async () => {
      const { data, error } = await db
        .from('curso_categorias')
        .select('id, slug, nome, ordem')
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as { id: string; slug: string; nome: string; ordem: number }[];
    },
  });
}

export function useAulasAdmin(cursoId?: string) {
  return useQuery({
    queryKey: ['painel', 'academy', 'aulas', cursoId],
    enabled: !!cursoId,
    queryFn: async () => {
      const { data, error } = await db
        .from('curso_aulas')
        .select('id, curso_id, titulo, descricao, video_url, material_url, duracao_min, ordem, gratuita')
        .eq('curso_id', cursoId)
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as AulaAdmin[];
    },
  });
}

/** Quantas pessoas estão matriculadas em cada curso (consulta, não contador). */
export function useMatriculasPorCurso() {
  return useQuery({
    queryKey: ['painel', 'academy', 'matriculas'],
    queryFn: async () => {
      const { data, error } = await db.from('matriculas').select('curso_id');
      if (error) throw error;
      const mapa: Record<string, number> = {};
      for (const m of (data ?? []) as any[]) mapa[m.curso_id] = (mapa[m.curso_id] ?? 0) + 1;
      return mapa;
    },
  });
}

function invalidar(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['painel', 'academy'] });
  qc.invalidateQueries({ queryKey: ['academy'] });
}

export function useSalvarCurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Partial<CursoAdmin> }) => {
      const dados = { ...valores };
      if (!dados.slug && dados.titulo) dados.slug = slugify(dados.titulo);
      if (id) {
        const { error } = await db.from('cursos').update(dados).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await db.from('cursos').insert(dados).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useRemoverCurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('cursos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useSalvarAula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Partial<AulaAdmin> }) => {
      if (id) {
        const { error } = await db.from('curso_aulas').update(valores).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await db.from('curso_aulas').insert(valores).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useRemoverAula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('curso_aulas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useSalvarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome, ordem }: { id?: string; nome: string; ordem: number }) => {
      const valores = { nome, slug: slugify(nome), ordem };
      if (id) {
        const { error } = await db.from('curso_categorias').update(valores).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await db.from('curso_categorias').insert(valores).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useRemoverCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('curso_categorias').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}
