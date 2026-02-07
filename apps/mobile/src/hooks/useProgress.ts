import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MILESTONES, getMilestonesByAge, getUpcomingMilestones } from '@devassess/shared';
import { useChildStore } from '@/stores/child-store';
import { calculateAge } from '@/lib/utils';

interface DomainProgress {
  domain: string;
  currentScore: number;
  previousScore: number | null;
  trend: 'up' | 'down' | 'stable';
  change: number;
  percentile: number;
}

interface MilestoneItem {
  id: string;
  description: string;
  achievedAt: string;
  domain: string;
}

interface UpcomingMilestoneItem {
  id: string;
  description: string;
  domain: string;
  ageMonths: number;
}

export function useProgress(childId?: string) {
  return useQuery({
    queryKey: ['progress', childId],
    queryFn: async () => {
      if (!childId) return { domains: [], milestones: [], upcoming: [] };

      // Get child's age
      const child = useChildStore.getState().children.find(c => c.id === childId);
      const childAgeMonths = child
        ? calculateAge(child.dateOfBirth instanceof Date ? child.dateOfBirth.toISOString() : String(child.dateOfBirth)).months
        : 0;

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
        return { domains: [], milestones: [], upcoming: [] };
      }

      // Get domain scores for the most recent assessment
      const latestId = assessments[0].id;
      const latestCompletedAt = assessments[0].completed_at;
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

      const domainScoreMap: Record<string, number> = {};
      const domains: DomainProgress[] = (latestScores ?? []).map(score => {
        const percentile = score.percentile ?? 0;
        domainScoreMap[score.domain] = percentile;
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

      // Get explicitly tracked milestones from milestone_progress table
      const { data: trackedMilestones } = await supabase
        .from('milestone_progress')
        .select('milestone_id, status, achieved_at')
        .eq('child_id', childId)
        .eq('status', 'achieved')
        .order('achieved_at', { ascending: false })
        .limit(10);

      // Build milestones list from tracked progress + domain score derivation
      const milestones: MilestoneItem[] = [];
      const addedIds = new Set<string>();

      // First: add explicitly tracked achieved milestones
      if (trackedMilestones) {
        for (const tm of trackedMilestones) {
          const def = MILESTONES.find(m => m.id === tm.milestone_id);
          if (def && !addedIds.has(def.id)) {
            addedIds.add(def.id);
            milestones.push({
              id: def.id,
              description: def.description,
              achievedAt: tm.achieved_at ?? latestCompletedAt ?? new Date().toISOString(),
              domain: def.domain,
            });
          }
        }
      }

      // Second: derive achieved milestones from domain scores
      // Milestones at or below the child's age where the domain score meets the threshold
      if (childAgeMonths > 0) {
        const ageAppropriate = getMilestonesByAge(childAgeMonths);
        for (const ms of ageAppropriate) {
          if (addedIds.has(ms.id)) continue;
          const domainScore = domainScoreMap[ms.domain];
          if (domainScore !== undefined && domainScore >= ms.percentileAchieved) {
            addedIds.add(ms.id);
            milestones.push({
              id: ms.id,
              description: ms.description,
              achievedAt: latestCompletedAt ?? new Date().toISOString(),
              domain: ms.domain,
            });
          }
        }
      }

      // Sort by achievedAt descending, limit to 5
      milestones.sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime());
      const recentMilestones = milestones.slice(0, 5);

      // Get upcoming milestones
      const upcoming: UpcomingMilestoneItem[] = childAgeMonths > 0
        ? getUpcomingMilestones(childAgeMonths)
            .filter(m => !addedIds.has(m.id))
            .slice(0, 5)
            .map(m => ({
              id: m.id,
              description: m.description,
              domain: m.domain,
              ageMonths: m.ageMonths,
            }))
        : [];

      return { domains, milestones: recentMilestones, upcoming };
    },
    enabled: !!childId,
  });
}
