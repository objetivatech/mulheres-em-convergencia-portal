/**
 * Textos fixos do site, editáveis pelo painel (tabela `textos_site` no MeC-v6).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CATALOGO_TEXTOS, PADROES_TEXTOS } from '@/lib/textosCatalogo';

export type TextoSiteRow = {
  id: string;
  chave: string;
  grupo: string;
  rotulo: string | null;
  tipo: string;
  valor: string | null;
};

export function useTextosSite() {
  return useQuery({
    queryKey: ['textos-site'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('textos_site')
        .select('id, chave, grupo, rotulo, tipo, valor');
      if (error) throw error;
      const mapa: Record<string, string> = {};
      (data ?? []).forEach((t: TextoSiteRow) => {
        if (t.valor != null && t.valor !== '') mapa[t.chave] = t.valor;
      });
      return { linhas: (data ?? []) as TextoSiteRow[], mapa };
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Valor de um texto, com o padrão do catálogo enquanto ninguém editou. */
export function useTexto(chave: string, padrao?: string) {
  const { data } = useTextosSite();
  return data?.mapa[chave] ?? padrao ?? PADROES_TEXTOS[chave] ?? '';
}

export function useSalvarTexto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: string }) => {
      const item = CATALOGO_TEXTOS.find((t) => t.chave === chave);
      const { error } = await supabase
        .from('textos_site')
        .upsert(
          {
            chave,
            valor,
            grupo: item?.grupo ?? 'geral',
            rotulo: item?.rotulo ?? chave,
            tipo: item?.tipo ?? 'texto',
          },
          { onConflict: 'chave' }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['textos-site'] }),
  });
}
