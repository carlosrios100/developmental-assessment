import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface Assessment {
  id: string;
  child_id: string;
  age_at_assessment: number;
  questionnaire_version: number;
  status: string;
  completed_at: string | null;
  overall_risk_level: string | null;
  domain_scores?: DomainScore[];
}

interface DomainScore {
  domain: string;
  raw_score: number;
  max_score: number;
  percentile: number;
  z_score: number;
  risk_level: string;
  cutoff_score: number;
  monitoring_zone_cutoff: number;
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
      return (data ?? []) as unknown as Assessment[];
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
      return data as unknown as Assessment;
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
      return (data ?? []) as unknown as Assessment[];
    },
  });
}
