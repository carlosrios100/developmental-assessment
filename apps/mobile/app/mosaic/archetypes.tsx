import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  Handshake,
  Cpu,
  Settings,
  Heart,
  Palette,
  BarChart,
  Hammer,
  Compass,
  Users,
  Shield,
  Star,
  Check,
  MapPin,
} from 'lucide-react-native';
import { useMosaicStore } from '@/stores/mosaic-store';
import type { ArchetypeType, Archetype, ArchetypeMatch } from '@devassess/shared';

const ARCHETYPE_ICONS: Record<string, React.ComponentType<any>> = {
  diplomat: Handshake,
  systems_architect: Cpu,
  operator: Settings,
  caregiver: Heart,
  creator: Palette,
  analyst: BarChart,
  builder: Hammer,
  explorer: Compass,
  connector: Users,
  guardian: Shield,
};

export default function ArchetypesScreen() {
  const { archetypes, archetypeMatches, loadArchetypes, isLoading } = useMosaicStore();
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);

  useEffect(() => {
    loadArchetypes();
  }, []);

  if (isLoading && archetypes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading archetypes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Sort by match score if matches available
  const sortedArchetypes = [...archetypes].sort((a, b) => {
    const matchA = archetypeMatches.find(m => m.archetypeType === a.type);
    const matchB = archetypeMatches.find(m => m.archetypeType === b.type);
    return (matchB?.matchScore || 0) - (matchA?.matchScore || 0);
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Archetypes</Text>
          <Text style={styles.headerSubtitle}>
            Discover personality patterns and potential paths
          </Text>
        </View>

        {/* Match Cards */}
        <View style={styles.archetypeGrid}>
          {sortedArchetypes.map((archetype, index) => {
            const match = archetypeMatches.find(m => m.archetypeType === archetype.type);
            return (
              <ArchetypeCard
                key={archetype.type}
                archetype={archetype}
                match={match}
                rank={index + 1}
                onPress={() => setSelectedArchetype(archetype)}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      {selectedArchetype && (
        <ArchetypeDetailModal
          archetype={selectedArchetype}
          match={archetypeMatches.find(m => m.archetypeType === selectedArchetype.type)}
          onClose={() => setSelectedArchetype(null)}
        />
      )}
    </SafeAreaView>
  );
}

function ArchetypeCard({
  archetype,
  match,
  rank,
  onPress,
}: {
  archetype: Archetype;
  match?: ArchetypeMatch;
  rank: number;
  onPress: () => void;
}) {
  const Icon = ARCHETYPE_ICONS[archetype.type] || Star;
  const isTopMatch = rank <= 3;

  return (
    <TouchableOpacity
      style={[styles.archetypeCard, isTopMatch && styles.topMatchCard]}
      onPress={onPress}
    >
      {isTopMatch && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      )}
      <View
        style={[
          styles.archetypeIcon,
          { backgroundColor: archetype.colorPrimary + '20' },
        ]}
      >
        <Icon size={28} color={archetype.colorPrimary} />
      </View>
      <Text style={styles.archetypeName}>{archetype.name}</Text>
      {match && (
        <View style={styles.matchInfo}>
          <View style={styles.matchBar}>
            <View
              style={[
                styles.matchBarFill,
                {
                  width: `${match.matchScore}%`,
                  backgroundColor: archetype.colorPrimary,
                },
              ]}
            />
          </View>
          <Text style={styles.matchPercent}>{Math.round(match.matchScore)}%</Text>
        </View>
      )}
      {match?.localViability && (
        <View style={styles.viabilityBadge}>
          <MapPin size={10} color="#059669" />
          <Text style={styles.viabilityText}>Local</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ArchetypeDetailModal({
  archetype,
  match,
  onClose,
}: {
  archetype: Archetype;
  match?: ArchetypeMatch;
  onClose: () => void;
}) {
  const Icon = ARCHETYPE_ICONS[archetype.type] || Star;

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalContent}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeader}>
            <View
              style={[
                styles.modalIcon,
                { backgroundColor: archetype.colorPrimary + '20' },
              ]}
            >
              <Icon size={36} color={archetype.colorPrimary} />
            </View>
            <Text style={styles.modalTitle}>{archetype.name}</Text>
            {match && (
              <Text style={styles.modalMatch}>{Math.round(match.matchScore)}% match</Text>
            )}
          </View>

          <Text style={styles.modalDescription}>{archetype.description}</Text>

          {/* Affirmation */}
          <View style={[styles.affirmationCard, { backgroundColor: archetype.colorPrimary + '10' }]}>
            <Text style={[styles.affirmationText, { color: archetype.colorPrimary }]}>
              "{archetype.affirmation}"
            </Text>
          </View>

          {/* Strengths */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Natural Strengths</Text>
            <View style={styles.tagList}>
              {archetype.strengths.map((strength: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Check size={12} color="#22c55e" />
                  <Text style={styles.tagText}>{strength}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Growth Areas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Growth Opportunities</Text>
            <View style={styles.tagList}>
              {archetype.growthAreas.map((area: string, i: number) => (
                <View key={i} style={[styles.tag, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.tagText, { color: '#92400e' }]}>{area}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Career Pathways */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Career Pathways</Text>
            {archetype.careerPathways.slice(0, 3).map((pathway: any, i: number) => (
              <View key={i} style={styles.pathwayCard}>
                <Text style={styles.pathwayIndustry}>{pathway.industry}</Text>
                <Text style={styles.pathwayRoles}>{pathway.roles.join(', ')}</Text>
                <View
                  style={[
                    styles.growthBadge,
                    pathway.growthOutlook === 'rapidly_growing' && { backgroundColor: '#dcfce7' },
                    pathway.growthOutlook === 'growing' && { backgroundColor: '#dbeafe' },
                  ]}
                >
                  <Text
                    style={[
                      styles.growthText,
                      pathway.growthOutlook === 'rapidly_growing' && { color: '#16a34a' },
                      pathway.growthOutlook === 'growing' && { color: '#2563eb' },
                    ]}
                  >
                    {pathway.growthOutlook.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Parent Guidance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>For Parents</Text>
            <Text style={styles.guidanceText}>{archetype.parentGuidance}</Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
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
    backgroundColor: '#6366f1',
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
  archetypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  archetypeCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  topMatchCard: {
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  archetypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  archetypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  matchInfo: {
    width: '100%',
    marginTop: 8,
    alignItems: 'center',
  },
  matchBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  matchBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  matchPercent: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  viabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viabilityText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#059669',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalMatch: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 4,
  },
  modalDescription: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  affirmationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  affirmationText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#16a34a',
  },
  pathwayCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  pathwayIndustry: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  pathwayRoles: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  growthBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  guidanceText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
