import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  FileText,
  Share2,
  Home,
  RotateCcw,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Activity,
  Hand,
  Lightbulb,
  Users,
  Info,
} from 'lucide-react-native';
import { mockChildren } from '@/lib/mock-data';

interface DomainScore {
  score: number;
  total: number;
}

const DOMAINS = [
  { id: 'communication', name: 'Communication', icon: MessageCircle, color: '#3b82f6', emoji: '💬' },
  { id: 'gross_motor', name: 'Gross Motor', icon: Activity, color: '#22c55e', emoji: '🏃' },
  { id: 'fine_motor', name: 'Fine Motor', icon: Hand, color: '#f59e0b', emoji: '✋' },
  { id: 'problem_solving', name: 'Problem Solving', icon: Lightbulb, color: '#8b5cf6', emoji: '💡' },
  { id: 'personal_social', name: 'Personal-Social', icon: Users, color: '#ec4899', emoji: '👥' },
];

// Cutoff scores (simplified for demo - real ASQ-3 has age-specific cutoffs)
const CUTOFFS = {
  typical: 40, // >= 40 is typical
  monitoring: 25, // 25-39 is monitoring zone
  // < 25 is concern
};

function getRiskLevel(score: number): 'typical' | 'monitoring' | 'concern' {
  if (score >= CUTOFFS.typical) return 'typical';
  if (score >= CUTOFFS.monitoring) return 'monitoring';
  return 'concern';
}

function getOverallRisk(scores: Record<string, DomainScore>): 'typical' | 'monitoring' | 'concern' {
  const riskLevels = Object.values(scores).map(s => getRiskLevel(s.score));
  if (riskLevels.includes('concern')) return 'concern';
  if (riskLevels.includes('monitoring')) return 'monitoring';
  return 'typical';
}

const RISK_CONFIG = {
  typical: {
    color: '#22c55e',
    bgColor: '#f0fdf4',
    borderColor: '#dcfce7',
    icon: CheckCircle,
    title: 'On Track',
    message: 'Your child\'s development appears to be progressing well in all areas.',
  },
  monitoring: {
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fef3c7',
    icon: AlertTriangle,
    title: 'Monitor',
    message: 'Some areas may benefit from additional activities. Consider reassessing in 2-3 months.',
  },
  concern: {
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fee2e2',
    icon: AlertCircle,
    title: 'Further Evaluation Recommended',
    message: 'We recommend discussing these results with your child\'s healthcare provider.',
  },
};

