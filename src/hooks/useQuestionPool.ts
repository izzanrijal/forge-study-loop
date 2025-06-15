
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useQuestionPool() {
  const getUniqueQuestions = async (
    learningObjectiveId: string, 
    sessionType: 'study' | 'test',
    count: number = 10
  ) => {
    try {
      // Get or create question pool for this session
      let { data: pool, error: poolError } = await supabase
        .from('question_pools')
        .select('*')
        .eq('learning_objective_id', learningObjectiveId)
        .eq('session_type', sessionType)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (poolError && poolError.code !== 'PGRST116') {
        throw poolError;
      }

      // Get all available questions
      const { data: allQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('learning_objective_id', learningObjectiveId);

      if (questionsError) {
        throw questionsError;
      }

      if (!allQuestions || allQuestions.length === 0) {
        throw new Error('No questions available for this learning objective');
      }

      // Filter out already used questions
      const usedQuestionIds = pool?.used_question_ids || [];
      const availableQuestions = allQuestions.filter(
        q => !usedQuestionIds.includes(q.id)
      );

      // If we don't have enough unused questions, reset the pool
      if (availableQuestions.length < count) {
        pool = null;
      }

      // Select questions
      const questionsToUse = availableQuestions.length >= count 
        ? availableQuestions.slice(0, count)
        : availableQuestions;

      // Shuffle questions to avoid patterns
      const shuffledQuestions = questionsToUse.sort(() => Math.random() - 0.5);

      // Update or create question pool
      const newUsedIds = [
        ...(pool?.used_question_ids || []),
        ...shuffledQuestions.map(q => q.id)
      ];

      if (pool) {
        // Update existing pool
        await supabase
          .from('question_pools')
          .update({ used_question_ids: newUsedIds })
          .eq('id', pool.id);
      } else {
        // Create new pool
        await supabase
          .from('question_pools')
          .insert({
            learning_objective_id: learningObjectiveId,
            session_type: sessionType,
            used_question_ids: newUsedIds,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
      }

      console.log(`Selected ${shuffledQuestions.length} unique questions for ${sessionType}`);
      return shuffledQuestions;

    } catch (error) {
      console.error('Error getting unique questions:', error);
      throw error;
    }
  };

  const resetQuestionPool = async (learningObjectiveId: string, sessionType: 'study' | 'test') => {
    try {
      await supabase
        .from('question_pools')
        .delete()
        .eq('learning_objective_id', learningObjectiveId)
        .eq('session_type', sessionType);
    } catch (error) {
      console.error('Error resetting question pool:', error);
    }
  };

  return {
    getUniqueQuestions,
    resetQuestionPool
  };
}
