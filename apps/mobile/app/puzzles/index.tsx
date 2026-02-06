import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import {
  Calculator,
  Puzzle,
  BookOpen,
  Box,
  Brain,
  Star,
  Check,
  Play,
} from 'lucide-react-native';
import { usePuzzleStore, getDomainInfo } from '@/stores/puzzle-store';
import { useChildStore } from '@/stores/child-store';
import type { CognitiveDomain } from '@devassess/shared';

const DOMAIN_ICONS: Record<string, React.ComponentType<any>> = {
  math: Calculator,
  logic: Puzzle,
  verbal: BookOpen,
  spatial: Box,
  memory: Brain,
};

export default function PuzzleHubScreen() {
  const { selectedChild: currentChild } = useChildStore();
  const { domainProgress, cognitiveProfile, isLoading, loadCognitiveProfile } = usePuzzleStore();

  useEffect(() => {
    if (currentChild) {
      loadCognitiveProfile(currentChild.id);
    }
  }, [currentChild]);

  const domains: CognitiveDomain[] = ['math', 'logic', 'verbal', 'spatial', 'memory'];

  const totalStars = Object.values(domainProgress).reduce(
    (sum, p) => sum + (p.starsEarned || 0),
    0
  );
  const completedDomains = Object.values(domainProgress).filter((p) => p.completed).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Puzzles</Text>
            <Text style={styles.headerSubtitle}>
              Brain games for {currentChild?.firstName || 'your child'}!
            </Text>
          </View>
          <View style={styles.starsDisplay}>
            <Star size={24} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.starsCount}>{totalStars}</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressPercent}>
              {Math.round((completedDomains / domains.length) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completedDomains / domains.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressSubtext}>
            {completedDomains} of {domains.length} areas completed
          </Text>
        </View>

        {/* Domain Cards */}
        <View style={styles.domainsSection}>
          <Text style={styles.sectionTitle}>Choose a Puzzle Type</Text>

          {domains.map((domain) => {
            const info = getDomainInfo(domain);
            const progress = domainProgress[domain];
            const Icon = DOMAIN_ICONS[domain] || Brain;

            return (
              <DomainCard
                key={domain}
                domain={domain}
                name={info.name}
                description={info.description}
                color={info.color}
                icon={Icon}
                completed={progress.completed}
                starsEarned={progress.starsEarned}
                percentile={progress.percentile}
                onPress={() => router.push(`/puzzles/${domain}`)}
              />
            );
          })}
        </View>

        {/* Composite Score */}
        {cognitiveProfile?.compositePercentile && (
          <View style={styles.compositeSection}>
            <View style={styles.compositeCard}>
              <Brain size={32} color="#3b82f6" />
              <View style={styles.compositeContent}>
                <Text style={styles.compositeLabel}>Cognitive Score</Text>
                <Text style={styles.compositeValue}>
                  Top {100 - cognitiveProfile.compositePercentile}%
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DomainCard({
  domain,
  name,
  description,
  color,
  icon: Icon,
  completed,
  starsEarned,
  percentile,
  onPress,
}: {
  domain: CognitiveDomain;
  name: string;
  description: string;
  color: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  starsEarned: number;
  percentile?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.domainCard} onPress={onPress}>
      <View style={[styles.domainIcon, { backgroundColor: color + '20' }]}>
        <Icon size={28} color={color} />
      </View>
      <View style={styles.domainContent}>
        <Text style={styles.domainName}>{name}</Text>
        <Text style={styles.domainDescription}>{description}</Text>
        {completed && (
          <View style={styles.domainStars}>
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                size={16}
                color="#fbbf24"
                fill={i <= starsEarned ? '#fbbf24' : 'transparent'}
              />
            ))}
            {percentile && (
              <Text style={styles.percentileText}>Top {100 - percentile}%</Text>
            )}
          </View>
        )}
      </View>
      <View style={[styles.actionButton, { backgroundColor: completed ? '#22c55e' : color }]}>
        {completed ? (
          <Check size={20} color="#ffffff" />
        ) : (
          <Play size={20} color="#ffffff" fill="#ffffff" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#3b82f6',
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  progressSubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
  domainsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  domainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  domainIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  domainContent: {
    flex: 1,
  },
  domainName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  domainDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  domainStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  percentileText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
    marginLeft: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compositeSection: {
    padding: 16,
    paddingTop: 0,
  },
  compositeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  compositeContent: {
    flex: 1,
  },
  compositeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  compositeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
    marginTop: 2,
  },
});
