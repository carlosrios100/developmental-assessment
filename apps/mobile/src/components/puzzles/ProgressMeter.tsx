import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Star } from 'lucide-react-native';

interface ProgressMeterProps {
  current: number;
  total: number;
  stars: number;
  color?: string;
}

export function ProgressMeter({
  current,
  total,
  stars,
  color = '#3b82f6',
}: ProgressMeterProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const starAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const progress = Math.min((current / total) * 100, 100);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    // Animate newly earned stars
    starAnims.forEach((anim, index) => {
      if (index < stars) {
        Animated.spring(anim, {
          toValue: 1,
          friction: 3,
          tension: 50,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [stars]);

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: color,
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {current}/{total}
        </Text>
      </View>

      {/* Stars */}
      <View style={styles.starsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.starWrapper,
              {
                transform: [
                  {
                    scale: starAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Star
              size={24}
              color="#fbbf24"
              fill={index < stars ? '#fbbf24' : 'transparent'}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 40,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starWrapper: {
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
