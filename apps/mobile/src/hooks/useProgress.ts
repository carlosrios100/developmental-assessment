import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface DomainProgress {
  domain: string;
  currentScore: number;
  previousScore: number | null;
  trend: 'up' | 'down' | 'stable';
  change: number;
  percentile: number;
}

interface Milestone {
  id: string;
  description: string;
  achievedAt: string;
  domain: string;
}

export function useProgress(childId?: string) {
  return useQuery({
    queryKey: ['progress', childId],
    queryFn: async () => {
      if (!childId) return { domains: [], milestones: [] };

      // Get last two completed assessments for comparison
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select('id, completed_at')
        .eq('child_id', childId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(2);

      if (assessmentsError) throw assessmentsError;
      if (!assessments || assessments.length === 0) {
        return { domains: [], milestones: [] };
      }

      // Get domain scores for the most recent assessment
      const latestId = assessments[0].id;
      const { data: latestScores, error: latestError } = await supabase
        .from('domain_scores')
        .select('*')
        .eq('assessment_id', latestId);

      if (latestError) throw latestError;

      // Get previous scores if available
      let previousScoresMap: Record<string, number> = {};
      if (assessments.length > 1) {
        const prevId = assessments[1].id;
        const { data: prevScores } = await supabase
          .from('domain_scores')
          .select('domain, percentile')
          .eq('assessment_id', prevId);

        if (prevScores) {
          previousScoresMap = Object.fromEntries(
            prevScores.map(s => [s.domain, s.percentile ?? 0])
          );
        }
      }

      const domains: DomainProgress[] = (latestScores ?? []).map(score => {
        const percentile = score.percentile ?? 0;
        const previousPercentile = previousScoresMap[score.domain] ?? null;
        const change = previousPercentile !== null ? percentile - previousPercentile : 0;
        const trend = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';

        return {
          domain: score.domain,
          currentScore: percentile,
          previousScore: previousPercentile,
          trend,
          change,
          percentile,
        };
      });

      // Get milestones (from recommendations that indicate achievements)
      const { data: milestoneData } = await supabase
        .from('recommendations')
        .select('id, title, domain, created_at')
        .eq('assessment_id', latestId)
        .eq('type', 'milestone' as any)
        .order('created_at', { ascending: false })
        .limit(5);

      const milestones: Milestone[] = (milestoneData ?? []).map(m => ({
        id: m.id,
        description: m.title,
        achievedAt: m.created_at,
        domain: m.domain,
      }));

      return { domains, milestones };
    },
    enabled: !!childId,
  });
}
