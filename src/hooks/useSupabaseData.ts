
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type PDF = Tables['pdfs']['Row'];
type LearningObjective = Tables['learning_objectives']['Row'];
type Question = Tables['questions']['Row'];
type StudySession = Tables['study_sessions']['Row'];

// Hook to get user's PDFs
export function usePDFs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['pdfs', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('pdfs')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });
      
      if (error) throw error;
      return data as PDF[];
    },
    enabled: !!user,
  });
}

// Hook to get learning objectives for a user
export function useLearningObjectives() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['learning_objectives', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('learning_objectives')
        .select('*, pdfs(filename)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Hook to get questions for a learning objective
export function useQuestions(learningObjectiveId: string) {
  return useQuery({
    queryKey: ['questions', learningObjectiveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('learning_objective_id', learningObjectiveId);
      
      if (error) throw error;
      return data as Question[];
    },
    enabled: !!learningObjectiveId,
  });
}

// Hook to get user's study sessions
export function useStudySessions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['study_sessions', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data as StudySession[];
    },
    enabled: !!user,
  });
}

// Hook to create a study session
export function useCreateStudySession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (sessionData: {
      session_type: 'study' | 'test';
      total_questions: number;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          ...sessionData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_sessions'] });
    },
  });
}

// Hook to upload PDF
export function useUploadPDF() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');
      
      // Upload file to storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Create PDF record in database
      const { data, error } = await supabase
        .from('pdfs')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_path: fileName,
          processing_status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfs'] });
    },
  });
}
