import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Calendar, FileText, Video, ChevronRight } from 'lucide-react-native';
import { mockChildren, mockAssessments, mockVideos, calculateAge } from '@/lib/mock-data';

const DOMAIN_COLORS: Record<string, string> = {
  communication: '#3b82f6',
  gross_motor: '#22c55e',
  fine_motor: '#f59e0b',
  problem_solving: '#8b5cf6',
  personal_social: '#ec4899',
};

const DOMAIN_LABELS: Record<string, string> = {
  communication: 'Communication',
  gross_motor: 'Gross Motor',
  fine_motor: 'Fine Motor',
  problem_solving: 'Problem Solving',
  personal_social: 'Personal-Social',
};

const RISK_COLORS: Record<string, string> = {
  typical: '#22c55e',
  monitoring: '#eab308',
  'at-risk': '#f97316',
  concern: '#ef4444',
};

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const child = mockChildren.find(c => c.id === id);
  const assessments = mockAssessments.filter(a => a.child_id === id);
  const videos = mockVideos.filter(v => v.child_id === id);

  if (!child) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Child not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const age = calculateAge(child.date_of_birth);
  const latestAssessment = assessments[0];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={48} color="#9ca3af" />
        </View>
        <Text style={styles.name}>{child.first_name} {child.last_name}</Text>
        <View style={styles.ageContainer}>
          <Calendar size={16} color="#6b7280" />
          <Text style={styles.ageText}>{age.display} old</Text>
        </View>
      </View>

      {/* Latest Assessment Summary */}
      {latestAssessment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Assessment</Text>
          <View style={styles.assessmentCard}>
            <View style={styles.assessmentHeader}>
              <Text style={styles.assessmentAge}>{latestAssessment.age_at_assessment} Month Questionnaire</Text>
              <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[latestAssessment.overall_risk_level] + '20' }]}>
                <Text style={[styles.riskText, { color: RISK_COLORS[latestAssessment.overall_risk_level] }]}>
                  {latestAssessment.overall_risk_level.charAt(0).toUpperCase() + latestAssessment.overall_risk_level.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.domainScores}>
              {latestAssessment.domain_scores.map((score) => (
                <View key={score.domain} style={styles.domainRow}>
                  <View style={styles.domainInfo}>
                    <View style={[styles.domainDot, { backgroundColor: DOMAIN_COLORS[score.domain] }]} />
                    <Text style={styles.domainName}>{DOMAIN_LABELS[score.domain]}</Text>
                  </View>
                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreBar}>
                      <View
                        style={[
                          styles.scoreBarFill,
                          {
                            width: `${score.percentile}%`,
                            backgroundColor: DOMAIN_COLORS[score.domain]
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.percentileText}>{score.percentile}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push(`/assessment/new?childId=${id}`)}
        >
          <View style={styles.actionIcon}>
            <FileText size={24} color="#3b82f6" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Start New Assessment</Text>
            <Text style={styles.actionSubtitle}>Complete ASQ-3 questionnaire</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Video size={24} color="#22c55e" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Record Video</Text>
            <Text style={styles.actionSubtitle}>Capture developmental milestones</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Assessment History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assessment History</Text>
        {assessments.length > 0 ? (
          assessments.map((assessment) => (
            <TouchableOpacity
              key={assessment.id}
              style={styles.historyCard}
              onPress={() => router.push(`/assessment/${assessment.id}`)}
            >
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>{assessment.age_at_assessment} Month Assessment</Text>
                <Text style={styles.historyDate}>
                  {new Date(assessment.completed_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[assessment.overall_risk_level] + '20' }]}>
                <Text style={[styles.riskText, { color: RISK_COLORS[assessment.overall_risk_level] }]}>
                  {assessment.overall_risk_level}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No assessments yet</Text>
        )}
      </View>

      {/* Videos */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <Text style={styles.sectionTitle}>Videos ({videos.length})</Text>
        {videos.length > 0 ? (
          videos.map((video) => (
            <View key={video.id} style={styles.videoCard}>
              <View style={styles.videoThumbnail}>
                <Video size={24} color="#6b7280" />
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoName}>{video.file_name}</Text>
                <Text style={styles.videoMeta}>
                  {video.duration}s • {video.context.replace('_', ' ')}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No videos recorded yet</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ageText: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  assessmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assessmentAge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  domainScores: {
    gap: 12,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  domainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  domainDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  domainName: {
    fontSize: 14,
    color: '#4b5563',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
  },
  scoreBarFill: {
    height: 6,
    borderRadius: 3,
  },
  percentileText: {
    fontSize: 12,
    color: '#6b7280',
    width: 32,
    textAlign: 'right',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  historyDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  videoThumbnail: {
    width: 64,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
  },
  videoName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  videoMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
