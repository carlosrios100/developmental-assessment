import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type {
  VideoUpload,
  VideoContext,
  VideoAnalysisResult,
  MovementMetrics,
  InteractionMetrics,
  DetectedBehavior,
  VideoAnalysisBehavior,
  DevelopmentalDomain,
} from '@devassess/shared';

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

function transformAnalysisResult(row: any): VideoAnalysisResult {
  return {
    id: row.id ?? row.video_id,
    videoId: row.video_id,
    analyzedAt: new Date(row.analyzed_at),
    duration: row.duration,
    behaviors: (row.behaviors ?? row.detected_behaviors ?? []).map((b: any) => ({
      type: b.type as VideoAnalysisBehavior,
      startTime: b.start_time,
      endTime: b.end_time,
      confidence: b.confidence,
      description: b.description,
      relatedMilestones: b.related_milestones ?? [],
      boundingBox: b.bounding_box,
    })),
    movementMetrics: row.movement_metrics
      ? {
          distanceTraversed: row.movement_metrics.distance_traversed,
          movementQuality: row.movement_metrics.movement_quality,
          postureStability: row.movement_metrics.posture_stability,
          bilateralCoordination: row.movement_metrics.bilateral_coordination,
          crossingMidline: row.movement_metrics.crossing_midline,
          averageSpeed: row.movement_metrics.average_speed,
        }
      : { distanceTraversed: 0, movementQuality: 'uncoordinated' as const, postureStability: 0, bilateralCoordination: 0, crossingMidline: false, averageSpeed: 0 },
    interactionMetrics: row.interaction_metrics
      ? {
          eyeContactDuration: row.interaction_metrics.eye_contact_duration,
          eyeContactPercentage: row.interaction_metrics.eye_contact_percentage,
          jointAttentionEpisodes: row.interaction_metrics.joint_attention_episodes,
          vocalizations: row.interaction_metrics.vocalizations,
          vocalizationDuration: row.interaction_metrics.vocalization_duration,
          positiveAffectInstances: row.interaction_metrics.positive_affect_instances,
          responsivenessToCues: row.interaction_metrics.responsiveness_to_cues,
          turnTakingInstances: row.interaction_metrics.turn_taking_instances,
          proximityToCaregiver: row.interaction_metrics.proximity_to_caregiver,
        }
      : { eyeContactDuration: 0, eyeContactPercentage: 0, jointAttentionEpisodes: 0, vocalizations: 0, vocalizationDuration: 0, positiveAffectInstances: 0, responsivenessToCues: 0, turnTakingInstances: 0, proximityToCaregiver: 0 },
    developmentalIndicators: row.developmental_indicators ?? [],
    confidence: row.confidence ?? 0,
    rawData: row.raw_data,
  };
}

export function useVideoAnalysis(videoId?: string) {
  return useQuery({
    queryKey: ['videoAnalysis', videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const data = await api.get<any>(`/video/result/${videoId}`);
      return transformAnalysisResult(data);
    },
    enabled: !!videoId,
    retry: false,
  });
}

export function useVideo(videoId?: string) {
  return useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const { data, error } = await supabase
        .from('video_uploads')
        .select('*')
        .eq('id', videoId)
        .single();
      if (error) throw error;
      return transformVideo(data);
    },
    enabled: !!videoId,
  });
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
