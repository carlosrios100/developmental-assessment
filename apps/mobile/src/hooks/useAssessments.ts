import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Assessment, DomainScore, RiskLevel, DevelopmentalDomain } from '@devassess/shared';

function transformDomainScore(row: any): DomainScore {
  return {
    domain: row.domain as DevelopmentalDomain,
    rawScore: row.raw_score,
    maxScore: row.max_score,
    percentile: row.percentile ?? undefined,
    zScore: row.z_score ?? undefined,
    riskLevel: row.risk_level as RiskLevel,
    cutoffScore: row.cutoff_score,
    monitoringZoneCutoff: row.monitoring_zone_cutoff,
  };
}

function transformAssessment(row: any): Assessment {
  return {
    id: row.id,
    childId: row.child_id,
    ageAtAssessment: row.age_at_assessment,
    questionnaireVersion: row.questionnaire_version,
    status: row.status,
    completedBy: row.completed_by,
    completedByUserId: row.completed_by_user_id,
    startedAt: new Date(row.started_at ?? row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    overallRiskLevel: row.overall_risk_level ?? undefined,
    notes: row.notes ?? undefined,
    domainScores: row.domain_scores
      ? (Array.isArray(row.domain_scores) ? row.domain_scores : []).map(transformDomainScore)
      : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function useAssessments(childId?: string) {
  return useQuery({
    queryKey: ['assessments', childId],
    queryFn: async () => {
      if (!childId) return [];
      const { data, error } = await supabase
        .from('assessments')
        .select('*, domain_scores(*)')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(transformAssessment);
    },
    enabled: !!childId,
  });
}

export function useAssessment(assessmentId?: string) {
  return useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;
      const { data, error } = await supabase
        .from('assessments')
        .select('*, domain_scores(*)')
        .eq('id', assessmentId)
        .single();
      if (error) throw error;
      return transformAssessment(data);
    },
    enabled: !!assessmentId,
  });
}

export function useRecentAssessments() {
  return useQuery({
    queryKey: ['assessments', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*, domain_scores(*)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map(transformAssessment);
    },
  });
}