export default function ScreeningResults() {
  const { childId, age, scores: scoresParam } = useLocalSearchParams<{
    childId: string;
    age: string;
    scores: string;
  }>();

  const child = mockChildren.find(c => c.id === childId);
  const ageMonths = parseInt(age || '12', 10);
  const scores: Record<string, DomainScore> = scoresParam ? JSON.parse(scoresParam) : {};

  const overallRisk = getOverallRisk(scores);
  const riskConfig = RISK_CONFIG[overallRisk];
  const RiskIcon = riskConfig.icon;

  const totalScore = Object.values(scores).reduce((sum, s) => sum + s.score, 0);
  const maxScore = Object.values(scores).reduce((sum, s) => sum + s.total, 0);
  const overallPercentage = Math.round((totalScore / maxScore) * 100);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnims = useRef(DOMAINS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Domain progress animations
    DOMAINS.forEach((domain, index) => {
      const score = scores[domain.id]?.score || 0;
      const percentage = (score / 60) * 100;

      setTimeout(() => {
        Animated.timing(progressAnims[index], {
          toValue: percentage,
          duration: 800,
          useNativeDriver: false,
        }).start();
      }, 300 + index * 100);
    });
  }, []);

  const shareResults = async () => {
    try {
      await Share.share({
        message: `${child?.first_name}'s ${ageMonths}-Month Developmental Screening Results\n\nOverall: ${riskConfig.title} (${overallPercentage}%)\n\n${DOMAINS.map(d => `${d.name}: ${scores[d.id]?.score || 0}/60`).join('\n')}\n\nScreened with DevAssess`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: riskConfig.bgColor, borderColor: riskConfig.borderColor },
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.headerIcon, { backgroundColor: riskConfig.color + '20' }]}>
            <RiskIcon size={40} color={riskConfig.color} />
          </View>
          <Text style={[styles.headerTitle, { color: riskConfig.color }]}>
            {riskConfig.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            {child?.first_name}'s {ageMonths}-Month Screening
          </Text>
          <View style={styles.overallScore}>
            <Text style={styles.overallScoreValue}>{overallPercentage}%</Text>
            <Text style={styles.overallScoreLabel}>Overall Score</Text>
          </View>
        </Animated.View>

        {/* Message */}
        <View style={styles.messageCard}>
          <Info size={20} color="#6b7280" />
          <Text style={styles.messageText}>{riskConfig.message}</Text>
        </View>

        {/* Domain Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Domain Scores</Text>
          <View style={styles.domainsList}>
            {DOMAINS.map((domain, index) => {
              const score = scores[domain.id]?.score || 0;
              const risk = getRiskLevel(score);
              const percentage = Math.round((score / 60) * 100);

              return (
                <Animated.View key={domain.id} style={styles.domainCard}>
                  <View style={styles.domainHeader}>
                    <View style={styles.domainLeft}>
                      <Text style={styles.domainEmoji}>{domain.emoji}</Text>
                      <View>
                        <Text style={styles.domainName}>{domain.name}</Text>
                        <Text style={styles.domainScore}>{score} / 60 points</Text>
                      </View>
                    </View>
                    <View style={[
                      styles.domainBadge,
                      { backgroundColor: RISK_CONFIG[risk].bgColor }
                    ]}>
                      <Text style={[styles.domainBadgeText, { color: RISK_CONFIG[risk].color }]}>
                        {RISK_CONFIG[risk].title}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.domainProgressContainer}>
                    <View style={styles.domainProgressBar}>
                      <Animated.View
                        style={[
                          styles.domainProgressFill,
                          {
                            backgroundColor: domain.color,
                            width: progressAnims[index].interpolate({
                              inputRange: [0, 100],
                              outputRange: ['0%', '100%'],
                            }),
                          },
                        ]}
                      />
                      {/* Cutoff markers */}
                      <View style={[styles.cutoffMarker, { left: `${(CUTOFFS.monitoring / 60) * 100}%` }]} />
                      <View style={[styles.cutoffMarker, { left: `${(CUTOFFS.typical / 60) * 100}%` }]} />
                    </View>
                    <Text style={styles.domainPercentage}>{percentage}%</Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Cutoff Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Score Interpretation</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>40-60: On Track</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>25-39: Monitor</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>0-24: Evaluate</Text>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationsCard}>
            {overallRisk === 'typical' && (
              <>
                <RecommendationItem
                  icon="✅"
                  title="Continue Current Activities"
                  description="Keep engaging in age-appropriate play and learning activities."
                />
                <RecommendationItem
                  icon="📅"
                  title="Schedule Next Screening"
                  description="Plan another screening in 4-6 months to track progress."
                />
                <RecommendationItem
                  icon="📱"
                  title="Record Milestone Videos"
                  description="Capture videos of new skills for your records."
                />
              </>
            )}
            {overallRisk === 'monitoring' && (
              <>
                <RecommendationItem
                  icon="🎯"
                  title="Focus Activities"
                  description="Try activities that target the domains in the monitoring zone."
                />
                <RecommendationItem
                  icon="📅"
                  title="Rescreen in 6-8 Weeks"
                  description="Complete another screening to check for improvement."
                />
                <RecommendationItem
                  icon="👨‍⚕️"
                  title="Consider Consultation"
                  description="Discuss results with your pediatrician at next visit."
                />
              </>
            )}
            {overallRisk === 'concern' && (
              <>
                <RecommendationItem
                  icon="👨‍⚕️"
                  title="Contact Healthcare Provider"
                  description="Schedule an appointment to discuss these results."
                />
                <RecommendationItem
                  icon="📋"
                  title="Request Formal Evaluation"
                  description="Ask about a comprehensive developmental evaluation."
                />
                <RecommendationItem
                  icon="🤝"
                  title="Explore Early Intervention"
                  description="Early intervention services can help support development."
                />
              </>
            )}
          </View>
        </View>

        {/* AI Report Banner */}
        <TouchableOpacity
          style={styles.aiReportBanner}
          onPress={() => router.push('/(tabs)/reports')}
        >
          <View style={styles.aiReportIcon}>
            <Sparkles size={24} color="#3b82f6" />
          </View>
          <View style={styles.aiReportContent}>
            <Text style={styles.aiReportTitle}>Generate AI Report</Text>
            <Text style={styles.aiReportDesc}>Get detailed insights and personalized recommendations</Text>
          </View>
          <ChevronRight size={20} color="#3b82f6" />
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={shareResults}>
            <Share2 size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Share Results</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/reports')}
          >
            <FileText size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>View Report</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Home size={20} color="#6b7280" />
            <Text style={styles.navButtonText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={() => router.replace('/screening')}
          >
            <RotateCcw size={20} color="#ffffff" />
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>New Screening</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This screening tool is based on the ASQ-3 methodology and is intended for informational purposes only.
            It is not a diagnostic tool. Always consult with qualified healthcare professionals for clinical decisions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecommendationItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.recommendationItem}>
      <Text style={styles.recommendationIcon}>{icon}</Text>
      <View style={styles.recommendationContent}>
        <Text style={styles.recommendationTitle}>{title}</Text>
        <Text style={styles.recommendationDesc}>{description}</Text>
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
  header: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  overallScore: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    width: '100%',
  },
  overallScoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1f2937',
  },
  overallScoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  domainsList: {
    gap: 12,
  },
  domainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  domainLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  domainEmoji: {
    fontSize: 28,
  },
  domainName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  domainScore: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  domainBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  domainBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  domainProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  domainProgressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  domainProgressFill: {
    height: 10,
    borderRadius: 5,
  },
  cutoffMarker: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  domainPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    width: 45,
    textAlign: 'right',
  },
  legendCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#4b5563',
  },
  recommendationsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendationIcon: {
    fontSize: 24,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  recommendationDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 20,
  },
  aiReportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  aiReportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiReportContent: {
    flex: 1,
  },
  aiReportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  aiReportDesc: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  navButtonPrimary: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  navButtonTextPrimary: {
    color: '#ffffff',
  },
  disclaimer: {
    padding: 16,
    paddingBottom: 32,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});
