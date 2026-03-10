import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConectaAccess } from '@/hooks/useConectaAccess';

interface ConectaContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  active: boolean;
  source: 'conecta' | 'academy';
  course_slug?: string;
}

export function useConectaContents() {
  const { user } = useAuth();
  const { accessLevel } = useConectaAccess();
  const isGuest = accessLevel === 'convidado';

  const contentsQuery = useQuery({
    queryKey: ['conecta-contents', isGuest],
    queryFn: async () => {
      // 1. Fetch conecta_contents
      const { data: conectaData, error: conectaError } = await supabase
        .from('conecta_contents')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (conectaError) throw conectaError;

      const conectaItems: ConectaContent[] = (conectaData || []).map((item: any) => ({
        ...item,
        source: 'conecta' as const,
      }));

      // 2. Fetch academy lessons (published courses only)
      let academyQuery = supabase
        .from('academy_courses')
        .select(`
          id, slug, title, thumbnail_url, description, is_free, status,
          academy_lessons:academy_lessons(id, title, description, content_type, content_url, created_at, active, is_free_preview)
        `)
        .eq('status', 'published');

      const { data: courses, error: academyError } = await academyQuery;
      if (academyError) throw academyError;

      const academyItems: ConectaContent[] = [];
      for (const course of (courses || [])) {
        const lessons = (course as any).academy_lessons || [];
        for (const lesson of lessons) {
          if (!lesson.active) continue;
          // Guests only see free preview lessons
          if (isGuest && !lesson.is_free_preview && !(course as any).is_free) continue;

          academyItems.push({
            id: `academy-${lesson.id}`,
            title: lesson.title,
            description: lesson.description || (course as any).description,
            content_type: lesson.content_type === 'youtube' ? 'video' : lesson.content_type === 'pdf' ? 'document' : 'article',
            url: `/academy/curso/${(course as any).slug}`,
            thumbnail_url: (course as any).thumbnail_url,
            created_at: lesson.created_at,
            active: true,
            source: 'academy',
            course_slug: (course as any).slug,
          });
        }
      }

      // Merge and sort by date desc
      return [...conectaItems, ...academyItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user,
  });

  return {
    contents: contentsQuery.data || [],
    isLoading: contentsQuery.isLoading,
  };
}
