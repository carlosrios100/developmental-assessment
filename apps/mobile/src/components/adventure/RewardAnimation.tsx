import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';
import { Star } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RewardAnimationProps {
  visible: boolean;
  score: number;
  stars: number;
  message?: string;
  onComplete?: () => void;
}

export function RewardAnimation({
  visible,
  score,
  stars,
  message = 'Great job!',
  onComplete,
}: RewardAnimationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const starAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      starAnims.forEach((anim) => anim.setValue(0));

      // Play entry animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animate stars sequentially
        const starAnimations = starAnims.slice(0, stars).map((anim, index) =>
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.spring(anim, {
              toValue: 1,
              friction: 3,
              tension: 50,
              useNativeDriver: true,
            }),
          ])
        );

        Animated.parallel(starAnimations).start(() => {
          // Auto-dismiss after delay
          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(onComplete);
          }, 1500);
        });
      });
    }
  }, [visible, stars]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.message}>{message}</Text>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>+</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.scoreLabel}>points</Text>
        </View>

        <View style={styles.starsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.starWrapper,
                {
                  opacity: index < stars ? starAnims[index] : 0.3,
                  transform: [
                    {
                      scale: starAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                    {
                      rotate: starAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-30deg', '0deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Star
                size={48}
                color="#fbbf24"
                fill={index < stars ? '#fbbf24' : 'transparent'}
              />
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
  },
  message: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#6b7280',
    marginHorizontal: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#22c55e',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  starWrapper: {
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
