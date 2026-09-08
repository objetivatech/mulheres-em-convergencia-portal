/**
 * Consultas do site público — banco novo (MeC-v6).
 * Tabelas: negocios, posts, autores, post_categorias, paginas, blocos_site.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Negocio = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  cidade: string | null;
  uf: string | null;
  bairro: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  site: string | null;
  instagram: string | null;
  logo_url: string | null;
  capa_url: string | null;
  destaque: boolean;
};

export type Post = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  capa_url: string | null;
  publicado_em: string | null;
  destaque: boolean;
  seo_titulo: string | null;
  seo_descricao: string | null;
  autor: { nome: string; foto_url: string | null; bio: string | null } | null;
};

export type Pagina = {
  id: string;
  slug: string;
  titulo: string;
  conteudo: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
};

export type BlocoSite = {
  chave: string;
  tipo: string;
  conteudo: Record<string, any>;
  ordem: number;
};

const CAMPOS_NEGOCIO =
  'id, slug, nome, descricao, categoria, cidade, uf, bairro, telefone, whatsapp, email, site, instagram, logo_url, capa_url, destaque';

const CAMPOS_POST =
  'id, slug, titulo, resumo, conteudo, capa_url, publicado_em, destaque, seo_titulo, seo_descricao, autor:autores(nome, foto_url, bio)';

export function useBlocosSite() {
  return useQuery({
    queryKey: ['site', 'blocos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocos_site')
        .select('chave, tipo, conteudo, ordem')
        .eq('ativo', true)
        .order('ordem');
      if (error) throw error;
      const mapa: Record<string, BlocoSite> = {};
      (data ?? []).forEach((b: any) => { mapa[b.chave] = b as BlocoSite; });
      return mapa;
    },
  });
}

export function useNegocios(filtros: { busca?: string; categoria?: string; cidade?: string } = {}) {
  const { busca = '', categoria = '', cidade = '' } = filtros;
  return useQuery({
    queryKey: ['site', 'negocios', busca, categoria, cidade],
    queryFn: async () => {
      let q = supabase
        .from('negocios')
        .select(CAMPOS_NEGOCIO)
        .eq('publicado', true)
        .order('destaque', { ascending: false })
        .order('nome');
      if (busca.trim()) q = q.or(`nome.ilike.%${busca.trim()}%,descricao.ilike.%${busca.trim()}%`);
      if (categoria) q = q.eq('categoria', categoria);
      if (cidade) q = q.eq('cidade', cidade);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Negocio[];
    },
  });
}

export function useNegociosDestaque(limite = 6) {
  return useQuery({
    queryKey: ['site', 'negocios-destaque', limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('negocios')
        .select(CAMPOS_NEGOCIO)
        .eq('publicado', true)
        .order('destaque', { ascending: false })
        .order('criado_em', { ascending: false })
        .limit(limite);
      if (error) throw error;
      return (data ?? []) as Negocio[];
    },
  });
}

export function useNegocio(slug?: string) {
  return useQuery({
    queryKey: ['site', 'negocio', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('negocios')
        .select(
          `${CAMPOS_NEGOCIO}, midias:negocio_midias(id, tipo, url, legenda, ordem), areas:negocio_areas_atendimento(id, cidade, uf, bairro), comodidades:negocio_comodidades(id, nome)`
        )
        .eq('slug', slug!)
        .eq('publicado', true)
        .maybeSingle();
      if (error) throw error;
      return data as (Negocio & {
        midias: { id: string; tipo: string; url: string; legenda: string | null; ordem: number }[];
        areas: { id: string; cidade: string | null; uf: string | null; bairro: string | null }[];
        comodidades: { id: string; nome: string }[];
      }) | null;
    },
  });
}

export function usePosts(opcoes: { busca?: string; categoria?: string; limite?: number } = {}) {
  const { busca = '', categoria = '', limite = 24 } = opcoes;
  return useQuery({
    queryKey: ['site', 'posts', busca, categoria, limite],
    queryFn: async () => {
      let q = supabase
        .from('posts')
        .select(categoria ? `${CAMPOS_POST}, post_categoria_vinculo!inner(categoria_id)` : CAMPOS_POST)
        .eq('situacao', 'publicado')
        .order('publicado_em', { ascending: false })
        .limit(limite);
      if (busca.trim()) q = q.or(`titulo.ilike.%${busca.trim()}%,resumo.ilike.%${busca.trim()}%`);
      if (categoria) q = q.eq('post_categoria_vinculo.categoria_id', categoria);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Post[];
    },
  });
}

export function usePost(slug?: string) {
  return useQuery({
    queryKey: ['site', 'post', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(CAMPOS_POST)
        .eq('slug', slug!)
        .eq('situacao', 'publicado')
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Post | null;
    },
  });
}

export function useCategoriasPost() {
  return useQuery({
    queryKey: ['site', 'post-categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_categorias')
        .select('id, slug, nome')
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as { id: string; slug: string; nome: string }[];
    },
  });
}

export function usePagina(slug?: string) {
  return useQuery({
    queryKey: ['site', 'pagina', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paginas')
        .select('id, slug, titulo, conteudo, seo_titulo, seo_descricao')
        .eq('slug', slug!)
        .eq('situacao', 'publicado')
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Pagina | null;
    },
  });
}
