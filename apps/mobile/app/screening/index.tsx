import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Baby,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Info,
  Sparkles,
  CheckCircle,
} from 'lucide-react-native';
import { useChildren } from '@/hooks/useChildren';
import { useRecentAssessments } from '@/hooks/useAssessments';
import { calculateAge } from '@/lib/mock-data';

const AGE_INTERVALS = [2, 4, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 27, 30, 33, 36, 42, 48, 54, 60];

function getRecommendedInterval(ageInMonths: number): number {
  // Find the closest age interval
  let closest = AGE_INTERVALS[0];
  let minDiff = Math.abs(ageInMonths - closest);

  for (const interval of AGE_INTERVALS) {
    const diff = Math.abs(ageInMonths - interval);
    if (diff < minDiff) {
      minDiff = diff;
      closest = interval;
    }
  }
  return closest;
}

export default function ScreeningStartScreen() {
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const { children } = useChildren();
  const { data: allAssessments = [] } = useRecentAssessments();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  // Pre-select child if childId is passed from URL
  useEffect(() => {
    if (childId) {
      const child = children.find(c => c.id === childId);
      if (child) {
        const dob = child.dateOfBirth instanceof Date ? child.dateOfBirth.toISOString() : String(child.dateOfBirth);
        const age = calculateAge(dob);
        setSelectedChild(childId);
        setSelectedAge(getRecommendedInterval(age.months));
      }
    }
  }, [childId, children]);

  const selectedChildData = children.find(c => c.id === selectedChild);
  const childAge = selectedChildData ? calculateAge(
    selectedChildData.dateOfBirth instanceof Date
      ? selectedChildData.dateOfBirth.toISOString()
      : String(selectedChildData.dateOfBirth)
  ) : null;
  const recommendedAge = childAge ? getRecommendedInterval(childAge.months) : null;

  const childAssessments = selectedChild
    ? allAssessments.filter(a => a.child_id === selectedChild)
    : [];

  const startScreening = () => {
    if (!selectedChild || !selectedAge) return;
    router.push(`/screening/${selectedAge}?childId=${selectedChild}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <ClipboardCheck size={32} color="#3b82f6" />
          </View>
          <Text style={styles.headerTitle}>Developmental Milestone Screener</Text>
          <Text style={styles.headerSubtitle}>
            Evidence-based screening based on ASQ-3 methodology
          </Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Info size={20} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About This Screening</Text>
            <Text style={styles.infoText}>
              This screener evaluates 5 developmental domains with 6 questions each.
              It takes approximately 10-15 minutes to complete.
            </Text>
          </View>
        </View>

        {/* Select Child */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Child</Text>
          <View style={styles.childList}>
            {children.map((child) => {
              const dob = child.dateOfBirth instanceof Date ? child.dateOfBirth.toISOString() : String(child.dateOfBirth);
              const age = calculateAge(dob);
              const isSelected = selectedChild === child.id;
              const lastAssessment = allAssessments.find(a => a.child_id === child.id);

              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childCard, isSelected && styles.childCardSelected]}
                  onPress={() => {
                    setSelectedChild(child.id);
                    setSelectedAge(getRecommendedInterval(age.months));
                  }}
                >
                  <View style={[styles.childAvatar, isSelected && styles.childAvatarSelected]}>
                    <Text style={[styles.childAvatarText, isSelected && styles.childAvatarTextSelected]}>
                      {child.firstName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.childInfo}>
                    <Text style={[styles.childName, isSelected && styles.childNameSelected]}>
                      {child.firstName} {child.lastName || ''}
                    </Text>
                    <Text style={styles.childAge}>{age.display} old</Text>
                    {lastAssessment && (
                      <Text style={styles.lastAssessment}>
                        Last screening: {new Date(lastAssessment.completed_at || '').toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  {isSelected && <CheckCircle size={24} color="#3b82f6" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Select Age Interval */}
        {selectedChild && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Questionnaire</Text>
            <Text style={styles.sectionHint}>
              Based on {selectedChildData?.firstName}'s age, we recommend the {recommendedAge}-month questionnaire
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.ageScroll}
              contentContainerStyle={styles.ageScrollContent}
            >
              {AGE_INTERVALS.map((age) => {
                const isSelected = selectedAge === age;
                const isRecommended = age === recommendedAge;

                return (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.ageChip,
                      isSelected && styles.ageChipSelected,
                      isRecommended && !isSelected && styles.ageChipRecommended,
                    ]}
                    onPress={() => setSelectedAge(age)}
                  >
                    {isRecommended && (
                      <Sparkles size={12} color={isSelected ? '#ffffff' : '#f59e0b'} />
                    )}
                    <Text style={[
                      styles.ageChipText,
                      isSelected && styles.ageChipTextSelected,
                    ]}>
                      {age}mo
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Screening Details */}
        {selectedAge && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screening Details</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <ClipboardCheck size={20} color="#6b7280" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Questions</Text>
                  <Text style={styles.detailValue}>30 questions (6 per domain)</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Clock size={20} color="#6b7280" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Estimated Time</Text>
                  <Text style={styles.detailValue}>10-15 minutes</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Calendar size={20} color="#6b7280" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Age Range</Text>
                  <Text style={styles.detailValue}>{selectedAge} month questionnaire</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Domains Preview */}
        {selectedAge && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developmental Domains</Text>
            <View style={styles.domainsGrid}>
              <DomainPreview name="Communication" color="#3b82f6" icon="💬" />
              <DomainPreview name="Gross Motor" color="#22c55e" icon="🏃" />
              <DomainPreview name="Fine Motor" color="#f59e0b" icon="✋" />
              <DomainPreview name="Problem Solving" color="#8b5cf6" icon="💡" />
              <DomainPreview name="Personal-Social" color="#ec4899" icon="👥" />
            </View>
          </View>
        )}

        {/* Previous Screenings */}
        {childAssessments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Previous Screenings</Text>
            {childAssessments.slice(0, 3).map((assessment) => (
              <TouchableOpacity
                key={assessment.id}
                style={styles.historyCard}
                onPress={() => router.push(`/assessment/${assessment.id}`)}
              >
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>
                    {assessment.age_at_assessment}-Month Screening
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(assessment.completed_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.historyStatus,
                  { backgroundColor: assessment.overall_risk_level === 'typical' ? '#dcfce7' : '#fef3c7' }
                ]}>
                  <Text style={[
                    styles.historyStatusText,
                    { color: assessment.overall_risk_level === 'typical' ? '#16a34a' : '#d97706' }
                  ]}>
                    {assessment.overall_risk_level}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Start Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              (!selectedChild || !selectedAge) && styles.startButtonDisabled,
            ]}
            onPress={startScreening}
            disabled={!selectedChild || !selectedAge}
          >
            <Text style={styles.startButtonText}>Begin Screening</Text>
            <ChevronRight size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DomainPreview({ name, color, icon }: { name: string; color: string; icon: string }) {
  return (
    <View style={styles.domainCard}>
      <Text style={styles.domainIcon}>{icon}</Text>
      <Text style={styles.domainName}>{name}</Text>
      <View style={[styles.domainBar, { backgroundColor: color }]} />
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
    backgroundColor: '#3b82f6',
    padding: 24,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  infoText: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 4,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  childList: {
    gap: 12,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  childCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  childAvatarSelected: {
    backgroundColor: '#dbeafe',
  },
  childAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#9ca3af',
  },
  childAvatarTextSelected: {
    color: '#3b82f6',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  childNameSelected: {
    color: '#3b82f6',
  },
  childAge: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  lastAssessment: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  ageScroll: {
    marginHorizontal: -16,
  },
  ageScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  ageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  ageChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  ageChipRecommended: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  ageChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  ageChipTextSelected: {
    color: '#ffffff',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  domainsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  domainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '31%',
  },
  domainIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  domainName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4b5563',
    textAlign: 'center',
  },
  domainBar: {
    height: 3,
    width: 32,
    borderRadius: 2,
    marginTop: 8,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  historyDate: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  historyStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  startButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
