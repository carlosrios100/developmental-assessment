import { View, Text, StyleSheet } from 'react-native';
import { MapPin, TrendingUp, Globe, CheckCircle } from 'lucide-react-native';

type ViabilityLevel = 'high' | 'medium' | 'low' | 'unknown';

interface ViabilityBadgeProps {
  level: ViabilityLevel;
  localMatch?: boolean;
  industry?: string;
  growthOutlook?: 'rapidly_growing' | 'growing' | 'stable' | 'declining';
  variant?: 'compact' | 'detailed';
}

const LEVEL_COLORS: Record<ViabilityLevel, string> = {
  high: '#22c55e',
  medium: '#f59e0b',
  low: '#ef4444',
  unknown: '#6b7280',
};

const LEVEL_LABELS: Record<ViabilityLevel, string> = {
  high: 'High Demand',
  medium: 'Moderate Demand',
  low: 'Limited Demand',
  unknown: 'Data Unavailable',
};

const GROWTH_LABELS: Record<string, { label: string; color: string }> = {
  rapidly_growing: { label: 'Rapidly Growing', color: '#22c55e' },
  growing: { label: 'Growing', color: '#3b82f6' },
  stable: { label: 'Stable', color: '#6b7280' },
  declining: { label: 'Declining', color: '#ef4444' },
};

export function ViabilityBadge({
  level,
  localMatch = false,
  industry,
  growthOutlook,
  variant = 'compact',
}: ViabilityBadgeProps) {
  const color = LEVEL_COLORS[level];
  const label = LEVEL_LABELS[level];
  const growth = growthOutlook ? GROWTH_LABELS[growthOutlook] : null;

  if (variant === 'compact') {
    return (
      <View style={[styles.compactBadge, { backgroundColor: color + '20' }]}>
        {localMatch ? (
          <MapPin size={12} color={color} />
        ) : (
          <Globe size={12} color={color} />
        )}
        <Text style={[styles.compactText, { color }]}>
          {localMatch ? 'Local' : 'Remote'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.detailedContainer}>
      {/* Main viability indicator */}
      <View style={[styles.mainBadge, { backgroundColor: color + '10', borderColor: color }]}>
        <View style={styles.mainBadgeHeader}>
          {localMatch ? (
            <MapPin size={16} color={color} />
          ) : (
            <Globe size={16} color={color} />
          )}
          <Text style={[styles.mainBadgeTitle, { color }]}>{label}</Text>
        </View>

        {localMatch && (
          <View style={styles.localIndicator}>
            <CheckCircle size={14} color="#22c55e" />
            <Text style={styles.localIndicatorText}>Available in your area</Text>
          </View>
        )}
      </View>

      {/* Industry info */}
      {industry && (
        <View style={styles.industryRow}>
          <Text style={styles.industryLabel}>Industry:</Text>
          <Text style={styles.industryValue}>{industry}</Text>
        </View>
      )}

      {/* Growth outlook */}
      {growth && (
        <View style={styles.growthRow}>
          <TrendingUp size={14} color={growth.color} />
          <Text style={[styles.growthText, { color: growth.color }]}>
            {growth.label}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact styles
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Detailed styles
  detailedContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
  },
  mainBadge: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  mainBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainBadgeTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  localIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  localIndicatorText: {
    fontSize: 12,
    color: '#22c55e',
  },
  industryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  industryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  industryValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
