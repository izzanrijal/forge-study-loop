
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnonymousStudyData {
  learningObjective: any;
  questions: any[];
  sessionId: string;
}

export function useAnonymousStudy() {
  const [loading, setLoading] = useState(false);
  const [studyData, setStudyData] = useState<AnonymousStudyData | null>(null);
  const { toast } = useToast();

  const startAnonymousStudy = async (token: string, loId: string) => {
    setLoading(true);
    try {
      // Verify token and get learning objective
      const { data: reminder, error: reminderError } = await supabase
        .from('email_reminders')
        .select(`
          *,
          learning_objectives (
            *,
            pdfs (filename)
          )
        `)
        .eq('test_token', token)
        .eq('learning_objective_id', loId)
        .single();

      if (reminderError || !reminder) {
        throw new Error('Invalid or expired token');
      }

      // Get questions for this learning objective
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('learning_objective_id', loId);

      if (questionsError) {
        throw new Error('Failed to fetch questions');
      }

      // Create anonymous study session
      const sessionToken = crypto.randomUUID();
      const { data: session, error: sessionError } = await supabase
        .from('study_sessions')
        .insert({
          user_id: reminder.user_id,
          session_type: 'study',
          total_questions: questions?.length || 0,
          test_token: sessionToken,
          anonymous_mode: true
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error('Failed to create study session');
      }

      setStudyData({
        learningObjective: reminder.learning_objectives,
        questions: questions || [],
        sessionId: session.id
      });

      toast({
        title: "Study Session Started",
        description: "You can now study without logging in!",
      });

    } catch (error) {
      console.error('Error starting anonymous study:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start study session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAnonymousAnswer = async (
    sessionId: string,
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    responseTime: number
  ) => {
    try {
      const { error } = await supabase
        .from('study_attempts')
        .insert({
          session_id: sessionId,
          question_id: questionId,
          user_id: studyData?.learningObjective?.user_id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          response_time: responseTime
        });

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to save your answer",
        variant: "destructive",
      });
    }
  };

  return {
    loading,
    studyData,
    startAnonymousStudy,
    submitAnonymousAnswer
  };
}
