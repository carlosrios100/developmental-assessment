import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useAssessment } from '@/hooks/useAssessments';
import { useChild } from '@/hooks/useChildren';
import { calculateAge } from '@/lib/utils';

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

const RISK_DESCRIPTIONS: Record<string, string> = {
  typical: 'Development appears to be on schedule. Continue with regular monitoring.',
  monitoring: 'Some areas may benefit from additional activities. Consider follow-up in 2-3 months.',
  'at-risk': 'Development in some areas is below expectations. Professional consultation recommended.',
  concern: 'Significant delays detected. Please consult with a developmental specialist.',
};

export default function AssessmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assessment, isLoading: assessmentLoading } = useAssessment(id);
  const { child, isLoading: childLoading } = useChild(assessment?.child_id);

  if (assessmentLoading || childLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!assessment || !child) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Assessment not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const completedDate = assessment.completed_at ? new Date(assessment.completed_at) : null;
  const riskLevel = assessment.overall_risk_level ?? 'typical';
  const riskColor = RISK_COLORS[riskLevel];

  return (
    <ScrollView style={styles.container}>
      {/* Header Summary */}
      <View style={[styles.header, { backgroundColor: riskColor + '10' }]}>
        <View style={[styles.statusIcon, { backgroundColor: riskColor + '20' }]}>
          {riskLevel === 'typical' ? (
            <CheckCircle size={32} color={riskColor} />
          ) : (
            <AlertCircle size={32} color={riskColor} />
          )}
        </View>
        <Text style={[styles.statusTitle, { color: riskColor }]}>
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
        </Text>
        <Text style={styles.statusDescription}>
          {RISK_DESCRIPTIONS[riskLevel]}
        </Text>
      </View>

      {/* Assessment Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Calendar size={20} color="#6b7280" />
            <View>
              <Text style={styles.infoLabel}>Completed</Text>
              <Text style={styles.infoValue}>{completedDate?.toLocaleDateString() ?? 'In progress'}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Clock size={20} color="#6b7280" />
            <View>
              <Text style={styles.infoLabel}>Age at Assessment</Text>
              <Text style={styles.infoValue}>{assessment.age_at_assessment} months</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.childCard}
          onPress={() => router.push(`/child/${child.id}`)}
        >
          <Text style={styles.childName}>{child.firstName} {child.lastName || ''}</Text>
          <Text style={styles.childAge}>
            Current age: {calculateAge(child.dateOfBirth instanceof Date ? child.dateOfBirth.toISOString() : String(child.dateOfBirth)).display}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Domain Scores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Domain Scores</Text>

        {(assessment.domain_scores ?? []).map((score) => (
          <View key={score.domain} style={styles.domainCard}>
            <View style={styles.domainHeader}>
              <View style={[styles.domainIndicator, { backgroundColor: DOMAIN_COLORS[score.domain] }]} />
              <Text style={styles.domainName}>{DOMAIN_LABELS[score.domain]}</Text>
              <View style={[styles.domainRiskBadge, { backgroundColor: RISK_COLORS[score.risk_level] + '20' }]}>
                <Text style={[styles.domainRiskText, { color: RISK_COLORS[score.risk_level] }]}>
                  {score.risk_level}
                </Text>
              </View>
            </View>

            <View style={styles.scoreDetails}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Raw Score</Text>
                <Text style={styles.scoreValue}>{score.raw_score}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Percentile</Text>
                <Text style={styles.scoreValue}>{score.percentile}%</Text>
              </View>
            </View>

            <View style={styles.percentileBar}>
              <View
                style={[
                  styles.percentileFill,
                  {
                    width: `${score.percentile}%`,
                    backgroundColor: DOMAIN_COLORS[score.domain]
                  }
                ]}
              />
              <View style={styles.percentileMarkers}>
                <View style={[styles.marker, { left: '25%' }]} />
                <View style={[styles.marker, { left: '50%' }]} />
                <View style={[styles.marker, { left: '75%' }]} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationText}>
            Based on the assessment results, here are some suggested next steps:
          </Text>
          <View style={styles.recommendationList}>
            {riskLevel === 'typical' && (
              <>
                <Text style={styles.recommendationItem}>• Continue age-appropriate play activities</Text>
                <Text style={styles.recommendationItem}>• Schedule next assessment in 2-4 months</Text>
                <Text style={styles.recommendationItem}>• Record milestone videos for progress tracking</Text>
              </>
            )}
            {riskLevel === 'monitoring' && (
              <>
                <Text style={styles.recommendationItem}>• Focus on activities for lower-scoring domains</Text>
                <Text style={styles.recommendationItem}>• Re-assess in 6-8 weeks</Text>
                <Text style={styles.recommendationItem}>• Consider discussing with pediatrician</Text>
              </>
            )}
          </View>
        </View>
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
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoSection: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  childCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  childAge: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
  domainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  domainIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  domainName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  domainRiskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  domainRiskText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scoreDetails: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  percentileBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  percentileFill: {
    height: 8,
    borderRadius: 4,
  },
  percentileMarkers: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  marker: {
    position: 'absolute',
    width: 1,
    height: 8,
    backgroundColor: '#ffffff50',
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  recommendationText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  recommendationList: {
    gap: 8,
  },
  recommendationItem: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 22,
  },
});
