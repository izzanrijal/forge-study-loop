
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useStudySession() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createStudySession = async (
    sessionType: 'study' | 'test',
    totalQuestions: number,
    isAnonymous: boolean = false,
    testToken?: string
  ) => {
    try {
      setLoading(true);
      
      const sessionData: any = {
        session_type: sessionType,
        total_questions: totalQuestions,
        anonymous_mode: isAnonymous
      };

      if (isAnonymous && testToken) {
        sessionData.test_token = testToken;
        sessionData.user_id = null; // Will be handled by RLS policy
      } else if (user) {
        sessionData.user_id = user.id;
      } else {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Study session created:', data);
      return data;

    } catch (error) {
      console.error('Error creating study session:', error);
      toast({
        title: "Error",
        description: "Failed to create study session",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateStudySession = async (
    sessionId: string,
    updates: {
      correct_answers?: number;
      accuracy?: number;
      time_spent?: number;
      mastery_gained?: number;
      completed_at?: string;
    }
  ) => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Study session updated:', data);
      return data;

    } catch (error) {
      console.error('Error updating study session:', error);
      throw error;
    }
  };

  const recordStudyAttempt = async (
    sessionId: string,
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    responseTime: number,
    difficultyRating?: string
  ) => {
    try {
      const attemptData: any = {
        session_id: sessionId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        response_time: responseTime
      };

      if (user) {
        attemptData.user_id = user.id;
      }

      if (difficultyRating) {
        attemptData.difficulty_rating = difficultyRating;
      }

      const { data, error } = await supabase
        .from('study_attempts')
        .insert(attemptData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Study attempt recorded:', data);
      return data;

    } catch (error) {
      console.error('Error recording study attempt:', error);
      throw error;
    }
  };

  return {
    loading,
    createStudySession,
    updateStudySession,
    recordStudyAttempt
  };
}
