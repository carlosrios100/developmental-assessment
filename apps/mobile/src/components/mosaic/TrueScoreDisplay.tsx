import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { TrendingUp, Sparkles } from 'lucide-react-native';

interface TrueScoreDisplayProps {
  score: number;
  rawScore?: number;
  adversityMultiplier?: number;
  showBreakdown?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function TrueScoreDisplay({
  score,
  rawScore,
  adversityMultiplier,
  showBreakdown = false,
  size = 'medium',
}: TrueScoreDisplayProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const sizes = {
    small: { container: 80, strokeWidth: 6, fontSize: 20 },
    medium: { container: 120, strokeWidth: 8, fontSize: 28 },
    large: { container: 160, strokeWidth: 10, fontSize: 36 },
  };

  const config = sizes[size];
  const radius = (config.container - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = Math.min(score / 100, 1);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: progressPercent,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [score]);

  const getScoreColor = () => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const color = getScoreColor();

  return (
    <View style={styles.container}>
      {/* Circular progress */}
      <Animated.View
        style={[
          styles.progressContainer,
          { width: config.container, height: config.container },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Svg width={config.container} height={config.container}>
          {/* Background circle */}
          <Circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={config.strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            stroke={color}
            strokeWidth={config.strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, circumference * (1 - progressPercent)],
            })}
            transform={`rotate(-90 ${config.container / 2} ${config.container / 2})`}
          />
        </Svg>

        {/* Score text */}
        <View style={styles.scoreTextContainer}>
          <Sparkles size={size === 'large' ? 20 : 14} color={color} />
          <Text style={[styles.scoreValue, { fontSize: config.fontSize, color }]}>
            {Math.round(score)}
          </Text>
        </View>
      </Animated.View>

      {/* Label */}
      <Text style={styles.label}>True Potential</Text>

      {/* Breakdown */}
      {showBreakdown && rawScore !== undefined && adversityMultiplier !== undefined && (
        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Raw Score</Text>
            <Text style={styles.breakdownValue}>{Math.round(rawScore)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.multiplierLabel}>
              <TrendingUp size={12} color="#22c55e" />
              <Text style={styles.breakdownLabel}>Resilience Multiplier</Text>
            </View>
            <Text style={[styles.breakdownValue, { color: '#22c55e' }]}>
              x{adversityMultiplier.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={styles.totalLabel}>True Potential</Text>
            <Text style={[styles.totalValue, { color }]}>{Math.round(score)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  scoreValue: {
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
  },
  breakdown: {
    marginTop: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    minWidth: 200,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  multiplierLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 4,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
