
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useEmailReminder() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const scheduleReminder = async (
    email: string,
    learningObjectiveId: string,
    hoursDelay: number = 24
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('schedule_study_reminder', {
          p_user_id: user.id,
          p_email: email,
          p_learning_objective_id: learningObjectiveId,
          p_hours_delay: hoursDelay
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Reminder Scheduled",
        description: `Email reminder akan dikirim dalam ${hoursDelay} jam ke ${email}`,
      });

      return data;

    } catch (error) {
      console.error('Error scheduling reminder:', error);
      toast({
        title: "Error",
        description: "Failed to schedule email reminder",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getMyReminders = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('email_reminders')
        .select(`
          *,
          learning_objectives (
            title,
            pdfs (filename)
          )
        `)
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
  };

  return {
    loading,
    scheduleReminder,
    getMyReminders
  };
}
