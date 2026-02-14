import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import slugify from 'slugify';

export interface AcademyCategory {
  id: string;
  name: string;
  slug: string;
  category_type: 'material_type' | 'subject';
  description: string | null;
  icon: string | null;
  display_order: number;
  active: boolean;
}

export interface AcademyCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  thumbnail_url: string | null;
  material_type_id: string | null;
  subject_id: string | null;
  instructor_name: string | null;
  instructor_bio: string | null;
  instructor_avatar_url: string | null;
  is_standalone_lesson: boolean;
  is_free: boolean;
  allowed_roles: string[];
  show_on_landing: boolean;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  total_duration_minutes: number;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  material_type?: AcademyCategory | null;
  subject?: AcademyCategory | null;
  lessons?: AcademyLesson[];
  enrollment_count?: number;
}

export interface AcademyLesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content_type: 'youtube' | 'pdf' | 'image';
  content_url: string;
  duration_minutes: number;
  display_order: number;
  is_free_preview: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAcademyCategories = () => {
  return useQuery({
    queryKey: ['academy-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_categories')
        .select('*')
        .eq('active', true)
        .order('display_order');
      if (error) throw error;
      return data as AcademyCategory[];
    },
  });
};

export const useAcademyCourses = (filters?: {
  status?: string;
  materialType?: string;
  subject?: string;
  showOnLanding?: boolean;
  isFree?: boolean;
}) => {
  return useQuery({
    queryKey: ['academy-courses', filters],
    queryFn: async () => {
      let query = supabase
        .from('academy_courses')
        .select(`
          *,
          material_type:academy_categories!academy_courses_material_type_id_fkey(*),
          subject:academy_categories!academy_courses_subject_id_fkey(*)
        `)
        .order('display_order');

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.materialType) query = query.eq('material_type_id', filters.materialType);
      if (filters?.subject) query = query.eq('subject_id', filters.subject);
      if (filters?.showOnLanding) query = query.eq('show_on_landing', true);
      if (filters?.isFree !== undefined) query = query.eq('is_free', filters.isFree);

      const { data, error } = await query;
      if (error) throw error;
      return data as AcademyCourse[];
    },
  });
};

export const useAcademyCourse = (slug: string) => {
  return useQuery({
    queryKey: ['academy-course', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_courses')
        .select(`
          *,
          material_type:academy_categories!academy_courses_material_type_id_fkey(*),
          subject:academy_categories!academy_courses_subject_id_fkey(*)
        `)
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data as AcademyCourse;
    },
    enabled: !!slug,
  });
};

export const useAcademyLessons = (courseId: string) => {
  return useQuery({
    queryKey: ['academy-lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('active', true)
        .order('display_order');
      if (error) throw error;
      return data as AcademyLesson[];
    },
    enabled: !!courseId,
  });
};

// Admin mutations
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (course: Partial<AcademyCourse>) => {
      const slug = slugify(course.title || '', { lower: true, strict: true });
      const { data, error } = await supabase
        .from('academy_courses')
        .insert({
          ...course,
          slug,
          created_by: user?.id,
          published_at: course.status === 'published' ? new Date().toISOString() : null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AcademyCourse> & { id: string }) => {
      if (updates.title) {
        (updates as any).slug = slugify(updates.title, { lower: true, strict: true });
      }
      if (updates.status === 'published') {
        updates.published_at = updates.published_at || new Date().toISOString();
      }
      const { data, error } = await supabase
        .from('academy_courses')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-course'] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('academy_courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
    },
  });
};

export const useCreateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lesson: Partial<AcademyLesson>) => {
      const { data, error } = await supabase
        .from('academy_lessons')
        .insert(lesson as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['academy-lessons', variables.course_id] });
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AcademyLesson> & { id: string }) => {
      const { data, error } = await supabase
        .from('academy_lessons')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-lessons'] });
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('academy_lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-lessons'] });
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cat: Partial<AcademyCategory>) => {
      const slug = slugify(cat.name || '', { lower: true, strict: true });
      const { data, error } = await supabase
        .from('academy_categories')
        .insert({ ...cat, slug } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-categories'] });
    },
  });
};
