import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { Star, MapPin, ChevronRight } from 'lucide-react-native';

interface ArchetypeCardProps {
  name: string;
  description: string;
  matchScore: number;
  colorPrimary: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  rank?: number;
  localViability?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export function ArchetypeCard({
  name,
  description,
  matchScore,
  colorPrimary,
  icon: Icon,
  rank,
  localViability,
  onPress,
  compact = false,
}: ArchetypeCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const isTopMatch = rank !== undefined && rank <= 3;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress}>
        <View style={[styles.compactIcon, { backgroundColor: colorPrimary + '20' }]}>
          <Icon size={20} color={colorPrimary} />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactName}>{name}</Text>
          <View style={styles.compactMatch}>
            <View style={styles.compactMatchBar}>
              <View
                style={[
                  styles.compactMatchFill,
                  { width: `${matchScore}%`, backgroundColor: colorPrimary },
                ]}
              />
            </View>
            <Text style={styles.compactMatchText}>{Math.round(matchScore)}%</Text>
          </View>
        </View>
        <ChevronRight size={16} color="#9ca3af" />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, isTopMatch && styles.topMatchCard]}
        onPress={onPress}
      >
        {/* Rank badge */}
        {rank !== undefined && (
          <View
            style={[
              styles.rankBadge,
              isTopMatch && { backgroundColor: colorPrimary },
            ]}
          >
            <Text style={styles.rankText}>#{rank}</Text>
          </View>
        )}

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colorPrimary + '20' }]}>
          <Icon size={32} color={colorPrimary} />
        </View>

        {/* Content */}
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        {/* Match score */}
        <View style={styles.matchContainer}>
          <View style={styles.matchBar}>
            <View
              style={[
                styles.matchFill,
                { width: `${matchScore}%`, backgroundColor: colorPrimary },
              ]}
            />
          </View>
          <Text style={[styles.matchPercent, { color: colorPrimary }]}>
            {Math.round(matchScore)}% match
          </Text>
        </View>

        {/* Local viability badge */}
        {localViability && (
          <View style={styles.viabilityBadge}>
            <MapPin size={12} color="#059669" />
            <Text style={styles.viabilityText}>Local Demand</Text>
          </View>
        )}

        {/* Star indicator for top matches */}
        {isTopMatch && (
          <View style={styles.starContainer}>
            <Star size={16} color="#fbbf24" fill="#fbbf24" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    position: 'relative',
  },
  topMatchCard: {
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  description: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  matchContainer: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  matchBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  matchFill: {
    height: '100%',
    borderRadius: 3,
  },
  matchPercent: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  viabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viabilityText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#059669',
  },
  starContainer: {
    position: 'absolute',
    top: -8,
    left: -8,
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  compactMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  compactMatchBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactMatchFill: {
    height: '100%',
    borderRadius: 2,
  },
  compactMatchText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    minWidth: 32,
  },
});
