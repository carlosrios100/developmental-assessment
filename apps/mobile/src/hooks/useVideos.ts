import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface VideoUpload {
  id: string;
  child_id: string;
  assessment_id: string | null;
  file_name: string;
  file_size: number;
  duration: number;
  context: string;
  recorded_at: string;
  storage_url: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;
  created_at: string;
}

export function useVideos(childId?: string) {
  return useQuery({
    queryKey: ['videos', childId],
    queryFn: async () => {
      let query = supabase
        .from('video_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (childId) {
        query = query.eq('child_id', childId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data ?? []) as VideoUpload[];
    },
  });
}

export function useUploadVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileUri,
      fileName,
      childId,
      context,
      recordedAt,
      assessmentId,
    }: {
      fileUri: string;
      fileName: string;
      childId: string;
      context: string;
      recordedAt: Date;
      assessmentId?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: 'video/mp4',
      } as any);
      formData.append('child_id', childId);
      formData.append('context', context);
      formData.append('recorded_at', recordedAt.toISOString());
      if (assessmentId) {
        formData.append('assessment_id', assessmentId);
      }

      const result = await api.upload<{ video_id: string; storage_url: string; duration: number }>('/video/upload', formData);

      // Start processing
      await api.post('/video/process', {
        video_id: result.video_id,
        video_url: result.storage_url,
        child_age_months: 12, // Will be populated from child data
        analysis_types: ['eye_contact', 'movement_quality', 'motor_coordination'],
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}
