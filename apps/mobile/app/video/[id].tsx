import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Activity, Eye, MessageCircle, Smile, Hand, Brain,
  Clock, CheckCircle, AlertTriangle, BarChart3
} from 'lucide-react-native';
import { useVideo, useVideoAnalysis } from '@/hooks/useVideos';
import { useChild } from '@/hooks/useChildren';

const CONTEXT_LABELS: Record<string, string> = {
  free_play: 'Free Play',
  structured_activity: 'Structured Activity',
  caregiver_interaction: 'Caregiver Interaction',
  feeding: 'Feeding',
  book_reading: 'Book Reading',
  physical_activity: 'Physical Activity',
  peer_interaction: 'Peer Interaction',
  self_care_routine: 'Self-Care Routine',
};

const MOVEMENT_QUALITY_COLORS: Record<string, string> = {
  smooth: '#22c55e',
  coordinated: '#3b82f6',
  jerky: '#f59e0b',
  uncoordinated: '#ef4444',
};

function MetricCard({ icon: Icon, label, value, subtext, color = '#3b82f6' }: {
  icon: any;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <View style={metricStyles.card}>
      <View style={[metricStyles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={metricStyles.value}>{value}</Text>
      <Text style={metricStyles.label}>{label}</Text>
      {subtext && <Text style={metricStyles.subtext}>{subtext}</Text>}
    </View>
  );
}

function ProgressBar({ value, maxValue = 1, color = '#3b82f6', label }: {
  value: number;
  maxValue?: number;
  color?: string;
  label: string;
}) {
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100);
  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.labelRow}>
        <Text style={progressStyles.label}>{label}</Text>
        <Text style={[progressStyles.value, { color }]}>{percentage}%</Text>
      </View>
      <View style={progressStyles.track}>
        <View style={[progressStyles.fill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: video, isLoading: videoLoading } = useVideo(id);
  const { data: analysis, isLoading: analysisLoading, error: analysisError } = useVideoAnalysis(id);
  const { child } = useChild(video?.childId);

  if (videoLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!video) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Video not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAnalyzed = video.processingStatus === 'completed';
  const movement = analysis?.movementMetrics;
  const interaction = analysis?.interactionMetrics;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{CONTEXT_LABELS[video.context] ?? video.context}</Text>
          <Text style={styles.subtitle}>
            {child?.firstName ?? 'Child'} - {video.recordedAt.toLocaleDateString()}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: isAnalyzed ? '#dcfce7' : '#fef3c7' },
        ]}>
          {isAnalyzed ? (
            <CheckCircle size={14} color="#16a34a" />
          ) : (
            <Clock size={14} color="#d97706" />
          )}
          <Text style={[
            styles.statusText,
            { color: isAnalyzed ? '#16a34a' : '#d97706' },
          ]}>
            {isAnalyzed ? 'Analyzed' : video.processingStatus}
          </Text>
        </View>
      </View>

      {/* Video Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoChip}>
          <Clock size={14} color="#6b7280" />
          <Text style={styles.infoChipText}>{video.duration}s</Text>
        </View>
        <View style={styles.infoChip}>
          <BarChart3 size={14} color="#6b7280" />
          <Text style={styles.infoChipText}>
            Confidence: {analysis ? Math.round(analysis.confidence * 100) + '%' : '--'}
          </Text>
        </View>
      </View>

      {/* Analysis Loading / Error / Not Available */}
      {!isAnalyzed && (
        <View style={styles.pendingCard}>
          <Clock size={32} color="#d97706" />
          <Text style={styles.pendingTitle}>Analysis Pending</Text>
          <Text style={styles.pendingText}>
            Video analysis is still processing. Results will appear here once complete.
          </Text>
        </View>
      )}

      {isAnalyzed && analysisLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading analysis...</Text>
        </View>
      )}

      {isAnalyzed && analysisError && (
        <View style={styles.pendingCard}>
          <AlertTriangle size={32} color="#ef4444" />
          <Text style={styles.pendingTitle}>Results Unavailable</Text>
          <Text style={styles.pendingText}>
            Could not load analysis results. The data may still be processing.
          </Text>
        </View>
      )}

      {/* Movement Metrics */}
      {isAnalyzed && movement && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movement Analysis</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon={Activity}
              label="Quality"
              value={movement.movementQuality.charAt(0).toUpperCase() + movement.movementQuality.slice(1)}
              color={MOVEMENT_QUALITY_COLORS[movement.movementQuality] ?? '#6b7280'}
            />
            <MetricCard
              icon={Hand}
              label="Midline Crossing"
              value={movement.crossingMidline ? 'Yes' : 'No'}
              color={movement.crossingMidline ? '#22c55e' : '#ef4444'}
            />
          </View>

          <View style={styles.progressSection}>
            <ProgressBar
              label="Bilateral Coordination"
              value={movement.bilateralCoordination}
              color="#3b82f6"
            />
            <ProgressBar
              label="Posture Stability"
              value={movement.postureStability}
              color="#8b5cf6"
            />
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{movement.distanceTraversed.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Distance (px)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{movement.averageSpeed.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Speed</Text>
            </View>
          </View>
        </View>
      )}

      {/* Interaction Metrics */}
      {isAnalyzed && interaction && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social & Interaction</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon={Eye}
              label="Eye Contact"
              value={`${Math.round(interaction.eyeContactPercentage)}%`}
              subtext={`${interaction.eyeContactDuration.toFixed(1)}s total`}
              color="#3b82f6"
            />
            <MetricCard
              icon={Smile}
              label="Positive Affect"
              value={interaction.positiveAffectInstances}
              subtext="instances"
              color="#22c55e"
            />
            <MetricCard
              icon={MessageCircle}
              label="Vocalizations"
              value={interaction.vocalizations}
              subtext={`${interaction.vocalizationDuration.toFixed(1)}s`}
              color="#8b5cf6"
            />
            <MetricCard
              icon={Brain}
              label="Turn-Taking"
              value={interaction.turnTakingInstances}
              subtext="interactions"
              color="#f59e0b"
            />
          </View>

          <View style={styles.progressSection}>
            <ProgressBar
              label="Responsiveness to Cues"
              value={interaction.responsivenessToCues}
              color="#ec4899"
            />
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{interaction.jointAttentionEpisodes}</Text>
              <Text style={styles.statLabel}>Joint Attention</Text>
            </View>
          </View>
        </View>
      )}

      {/* Detected Behaviors */}
      {isAnalyzed && analysis?.behaviors && analysis.behaviors.length > 0 && (
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>Detected Behaviors</Text>
          {analysis.behaviors.map((behavior, index) => (
            <View key={index} style={styles.behaviorCard}>
              <View style={styles.behaviorHeader}>
                <View style={[styles.behaviorDot, {
                  backgroundColor: behavior.confidence > 0.7 ? '#22c55e' : behavior.confidence > 0.4 ? '#f59e0b' : '#ef4444'
                }]} />
                <Text style={styles.behaviorType}>
                  {behavior.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Text>
                <Text style={styles.behaviorTime}>
                  {behavior.startTime.toFixed(1)}s - {behavior.endTime.toFixed(1)}s
                </Text>
              </View>
              <Text style={styles.behaviorDescription}>{behavior.description}</Text>
              {behavior.relatedMilestones.length > 0 && (
                <View style={styles.milestoneTags}>
                  {behavior.relatedMilestones.map((m, i) => (
                    <View key={i} style={styles.milestoneTag}>
                      <Text style={styles.milestoneTagText}>
                        {m.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#3b82f6', borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  backArrow: { marginRight: 12 },
  headerContent: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
  },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb',
  },
  infoChipText: { fontSize: 13, color: '#6b7280' },
  pendingCard: {
    margin: 16, padding: 24, backgroundColor: '#fff', borderRadius: 12,
    alignItems: 'center', gap: 8,
  },
  pendingTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  pendingText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  section: { margin: 16, marginBottom: 0 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  progressSection: { marginTop: 16, gap: 12 },
  statRow: {
    flexDirection: 'row', gap: 16, marginTop: 16,
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  behaviorCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  behaviorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  behaviorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  behaviorType: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1f2937' },
  behaviorTime: { fontSize: 12, color: '#9ca3af' },
  behaviorDescription: { fontSize: 13, color: '#4b5563', lineHeight: 18 },
  milestoneTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  milestoneTag: {
    backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  milestoneTagText: { fontSize: 11, color: '#3b82f6', textTransform: 'capitalize' },
});

const metricStyles = StyleSheet.create({
  card: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  value: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  label: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  subtext: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
});

const progressStyles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  value: { fontSize: 14, fontWeight: '700' },
  track: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
