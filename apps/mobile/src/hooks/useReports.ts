import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Report, ReportType, ReportFormat, ReportSection } from '@devassess/shared';

function transformReport(row: any): Report {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    childId: row.child_id,
    type: row.report_type as ReportType,
    format: row.report_format as ReportFormat,
    generatedAt: new Date(row.generated_at),
    storageUrl: row.storage_url ?? undefined,
    content: row.sections
      ? {
          title: '',
          sections: row.sections.map(transformReportSection),
          generatedBy: 'system',
          disclaimer: '',
        }
      : undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  };
}

function transformReportSection(row: any): ReportSection {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    order: row.order,
    highlight: row.highlight,
  };
}

export function useReports(childId?: string) {
  return useQuery({
    queryKey: ['reports', childId],
    queryFn: async () => {
      const data = await api.get<any[]>(`/reports/child/${childId}`);
      return data.map(transformReport);
    },
    enabled: !!childId,
  });
}

export function useReport(reportId?: string) {
  return useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const data = await api.get<any>(`/reports/${reportId}`);
      return transformReport(data);
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
      const data = await api.post<any>('/reports/generate', {
        assessment_id: assessmentId,
        child_id: childId,
        report_type: reportType,
        report_format: reportFormat,
        include_video_analysis: includeVideoAnalysis,
        include_recommendations: includeRecommendations,
      });
      return transformReport(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
