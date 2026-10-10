import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicAmbassador {
  id: string;
  public_name: string;
  public_photo_url: string | null;
  public_bio: string | null;
  public_city: string | null;
  public_state: string | null;
  public_instagram_url: string | null;
  public_linkedin_url: string | null;
  public_website_url: string | null;
  nivel: string | null;
  indicacoes: number;
  desde: string;
}

const linkRede = (v: string | null, base: string) => {
  if (!v?.trim()) return null;
  const t = v.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return base + t.replace(/^@/, '');
};

/** Embaixadoras publicadas e ativas (consulta pública do schema novo). */
export function usePublicAmbassadors() {
  return useQuery({
    queryKey: ['public-ambassadors'],
    queryFn: async (): Promise<PublicAmbassador[]> => {
      const { data, error } = await (supabase as any).rpc('embaixadoras_publicas');
      if (error) throw error;
      return ((data ?? []) as any[])
        .map((e) => ({
          id: e.id,
          public_name: e.nome || 'Embaixadora',
          public_photo_url: e.foto_url,
          public_bio: e.apresentacao,
          public_city: e.cidade,
          public_state: e.uf,
          public_instagram_url: linkRede(e.instagram, 'https://instagram.com/'),
          public_linkedin_url: linkRede(e.linkedin, 'https://linkedin.com/in/'),
          public_website_url: e.site ? (/^https?:/i.test(e.site) ? e.site : `https://${e.site}`) : null,
          nivel: e.nivel,
          indicacoes: Number(e.indicacoes ?? 0),
          desde: e.desde,
        }))
        .sort((a, b) => b.indicacoes - a.indicacoes || a.public_name.localeCompare(b.public_name));
    },
    staleTime: 5 * 60 * 1000,
  });
}
