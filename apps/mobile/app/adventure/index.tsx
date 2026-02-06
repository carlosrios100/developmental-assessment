import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { Star, Heart, Play, Lock, Check, ChevronRight } from 'lucide-react-native';
import { useAdventureStore } from '@/stores/adventure-store';
import { useChildStore } from '@/stores/child-store';

export default function AdventureHubScreen() {
  const { selectedChild: currentChild } = useChildStore();
  const {
    availableScenarios,
    completedScenarioIds,
    emotionalProfile,
    stars,
    isLoading,
    loadAvailableScenarios,
    loadEmotionalProfile,
  } = useAdventureStore();

  useEffect(() => {
    if (currentChild) {
      const ageMonths = Math.floor(
        (Date.now() - new Date(currentChild.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      loadAvailableScenarios(ageMonths);
      loadEmotionalProfile(currentChild.id);
    }
  }, [currentChild]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.loadingText}>Loading Adventures...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allScenarios = [...availableScenarios];
  const scenarioTypes = [
    { type: 'sharing', name: 'Sharing Stories', color: '#3b82f6', icon: Heart },
    { type: 'delayed_gratification', name: 'Patience Quests', color: '#f59e0b', icon: Star },
    { type: 'empathy_response', name: 'Helping Hands', color: '#ec4899', icon: Heart },
    { type: 'cooperation', name: 'Team Adventures', color: '#22c55e', icon: Star },
    { type: 'failure_recovery', name: 'Try Again Tales', color: '#8b5cf6', icon: Star },
    { type: 'risk_assessment', name: 'Brave Choices', color: '#ef4444', icon: Star },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Adventures</Text>
            <Text style={styles.headerSubtitle}>
              Play and learn with {currentChild?.firstName || 'your child'}!
            </Text>
          </View>
          <View style={styles.starsDisplay}>
            <Star size={24} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.starsCount}>{stars}</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressValue}>{completedScenarioIds.length}</Text>
              <Text style={styles.progressLabel}>Completed</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressValue}>{availableScenarios.length}</Text>
              <Text style={styles.progressLabel}>Available</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressValue}>{stars}</Text>
              <Text style={styles.progressLabel}>Stars</Text>
            </View>
          </View>
        </View>

        {/* Scenario Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Choose Your Adventure</Text>

          {scenarioTypes.map((category) => {
            const categoryScenarios = allScenarios.filter(s => s.scenarioType === category.type);
            const completed = categoryScenarios.filter(s => completedScenarioIds.includes(s.id)).length;
            const available = categoryScenarios.length;

            return (
              <CategoryCard
                key={category.type}
                name={category.name}
                color={category.color}
                icon={category.icon}
                completed={completed}
                total={available}
                onPress={() => {
                  const scenario = categoryScenarios.find(s => !completedScenarioIds.includes(s.id));
                  if (scenario) {
                    router.push(`/adventure/${scenario.id}`);
                  }
                }}
                disabled={available === 0}
              />
            );
          })}
        </View>

        {/* Emotional Profile Preview */}
        {emotionalProfile && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Emotional Strengths</Text>
            <View style={styles.profileCard}>
              <ProfileBar
                label="Empathy"
                value={emotionalProfile.empathyScore || 0}
                color="#ec4899"
              />
              <ProfileBar
                label="Patience"
                value={emotionalProfile.delayedGratificationScore || 0}
                color="#f59e0b"
              />
              <ProfileBar
                label="Teamwork"
                value={emotionalProfile.cooperationScore || 0}
                color="#22c55e"
              />
              <ProfileBar
                label="Resilience"
                value={emotionalProfile.failureResilienceScore || 0}
                color="#8b5cf6"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryCard({
  name,
  color,
  icon: Icon,
  completed,
  total,
  onPress,
  disabled,
}: {
  name: string;
  color: string;
  icon: React.ComponentType<any>;
  completed: number;
  total: number;
  onPress: () => void;
  disabled: boolean;
}) {
  const isComplete = completed === total && total > 0;

  return (
    <TouchableOpacity
      style={[styles.categoryCard, disabled && styles.categoryCardDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
        {isComplete ? (
          <Check size={28} color={color} />
        ) : disabled ? (
          <Lock size={28} color="#9ca3af" />
        ) : (
          <Icon size={28} color={color} />
        )}
      </View>
      <View style={styles.categoryContent}>
        <Text style={[styles.categoryName, disabled && { color: '#9ca3af' }]}>{name}</Text>
        <Text style={styles.categoryProgress}>
          {total === 0 ? 'Coming soon' : `${completed}/${total} complete`}
        </Text>
        {total > 0 && (
          <View style={styles.categoryProgressBar}>
            <View
              style={[
                styles.categoryProgressFill,
                { width: `${(completed / total) * 100}%`, backgroundColor: color },
              ]}
            />
          </View>
        )}
      </View>
      {!disabled && (
        <View style={[styles.playButton, { backgroundColor: color }]}>
          <Play size={16} color="#ffffff" fill="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

function ProfileBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.profileBar}>
      <View style={styles.profileBarHeader}>
        <Text style={styles.profileBarLabel}>{label}</Text>
        <Text style={styles.profileBarValue}>{Math.round(value)}</Text>
      </View>
      <View style={styles.profileBarTrack}>
        <View
          style={[
            styles.profileBarFill,
            { width: `${value}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
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
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  starsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  starsCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressCard: {
    margin: 16,
    marginTop: -16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ec4899',
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f3f4f6',
  },
  categoriesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryCardDisabled: {
    opacity: 0.6,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryProgress: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  categoryProgressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    padding: 16,
    paddingTop: 0,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  profileBar: {
    marginBottom: 12,
  },
  profileBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  profileBarLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  profileBarValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  profileBarTrack: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  profileBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
