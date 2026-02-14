import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { crmIntegration } from '@/hooks/useCRMIntegration';

export interface AcademyEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  status: string;
  source: string;
}

export interface AcademyProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string | null;
  completed: boolean;
  progress_pct: number;
  last_position: number;
  completed_at: string | null;
  updated_at: string;
}

export type AcademyAccessLevel = 'full' | 'subscriber' | 'free' | 'none';

export const useAcademyAccess = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['academy-access', user?.id],
    queryFn: async () => {
      if (!user) return 'none' as AcademyAccessLevel;
      const { data, error } = await supabase.rpc('has_academy_access', { _user_id: user.id });
      if (error) throw error;
      return (data || 'none') as AcademyAccessLevel;
    },
    enabled: !!user,
  });
};

export const useMyEnrollments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['academy-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_enrollments')
        .select('*, course:academy_courses(*)')
        .eq('user_id', user!.id)
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return data as (AcademyEnrollment & { course: any })[];
    },
    enabled: !!user,
  });
};

export const useEnrollInCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ courseId, source = 'organic' }: { courseId: string; source?: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('academy_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          source,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-enrollments'] });
    },
  });
};

export const useEnrollAsFreeStudent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      // Add student role via RPC
      await supabase.rpc('enroll_as_free_student', { _user_id: user.id });

      // CRM integration
      try {
        const profile = await supabase.from('profiles').select('full_name, email, phone, cpf').eq('id', user.id).single();
        if (profile.data) {
          const leadId = await crmIntegration.findOrCreateLead({
            full_name: profile.data.full_name || user.email || '',
            email: profile.data.email || user.email || '',
            phone: profile.data.phone,
            cpf: profile.data.cpf,
            source: 'academy',
            source_detail: 'cadastro_gratuito',
          });

          await crmIntegration.createInteraction({
            lead_id: leadId,
            interaction_type: 'academy_free_signup',
            channel: 'website',
            description: 'Cadastro como aluno(a) gratuito(a) no MeC Academy',
          });
        }
      } catch (e) {
        console.error('[Academy] CRM integration error:', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-access'] });
    },
  });
};

export const useCourseProgress = (courseId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['academy-progress', courseId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user!.id);
      if (error) throw error;
      return data as AcademyProgress[];
    },
    enabled: !!user && !!courseId,
  });
};

export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      lessonId,
      courseId,
      completed,
      progressPct,
      lastPosition,
    }: {
      lessonId: string;
      courseId: string;
      completed?: boolean;
      progressPct?: number;
      lastPosition?: number;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('academy_progress')
        .upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            course_id: courseId,
            completed: completed || false,
            progress_pct: progressPct || 0,
            last_position: lastPosition || 0,
            completed_at: completed ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['academy-progress', variables.courseId] });
    },
  });
};
