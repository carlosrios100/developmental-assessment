import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Report {
  id: string;
  assessment_id: string;
  child_id: string;
  report_type: string;
  report_format: string;
  generated_at: string;
  storage_url: string | null;
  sections?: ReportSection[];
  expires_at: string | null;
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  highlight?: boolean;
}

export function useReports(childId?: string) {
  return useQuery({
    queryKey: ['reports', childId],
    queryFn: async () => {
      const path = childId ? `/reports/child/${childId}` : '/reports/child/all';
      return api.get<Report[]>(path);
    },
    enabled: !!childId,
  });
}

export function useReport(reportId?: string) {
  return useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      return api.get<Report>(`/reports/${reportId}`);
    },
    enabled: !!reportId,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assessmentId,
      childId,
      reportType,
      reportFormat = 'markdown',
      includeVideoAnalysis = true,
      includeRecommendations = true,
    }: {
      assessmentId: string;
      childId: string;
      reportType: string;
      reportFormat?: string;
      includeVideoAnalysis?: boolean;
      includeRecommendations?: boolean;
    }) => {
      return api.post<Report>('/reports/generate', {
        assessment_id: assessmentId,
        child_id: childId,
        report_type: reportType,
        report_format: reportFormat,
        include_video_analysis: includeVideoAnalysis,
        include_recommendations: includeRecommendations,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
