import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LandingPageContent } from '@/types/landing-page';
import { toast } from 'sonner';

export interface LandingPageRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  product_id: string | null;
  active: boolean;
  featured: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  content: LandingPageContent | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  created_by: string | null;
  sections_enabled: Record<string, boolean> | null;
}

const DEFAULT_SECTIONS_ENABLED = {
  hero: true,
  painPoints: true,
  method: true,
  pillars: true,
  included: true,
  targetAudience: true,
  transformation: true,
  eventDetails: true,
  investment: true,
  testimonials: true,
};

const DEFAULT_CONTENT: LandingPageContent = {
  product: {
    id: '',
    slug: '',
    name: 'Novo Produto',
    tagline: 'Descrição breve do produto',
    price: 0,
    paymentDescription: 'Descrição do pagamento',
    eventFormat: 'online',
  },
  hero: {
    headline: 'Título principal da página',
    subheadline: 'Subtítulo que complementa o título principal',
    description: 'Descrição detalhada do produto ou evento.',
    ctaPrimary: 'QUERO PARTICIPAR',
  },
  painPoints: {
    title: 'Você se identifica com essas situações?',
    painPoints: [{ text: 'Primeiro ponto de dor' }],
    closingText: 'O problema não é você.',
    closingHighlight: 'É a falta de método.',
  },
  method: {
    title: 'O Método',
    description: 'Descrição do método.',
    benefits: ['Benefício 1', 'Benefício 2'],
    closingText: 'Texto de fechamento do método.',
  },
  pillars: {
    title: 'Os Pilares',
    pillars: [
      { id: 'pilar-1', title: 'Pilar 01', subtitle: 'Subtítulo', description: 'Descrição do pilar.' },
    ],
  },
  included: {
    title: 'O Que Está Incluído',
    items: [{ text: 'Item incluído' }],
  },
  targetAudience: {
    title: 'Para Quem É',
    profiles: ['Perfil 1'],
  },
  transformation: {
    title: 'Depois do Método, Você:',
    transformations: [{ text: 'Transformação 1' }],
  },
  eventDetails: {
    title: 'Detalhes do Evento',
    dates: 'A definir',
    duration: 'A definir',
    format: 'Online',
  },
  investment: {
    title: 'Investimento',
    price: 'R$ 0,00',
    priceValue: 0,
    description: 'Descrição do investimento.',
    ctaText: 'GARANTIR MINHA VAGA',
  },
};

export function useListLandingPages(statusFilter?: string) {
  return useQuery({
    queryKey: ['landing-pages', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as LandingPageRow[];
    },
  });
}

export function useGetLandingPage(id: string | undefined) {
  return useQuery({
    queryKey: ['landing-page', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LandingPageRow | null;
    },
    enabled: !!id,
  });
}

export function useGetLandingPageBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['landing-page-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LandingPageRow | null;
    },
    enabled: !!slug,
  });
}

export function useCreateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; slug: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('landing_pages')
        .insert({
          title: data.title,
          slug: data.slug,
          active: false,
          featured: false,
          status: 'draft',
          content: DEFAULT_CONTENT as any,
          sections_enabled: DEFAULT_SECTIONS_ENABLED as any,
          created_by: user.user?.id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return result as unknown as LandingPageRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Landing Page criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar LP: ${error.message}`);
    },
  });
}

export function useUpdateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LandingPageRow> & { id: string }) => {
      const { data, error } = await supabase
        .from('landing_pages')
        .update({
          ...updates,
          content: updates.content as any,
          sections_enabled: updates.sections_enabled as any,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as LandingPageRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['landing-page', data.id] });
      toast.success('Landing Page atualizada!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useDeleteLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Landing Page excluída!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}

export function useDuplicateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error: fetchError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      const orig = original as unknown as LandingPageRow;
      const { data: user } = await supabase.auth.getUser();
      const newSlug = `${orig.slug}-copia-${Date.now().toString(36)}`;

      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          title: `${orig.title} (Cópia)`,
          slug: newSlug,
          description: orig.description,
          image_url: orig.image_url,
          active: false,
          featured: false,
          status: 'draft',
          content: orig.content as any,
          sections_enabled: orig.sections_enabled as any,
          seo_title: orig.seo_title,
          seo_description: orig.seo_description,
          created_by: user.user?.id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as LandingPageRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Landing Page duplicada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao duplicar: ${error.message}`);
    },
  });
}
