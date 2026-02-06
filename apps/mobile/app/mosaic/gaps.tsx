import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  Book,
  Smartphone,
  Users,
  MapPin,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { useMosaicStore } from '@/stores/mosaic-store';
import type { MosaicGapAnalysis } from '@devassess/shared';

export default function GapsScreen() {
  const { gapAnalysis, isLoading } = useMosaicStore();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading gap analysis...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const criticalGaps = gapAnalysis.filter(g => g.priority === 'critical');
  const highGaps = gapAnalysis.filter(g => g.priority === 'high');
  const mediumGaps = gapAnalysis.filter(g => g.priority === 'medium');
  const lowGaps = gapAnalysis.filter(g => g.priority === 'low');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Growth Areas</Text>
          <Text style={styles.headerSubtitle}>
            Skill gaps and resources to help your child thrive
          </Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{gapAnalysis.length}</Text>
              <Text style={styles.summaryLabel}>Areas Identified</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                {criticalGaps.length + highGaps.length}
              </Text>
              <Text style={styles.summaryLabel}>Priority Focus</Text>
            </View>
          </View>
        </View>

        {/* Critical Gaps */}
        {criticalGaps.length > 0 && (
          <GapSection
            title="Critical Focus"
            icon={AlertCircle}
            iconColor="#dc2626"
            gaps={criticalGaps}
          />
        )}

        {/* High Priority */}
        {highGaps.length > 0 && (
          <GapSection
            title="High Priority"
            icon={TrendingUp}
            iconColor="#f59e0b"
            gaps={highGaps}
          />
        )}

        {/* Medium Priority */}
        {mediumGaps.length > 0 && (
          <GapSection
            title="Opportunities"
            icon={CheckCircle}
            iconColor="#22c55e"
            gaps={mediumGaps}
          />
        )}

        {/* Low Priority */}
        {lowGaps.length > 0 && (
          <GapSection
            title="Keep in Mind"
            icon={CheckCircle}
            iconColor="#6b7280"
            gaps={lowGaps}
          />
        )}

        {gapAnalysis.length === 0 && (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color="#22c55e" />
            <Text style={styles.emptyTitle}>Looking Great!</Text>
            <Text style={styles.emptyText}>
              No significant gaps identified. Continue nurturing your child's development!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GapSection({
  title,
  icon: Icon,
  iconColor,
  gaps,
}: {
  title: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  gaps: MosaicGapAnalysis[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon size={20} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {gaps.map((gap) => (
        <GapCard key={gap.id} gap={gap} />
      ))}
    </View>
  );
}

function GapCard({ gap }: { gap: MosaicGapAnalysis }) {
  const priorityColors = {
    critical: '#dc2626',
    high: '#f59e0b',
    medium: '#22c55e',
    low: '#6b7280',
  };

  const openLink = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.gapCard}>
      <View style={styles.gapHeader}>
        <View style={styles.gapTitleRow}>
          <View
            style={[
              styles.priorityDot,
              { backgroundColor: priorityColors[gap.priority as keyof typeof priorityColors] },
            ]}
          />
          <Text style={styles.gapTitle}>{gap.gapName}</Text>
        </View>
        {gap.estimatedEffort && (
          <Text style={styles.effortBadge}>{gap.estimatedEffort}</Text>
        )}
      </View>

      {gap.gapDescription && (
        <Text style={styles.gapDescription}>{gap.gapDescription}</Text>
      )}

      {/* Progress Bar */}
      {gap.currentLevel !== undefined && gap.targetLevel !== undefined && (
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Current: {Math.round(gap.currentLevel)}</Text>
            <Text style={styles.progressLabel}>Target: {Math.round(gap.targetLevel)}</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(gap.currentLevel / gap.targetLevel) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Resources */}
      {gap.matchedResources && gap.matchedResources.length > 0 && (
        <View style={styles.resourcesSection}>
          <Text style={styles.resourcesTitle}>Recommended Resources</Text>
          {gap.matchedResources.slice(0, 3).map((resource: any, i: number) => (
            <TouchableOpacity
              key={i}
              style={styles.resourceItem}
              onPress={() => openLink(resource.url)}
              disabled={!resource.url}
            >
              <View style={styles.resourceIcon}>
                {resource.resourceType === 'app' ? (
                  <Smartphone size={16} color="#6366f1" />
                ) : resource.resourceType === 'book' ? (
                  <Book size={16} color="#6366f1" />
                ) : (
                  <Users size={16} color="#6366f1" />
                )}
              </View>
              <View style={styles.resourceContent}>
                <Text style={styles.resourceName}>{resource.name}</Text>
                <Text style={styles.resourceDescription}>{resource.description}</Text>
              </View>
              {resource.url && <ExternalLink size={16} color="#9ca3af" />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Local Programs */}
      {gap.localPrograms && gap.localPrograms.length > 0 && (
        <View style={styles.programsSection}>
          <View style={styles.programsHeader}>
            <MapPin size={16} color="#22c55e" />
            <Text style={styles.programsTitle}>Local Programs</Text>
          </View>
          {gap.localPrograms.slice(0, 2).map((program: any, i: number) => (
            <TouchableOpacity
              key={i}
              style={styles.programItem}
              onPress={() => openLink(program.url)}
              disabled={!program.url}
            >
              <View style={styles.programContent}>
                <Text style={styles.programName}>{program.name}</Text>
                <Text style={styles.programOrg}>{program.organization}</Text>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  summaryCard: {
    margin: 16,
    marginTop: -16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22c55e',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  gapCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  gapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  gapTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  effortBadge: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gapDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  resourcesSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  resourcesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6366f115',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  resourceContent: {
    flex: 1,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  resourceDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  programsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  programsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  programsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e',
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  programContent: {
    flex: 1,
  },
  programName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  programOrg: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  emptyState: {
    margin: 16,
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
