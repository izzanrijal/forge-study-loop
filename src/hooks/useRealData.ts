
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Types for our data
export interface PDF {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  upload_date: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  total_learning_objectives: number;
  created_at: string;
}

export interface LearningObjective {
  id: string;
  pdf_id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  page_range?: string;
  content_text?: string;
  mastery_level: number;
  total_questions: number;
  last_reviewed?: string;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  session_type: 'study' | 'test';
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  time_spent: number;
  mastery_gained: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

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

// Hook to get learning objectives
export function useLearningObjectives() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['learning_objectives', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('learning_objectives')
        .select(`
          *,
          pdfs!inner (
            filename
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Hook to get study sessions
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

// Hook to upload PDF
export function useUploadPDF() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
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
      toast({
        title: "Upload Berhasil",
        description: "PDF berhasil diupload dan sedang diproses.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook to get due questions count
export function useDueQuestionsCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['due_questions_count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      // For now, return a mock count
      // In real implementation, this would check FSRS cards for due questions
      const { data, error } = await supabase
        .from('fsrs_cards')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .lte('due_date', new Date().toISOString());
      
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!user,
  });
}
