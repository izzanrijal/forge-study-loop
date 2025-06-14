
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type PDF = Tables['pdfs']['Row'];
type LearningObjective = Tables['learning_objectives']['Row'];
type Question = Tables['questions']['Row'];
type StudySession = Tables['study_sessions']['Row'];

// Hook to get user's files (PDFs and other documents)
export function useFiles() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['files', user?.id],
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
        .eq('learning_objective_id', learningObjectiveId)
        .order('created_at', { ascending: true });
      
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

// Optimized file upload hook with better error handling and file type detection
export function useUploadFile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');
      
      // Detect file type and set appropriate content type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let contentType = file.type;
      
      if (!contentType || contentType === 'application/octet-stream') {
        switch (fileExtension) {
          case 'pdf':
            contentType = 'application/pdf';
            break;
          case 'md':
          case 'markdown':
            contentType = 'text/markdown';
            break;
          case 'txt':
            contentType = 'text/plain';
            break;
          default:
            contentType = 'application/octet-stream';
        }
      }
      
      // Upload file to storage with optimized settings
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType
        });
      
      if (uploadError) throw uploadError;
      
      // Create file record in database with file type detection
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
      
      // Trigger processing via edge function
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: { 
          fileId: data.id,
          fileName: file.name,
          fileType: contentType,
          filePath: fileName
        }
      });
      
      if (processError) {
        console.warn('Processing trigger failed:', processError);
        // Don't throw error here, let background processing handle it
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['learning_objectives'] });
      
      toast({
        title: "Upload Successful",
        description: `${data.filename} has been uploaded and is being processed.`,
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to record study attempt with FSRS integration
export function useRecordStudyAttempt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (attemptData: {
      sessionId: string;
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
      responseTime: number;
      difficultyRating: 'easy' | 'medium' | 'hard';
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Record the study attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('study_attempts')
        .insert({
          user_id: user.id,
          session_id: attemptData.sessionId,
          question_id: attemptData.questionId,
          selected_answer: attemptData.selectedAnswer,
          is_correct: attemptData.isCorrect,
          response_time: attemptData.responseTime,
          difficulty_rating: attemptData.difficultyRating,
        })
        .select()
        .single();
      
      if (attemptError) throw attemptError;
      
      // Update FSRS card via edge function for spaced repetition
      const { error: fsrsError } = await supabase.functions.invoke('update-fsrs-card', {
        body: {
          userId: user.id,
          questionId: attemptData.questionId,
          grade: attemptData.isCorrect ? 
            (attemptData.difficultyRating === 'easy' ? 4 : 
             attemptData.difficultyRating === 'medium' ? 3 : 2) : 1,
          responseTime: attemptData.responseTime
        }
      });
      
      if (fsrsError) {
        console.warn('FSRS update failed:', fsrsError);
        // Don't throw error, continue with attempt recording
      }
      
      return attempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['due_questions_count'] });
    },
  });
}
