/**
 * Acessos e planos — banco novo (MeC-v6).
 * Cada plano diz qual área libera (`planos.tipo`) e por quantos dias
 * (`planos.dias_acesso`). O webhook do Asaas lê exatamente esses dois campos
 * quando um pagamento é confirmado. Nada é gravado como "ativo".
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export const AREAS = [
  { valor: 'diretorio', rotulo: 'Diretório', explicacao: 'O negócio aparece na vitrine pública do site.' },
  { valor: 'conecta', rotulo: 'Conecta+', explicacao: 'Entra na rede de conexões entre associadas.' },
  { valor: 'academy', rotulo: 'Academy', explicacao: 'Assiste às aulas e cursos da plataforma.' },
  { valor: 'evento', rotulo: 'Encontro', explicacao: 'Ingresso de um encontro específico.' },
  { valor: 'area_embaixadora', rotulo: 'Área de embaixadora', explicacao: 'Materiais, indicações e repasses.' },
] as const;

export const PAPEIS = [
  { valor: 'admin', rotulo: 'Administradora', explicacao: 'Enxerga e altera tudo no painel da equipe.' },
  { valor: 'editora', rotulo: 'Editora', explicacao: 'Edita conteúdo do site: blog, páginas e negócios.' },
  { valor: 'embaixadora', rotulo: 'Embaixadora', explicacao: 'Acesso à área de indicações e materiais.' },
  { valor: 'dona_negocio', rotulo: 'Dona de negócio', explicacao: 'Responsável por um negócio no diretório.' },
  { valor: 'assinante', rotulo: 'Assinante', explicacao: 'Tem plano contratado.' },
  { valor: 'aluna', rotulo: 'Aluna', explicacao: 'Matriculada em cursos da Academy.' },
  { valor: 'facilitadora', rotulo: 'Facilitadora', explicacao: 'Conduz encontros e turmas.' },
] as const;

export type PlanoAcesso = {
  id: string;
  slug: string;
  nome: string;
  tipo: string;
  valor_centavos: number;
  periodicidade: string;
  dias_acesso: number;
  ativo: boolean;
  ordem: number;
};

export function usePlanosAcessos() {
  return useQuery({
    queryKey: ['painel', 'acessos-planos'],
    queryFn: async () => {
      const { data, error } = await db
        .from('planos')
        .select('id, slug, nome, tipo, valor_centavos, periodicidade, dias_acesso, ativo, ordem')
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as PlanoAcesso[];
    },
  });
}

export function useSalvarPlanoAcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plano: Pick<PlanoAcesso, 'id' | 'tipo' | 'dias_acesso' | 'ativo'>) => {
      const { error } = await db
        .from('planos')
        .update({ tipo: plano.tipo, dias_acesso: plano.dias_acesso, ativo: plano.ativo })
        .eq('id', plano.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['painel', 'acessos-planos'] });
      qc.invalidateQueries({ queryKey: ['planos'] });
    },
  });
}

/** Quantas pessoas têm liberação vigente em cada área, agora. */
export function useResumoAcessos() {
  return useQuery({
    queryKey: ['painel', 'resumo-acessos'],
    queryFn: async () => {
      const agora = new Date().toISOString();
      const { data, error } = await db
        .from('concessoes_acesso')
        .select('tipo, origem, fim_em, revogado_em, inicio_em');
      if (error) throw error;
      const vigentes = (data ?? []).filter(
        (c: any) => !c.revogado_em && c.inicio_em <= agora && (!c.fim_em || c.fim_em > agora)
      );
      const porArea: Record<string, number> = {};
      for (const c of vigentes) porArea[c.tipo] = (porArea[c.tipo] ?? 0) + 1;
      return { total: vigentes.length, porArea };
    },
  });
}
