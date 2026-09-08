/**
 * Academy — banco novo (MeC-v6).
 * Acesso ao curso é consulta ao núcleo de acesso (`tenho_acesso('academy')`),
 * nunca uma flag gravada na matrícula.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMinhaPessoa } from '@/hooks/useMinhaArea';

const db = supabase as any;

export function useCursos() {
  return useQuery({
    queryKey: ['academy', 'cursos'],
    queryFn: async () => {
      const { data, error } = await db
        .from('cursos')
        .select('id, slug, titulo, resumo, capa_url, nivel, carga_horaria_min, gratuito, destaque, categoria:curso_categorias(nome, slug)')
        .eq('publicado', true)
        .order('destaque', { ascending: false })
        .order('titulo');
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useCurso(slug?: string) {
  return useQuery({
    queryKey: ['academy', 'curso', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await db
        .from('cursos')
        .select('*, aulas:curso_aulas(id, titulo, descricao, video_url, material_url, duracao_min, ordem, gratuita)')
        .eq('slug', slug)
        .eq('publicado', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        aulas: (data.aulas ?? []).sort((a: any, b: any) => a.ordem - b.ordem),
      };
    },
  });
}

export function useMinhaMatricula(cursoId?: string) {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['academy', 'matricula', cursoId, pessoaId],
    enabled: !!cursoId && !!pessoaId,
    queryFn: async () => {
      const [matricula, progresso, acesso] = await Promise.all([
        db.from('matriculas').select('*').eq('curso_id', cursoId).eq('pessoa_id', pessoaId).maybeSingle(),
        db.from('progresso_aulas').select('aula_id').eq('pessoa_id', pessoaId),
        db.rpc('tenho_acesso', { _tipo: 'academy' }),
      ]);
      return {
        matricula: matricula.data as any,
        concluidas: new Set(((progresso.data ?? []) as any[]).map((p) => p.aula_id)),
        temAcesso: acesso.data === true,
      };
    },
  });
}

export function useMatricular() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();
  return useMutation({
    mutationFn: async (cursoId: string) => {
      const { error } = await db
        .from('matriculas')
        .upsert({ pessoa_id: pessoaId, curso_id: cursoId }, { onConflict: 'pessoa_id,curso_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academy'] });
      qc.invalidateQueries({ queryKey: ['minha-area'] });
    },
  });
}

export function useMarcarAula() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();
  return useMutation({
    mutationFn: async ({ aulaId, concluida }: { aulaId: string; concluida: boolean }) => {
      if (concluida) {
        const { error } = await db
          .from('progresso_aulas')
          .upsert({ pessoa_id: pessoaId, aula_id: aulaId }, { onConflict: 'pessoa_id,aula_id' });
        if (error) throw error;
      } else {
        const { error } = await db.from('progresso_aulas').delete().eq('pessoa_id', pessoaId).eq('aula_id', aulaId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academy'] }),
  });
}
