import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type { VideoUpload, VideoContext } from '@devassess/shared';

function transformVideo(row: any): VideoUpload {
  return {
    id: row.id,
    childId: row.child_id,
    assessmentId: row.assessment_id ?? undefined,
    fileName: row.file_name,
    fileSize: row.file_size,
    duration: row.duration,
    context: row.context as VideoContext,
    recordedAt: new Date(row.recorded_at),
    uploadedAt: new Date(row.created_at),
    storageUrl: row.storage_url ?? '',
    thumbnailUrl: row.thumbnail_url ?? undefined,
    processingStatus: row.processing_status,
  };
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
      return (data ?? []).map(transformVideo);
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
