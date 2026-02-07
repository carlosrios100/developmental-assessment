import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Minus, ChevronDown, Star, Target } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useChildren } from '@/hooks/useChildren';
import { useProgress } from '@/hooks/useProgress';

export default function ProgressScreen() {
  const { children } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Auto-select first child
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children]);

  const selectedChild = children.find(c => c.id === selectedChildId);
  const { data: progressData, isLoading: progressLoading, error: progressError } = useProgress(selectedChildId ?? undefined);

  const domainProgress = (progressData?.domains ?? []).map(d => ({
    domain: d.domain.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    score: d.currentScore,
    trend: d.trend,
    change: d.change,
  }));

  const recentMilestones = (progressData?.milestones ?? []).map(m => ({
    id: m.id,
    description: m.description,
    achievedAt: m.achievedAt,
    domain: m.domain.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
  }));

  const upcomingMilestones = (progressData?.upcoming ?? []).map(m => ({
    id: m.id,
    description: m.description,
    domain: m.domain.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    ageMonths: m.ageMonths,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Child Selector */}
        <View style={styles.selectorSection}>
          <TouchableOpacity
            style={styles.childSelector}
            onPress={() => {
              // Cycle through children
              if (children.length > 1) {
                const currentIdx = children.findIndex(c => c.id === selectedChildId);
                const nextIdx = (currentIdx + 1) % children.length;
                setSelectedChildId(children[nextIdx].id);
              }
            }}
          >
            <View style={styles.childSelectorLeft}>
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarText}>
                  {selectedChild?.firstName?.charAt(0) || '?'}
                </Text>
              </View>
              <Text style={styles.childName}>
                {selectedChild?.firstName || 'Select Child'}
              </Text>
            </View>
            <ChevronDown size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Overall Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Development Overview
          </Text>

          {children.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>Add a child first to see their developmental progress.</Text>
            </View>
          ) : progressLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : progressError ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.errorTitle}>Unable to Load Progress</Text>
              <Text style={styles.errorText}>Please check your connection and try again.</Text>
            </View>
          ) : domainProgress.length > 0 ? (
            <View style={styles.progressCard}>
              {domainProgress.map((item, index) => (
                <DomainProgressBar
                  key={item.domain}
                  domain={item.domain}
                  score={item.score}
                  trend={item.trend as 'up' | 'down' | 'stable'}
                  change={item.change}
                  isLast={index === domainProgress.length - 1}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No progress data yet. Complete an assessment first.</Text>
            </View>
          )}
        </View>

        {/* Score Legend */}
        <View style={styles.legendSection}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>On Track (75+)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Monitor (50-74)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Review (&lt;50)</Text>
            </View>
          </View>
        </View>

        {/* Recent Milestones */}
        <View style={styles.milestonesSection}>
          <Text style={styles.sectionTitle}>
            Recent Milestones
          </Text>

          <View style={styles.milestonesCard}>
            {recentMilestones.length === 0 ? (
              <View style={styles.milestonesEmpty}>
                <Text style={styles.emptyStateText}>No milestones recorded yet. Complete an assessment to track milestones.</Text>
              </View>
            ) : null}
            {recentMilestones.map((milestone, index) => (
              <View
                key={milestone.id}
                style={[
                  styles.milestoneItem,
                  index < recentMilestones.length - 1 ? styles.milestoneItemBorder : undefined,
                ]}
              >
                <View style={styles.milestoneIcon}>
                  <Star size={16} color="#22c55e" />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneDescription}>
                    {milestone.description}
                  </Text>
                  <Text style={styles.milestoneMeta}>
                    {milestone.domain} •{' '}
                    {new Date(milestone.achievedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Milestones */}
        {upcomingMilestones.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>
              Coming Up Next
            </Text>

            <View style={styles.milestonesCard}>
              {upcomingMilestones.map((milestone, index) => (
                <View
                  key={milestone.id}
                  style={[
                    styles.milestoneItem,
                    index < upcomingMilestones.length - 1 ? styles.milestoneItemBorder : undefined,
                  ]}
                >
                  <View style={styles.upcomingIcon}>
                    <Target size={16} color="#3b82f6" />
                  </View>
                  <View style={styles.milestoneContent}>
                    <Text style={styles.milestoneDescription}>
                      {milestone.description}
                    </Text>
                    <Text style={styles.milestoneMeta}>
                      {milestone.domain} • ~{milestone.ageMonths} months
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DomainProgressBar({
  domain,
  score,
  trend,
  change,
  isLast,
}: {
  domain: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  isLast: boolean;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#9ca3af';

  return (
    <View style={!isLast ? styles.domainItemWithBorder : undefined}>
      <View style={styles.domainHeader}>
        <Text style={styles.domainLabel}>{domain}</Text>
        <View style={styles.domainScoreRow}>
          <Text style={styles.domainScore}>{score}%</Text>
          <TrendIcon size={14} color={trendColor} />
          {change !== 0 && (
            <Text style={[styles.domainChange, { color: trendColor }]}>
              {change > 0 ? '+' : ''}{change}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${score}%`,
              backgroundColor: getScoreColor(score),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  selectorSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  childSelector: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  childSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  childName: {
    color: '#1f2937',
    fontWeight: '600',
    marginLeft: 12,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorTitle: {
    color: '#1f2937',
    fontWeight: '600',
  },
  errorText: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  legendSection: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    color: '#6b7280',
    fontSize: 12,
  },
  milestonesSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  upcomingSection: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  upcomingIcon: {
    backgroundColor: '#dbeafe',
    borderRadius: 9999,
    padding: 8,
  },
  milestonesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  milestonesEmpty: {
    padding: 32,
    alignItems: 'center',
  },
  milestoneItem: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  milestoneIcon: {
    backgroundColor: '#dcfce7',
    borderRadius: 9999,
    padding: 8,
  },
  milestoneContent: {
    flex: 1,
    marginLeft: 12,
  },
  milestoneDescription: {
    color: '#1f2937',
    fontWeight: '500',
  },
  milestoneMeta: {
    color: '#6b7280',
    fontSize: 14,
  },
  // DomainProgressBar styles
  domainItemWithBorder: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  domainLabel: {
    color: '#374151',
    fontWeight: '500',
  },
  domainScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainScore: {
    color: '#1f2937',
    fontWeight: '700',
    marginRight: 8,
  },
  domainChange: {
    fontSize: 12,
    marginLeft: 4,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 9999,
  },
});
