
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useRegenerateQuestions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (learningObjectiveId: string) => {
      const { data, error } = await supabase.functions.invoke('regenerate-questions', {
        body: { learningObjectiveId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, learningObjectiveId) => {
      queryClient.invalidateQueries({ queryKey: ['questions', learningObjectiveId] });
      queryClient.invalidateQueries({ queryKey: ['learning_objectives'] });
      
      toast({
        title: "Soal Baru Berhasil Dibuat",
        description: `${data.newQuestions} soal baru telah ditambahkan untuk pembelajaran lanjutan.`,
      });
    },
    onError: (error) => {
      console.error('Regenerate questions error:', error);
      toast({
        title: "Gagal Membuat Soal Baru",
        description: "Terjadi kesalahan saat membuat soal baru. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });
}
