import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GeneratedProject } from '@/types/workspace';

export interface ProjectHistoryItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: string;
  thumbnail_url: string | null;
  preview_html: string | null;
  files: Array<{ path: string; content: string; language: string }>;
  original_prompt: string;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectHistory() {
  return useQuery({
    queryKey: ['project-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('project_history')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ProjectHistoryItem[];
    },
  });
}

export function useSaveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      project,
      originalPrompt,
      templateId,
    }: {
      name: string;
      description?: string;
      project: GeneratedProject;
      originalPrompt: string;
      templateId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Must be logged in to save projects');
      }

      const { data, error } = await supabase
        .from('project_history')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          project_type: project.type,
          preview_html: project.previewHtml || null,
          files: JSON.parse(JSON.stringify(project.files)),
          original_prompt: originalPrompt,
          template_id: templateId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectHistoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-history'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('project_history')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-history'] });
    },
  });
}
