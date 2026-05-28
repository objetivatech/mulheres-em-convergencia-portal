import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ensureTipTapDoc } from '@/lib/migrateBlocksToTipTap';
import type { TipTapDoc } from '@/lib/migrateBlocksToTipTap';

export interface PageRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  page_type: string;
  is_public: boolean;
  seo_title: string | null;
  seo_description: string | null;
  content: unknown;
  created_at: string;
  updated_at: string;
  author_id: string | null;
}

export interface PageSavePayload {
  id?: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  page_type?: string;
  is_public: boolean;
  seo_title?: string;
  seo_description?: string;
  content: TipTapDoc;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------
export function usePagesList() {
  return useQuery({
    queryKey: ['admin', 'pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('id, slug, title, status, page_type, is_public, seo_title, seo_description, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PageRow[];
    },
  });
}

// ---------------------------------------------------------------------------
// Single page (by id)
// ---------------------------------------------------------------------------
export function usePage(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'pages', id],
    enabled: !!id && id !== 'nova',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as PageRow;
    },
  });
}

// ---------------------------------------------------------------------------
// Save (upsert)
// ---------------------------------------------------------------------------
export function useSavePage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: PageSavePayload) => {
      const { id, ...rest } = payload;
      const body = {
        ...rest,
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const { data, error } = await supabase.from('pages').update(body).eq('id', id).select().single();
        if (error) throw error;
        return data as unknown as PageRow;
      } else {
        const { data, error } = await supabase.from('pages').insert(body).select().single();
        if (error) throw error;
        return data as unknown as PageRow;
      }
    },
    onSuccess: (page) => {
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] });
      qc.setQueryData(['admin', 'pages', page.id], page);
      toast({ title: 'Salvo', description: `"${page.title}" salvo com sucesso.` });
    },
    onError: (err: Error) => {
      const isDuplicateSlug = err.message.includes('duplicate') || err.message.includes('unique');
      toast({
        title: 'Erro ao salvar',
        description: isDuplicateSlug
          ? 'Já existe uma página com esse slug. Escolha um slug diferente.'
          : err.message,
        variant: 'destructive',
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export function useDeletePage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] });
      toast({ title: 'Página excluída' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    },
  });
}

// ---------------------------------------------------------------------------
// Helper: get TipTap-ready content from a PageRow
// ---------------------------------------------------------------------------
export function getEditorContent(page: PageRow | undefined): TipTapDoc {
  return ensureTipTapDoc(page?.content ?? null);
}
