/**
 * Menus editáveis do site (tabela menu_itens). Até 2 níveis de submenu.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export type ItemMenu = {
  id: string;
  menu: string;
  pai_id: string | null;
  rotulo: string;
  url: string;
  ordem: number;
  ativo: boolean;
  nova_aba: boolean;
  filhos?: ItemMenu[];
};

export function montarArvore(itens: ItemMenu[]): ItemMenu[] {
  const porPai = new Map<string | null, ItemMenu[]>();
  itens.forEach((i) => {
    const k = i.pai_id ?? null;
    porPai.set(k, [...(porPai.get(k) ?? []), { ...i }]);
  });
  const montar = (pai: string | null): ItemMenu[] =>
    (porPai.get(pai) ?? [])
      .sort((a, b) => a.ordem - b.ordem)
      .map((i) => ({ ...i, filhos: montar(i.id) }));
  return montar(null);
}

export function useMenuSite(menu: string, todos = false) {
  return useQuery({
    queryKey: ['menu-site', menu, todos],
    staleTime: 60_000,
    queryFn: async () => {
      let q = db.from('menu_itens').select('*').eq('menu', menu).order('ordem');
      if (!todos) q = q.eq('ativo', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ItemMenu[];
    },
  });
}

function useInvalidar() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['menu-site'] });
}

export function useSalvarItemMenu() {
  const inv = useInvalidar();
  return useMutation({
    mutationFn: async (item: Partial<ItemMenu>) => {
      const { id, filhos, ...resto } = item as any;
      const r = id
        ? await db.from('menu_itens').update(resto).eq('id', id)
        : await db.from('menu_itens').insert(resto);
      if (r.error) throw r.error;
    },
    onSuccess: inv,
  });
}

export function useExcluirItemMenu() {
  const inv = useInvalidar();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('menu_itens').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: inv,
  });
}

/** Troca a ordem entre dois irmãos. */
export function useTrocarOrdem() {
  const inv = useInvalidar();
  return useMutation({
    mutationFn: async ({ a, b }: { a: ItemMenu; b: ItemMenu }) => {
      const r1 = await db.from('menu_itens').update({ ordem: b.ordem }).eq('id', a.id);
      if (r1.error) throw r1.error;
      const r2 = await db.from('menu_itens').update({ ordem: a.ordem }).eq('id', b.id);
      if (r2.error) throw r2.error;
    },
    onSuccess: inv,
  });
}
