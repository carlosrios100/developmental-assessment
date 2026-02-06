import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import {
  Sparkles,
  Target,
  Heart,
  Brain,
  MapPin,
  TrendingUp,
  ChevronRight,
  RefreshCw,
} from 'lucide-react-native';
import { useMosaicStore } from '@/stores/mosaic-store';
import { useChildStore } from '@/stores/child-store';

export default function MosaicOverviewScreen() {
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const { selectedChild: currentChild } = useChildStore();
  const {
    currentAssessment,
    archetypeMatches,
    isLoading,
    isGenerating,
    error,
    loadMosaic,
    generateMosaic,
    loadArchetypes,
  } = useMosaicStore();

  const activeChildId = childId || currentChild?.id;

  useEffect(() => {
    loadArchetypes();
    if (activeChildId) {
      loadMosaic(activeChildId);
    }
  }, [activeChildId]);

  const handleGenerateMosaic = async () => {
    if (activeChildId) {
      await generateMosaic(activeChildId);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading Mosaic...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const primaryArchetype = archetypeMatches[0];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mosaic Profile</Text>
            <Text style={styles.headerSubtitle}>
              {currentChild?.firstName}'s holistic assessment
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleGenerateMosaic}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <RefreshCw size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!currentAssessment ? (
          /* No Assessment State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Sparkles size={48} color="#6366f1" />
            </View>
            <Text style={styles.emptyTitle}>No Mosaic Assessment Yet</Text>
            <Text style={styles.emptyDescription}>
              Complete cognitive and behavioral assessments to generate your child's
              personalized Mosaic profile.
            </Text>
            <TouchableOpacity style={styles.generateButton} onPress={handleGenerateMosaic}>
              <Sparkles size={20} color="#ffffff" />
              <Text style={styles.generateButtonText}>Generate Mosaic</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* True Potential Score */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreLabel}>True Potential Score</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {Math.round((currentAssessment.confidenceLevel || 0) * 100)}% confidence
                  </Text>
                </View>
              </View>
              <View style={styles.scoreDisplay}>
                <Text style={styles.scoreValue}>
                  {Math.round(currentAssessment.truePotentialScore || 0)}
                </Text>
                <Text style={styles.scorePercentile}>
                  Top {100 - (currentAssessment.truePotentialPercentile || 50)}%
                </Text>
              </View>
              {currentAssessment.adversityMultiplier > 1.0 && (
                <View style={styles.multiplierBadge}>
                  <TrendingUp size={14} color="#059669" />
                  <Text style={styles.multiplierText}>
                    {currentAssessment.adversityMultiplier.toFixed(2)}x Resilience Bonus
                  </Text>
                </View>
              )}
            </View>

            {/* Primary Archetype Card */}
            {primaryArchetype && (
              <TouchableOpacity
                style={styles.archetypeCard}
                onPress={() => router.push('/mosaic/archetypes')}
              >
                <View style={styles.archetypeHeader}>
                  <View
                    style={[
                      styles.archetypeIcon,
                      { backgroundColor: '#6366f115' },
                    ]}
                  >
                    <Target size={28} color="#6366f1" />
                  </View>
                  <View style={styles.archetypeInfo}>
                    <Text style={styles.archetypeLabel}>Primary Archetype</Text>
                    <Text style={styles.archetypeName}>
                      The {primaryArchetype.archetypeType.replace('_', ' ').split(' ').map(
                        (w: string) => w.charAt(0).toUpperCase() + w.slice(1)
                      ).join(' ')}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#9ca3af" />
                </View>
                <View style={styles.matchScore}>
                  <View style={styles.matchBar}>
                    <View
                      style={[
                        styles.matchBarFill,
                        { width: `${primaryArchetype.matchScore}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.matchScoreText}>
                    {Math.round(primaryArchetype.matchScore)}% match
                  </Text>
                </View>
                {primaryArchetype.localViability && (
                  <View style={styles.viabilityBadge}>
                    <MapPin size={12} color="#059669" />
                    <Text style={styles.viabilityText}>High local demand</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push('/puzzles')}
              >
                <View style={[styles.statIcon, { backgroundColor: '#3b82f615' }]}>
                  <Brain size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statValue}>
                  {Math.round(currentAssessment.rawCognitiveScore || 0)}
                </Text>
                <Text style={styles.statLabel}>Cognitive</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push('/adventure')}
              >
                <View style={[styles.statIcon, { backgroundColor: '#ec489815' }]}>
                  <Heart size={24} color="#ec4899" />
                </View>
                <Text style={styles.statValue}>
                  {Math.round(currentAssessment.rawEmotionalScore || 0)}
                </Text>
                <Text style={styles.statLabel}>Emotional</Text>
              </TouchableOpacity>
            </View>

            {/* Navigation Cards */}
            <View style={styles.navSection}>
              <Text style={styles.navSectionTitle}>Explore</Text>

              <NavigationCard
                icon={Target}
                iconColor="#6366f1"
                title="Ikigai Chart"
                description="Discover purpose and career paths"
                onPress={() => router.push('/mosaic/ikigai')}
              />

              <NavigationCard
                icon={TrendingUp}
                iconColor="#22c55e"
                title="Gap Analysis"
                description="Growth areas and resources"
                onPress={() => router.push('/mosaic/gaps')}
              />

              <NavigationCard
                icon={Sparkles}
                iconColor="#f59e0b"
                title="All Archetypes"
                description="Explore personality matches"
                onPress={() => router.push('/mosaic/archetypes')}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NavigationCard({
  icon: Icon,
  iconColor,
  title,
  description,
  onPress,
}: {
  icon: React.ComponentType<any>;
  iconColor: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navCard} onPress={onPress}>
      <View style={[styles.navCardIcon, { backgroundColor: iconColor + '15' }]}>
        <Icon size={24} color={iconColor} />
      </View>
      <View style={styles.navCardContent}>
        <Text style={styles.navCardTitle}>{title}</Text>
        <Text style={styles.navCardDescription}>{description}</Text>
      </View>
      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
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
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#6366f1',
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
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  emptyState: {
    margin: 16,
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6366f115',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreCard: {
    margin: 16,
    marginTop: -20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  confidenceBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#6366f1',
  },
  scorePercentile: {
    fontSize: 16,
    color: '#9ca3af',
  },
  multiplierBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  multiplierText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#059669',
  },
  archetypeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  archetypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  archetypeInfo: {
    flex: 1,
  },
  archetypeLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  archetypeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  matchScore: {
    marginTop: 16,
  },
  matchBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  matchBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  matchScoreText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
  },
  viabilityBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viabilityText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  navSection: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  navSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  navCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  navCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navCardContent: {
    flex: 1,
  },
  navCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  navCardDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
});
