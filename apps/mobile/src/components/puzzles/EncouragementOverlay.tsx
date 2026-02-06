import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Check, X, Star, Heart, ThumbsUp } from 'lucide-react-native';

interface EncouragementOverlayProps {
  visible: boolean;
  isCorrect: boolean;
  message: string;
  onComplete?: () => void;
}

const CORRECT_EMOJIS = ['\uD83C\uDF1F', '\uD83C\uDF89', '\uD83D\uDCAB', '\uD83D\uDE4C', '\uD83D\uDC4F'];
const INCORRECT_EMOJIS = ['\uD83D\uDCAA', '\uD83E\uDD14', '\uD83D\uDE0A', '\uD83C\uDF1F', '\uD83D\uDC4D'];

export function EncouragementOverlay({
  visible,
  isCorrect,
  message,
  onComplete,
}: EncouragementOverlayProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const emoji = isCorrect
    ? CORRECT_EMOJIS[Math.floor(Math.random() * CORRECT_EMOJIS.length)]
    : INCORRECT_EMOJIS[Math.floor(Math.random() * INCORRECT_EMOJIS.length)];

  useEffect(() => {
    if (visible) {
      // Reset
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      bounceAnim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Bounce animation
        if (isCorrect) {
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -10,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }

        // Auto dismiss
        setTimeout(() => {
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(onComplete);
        }, 1200);
      });
    }
  }, [visible, isCorrect]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: opacityAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          isCorrect ? styles.contentCorrect : styles.contentIncorrect,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: bounceAnim },
            ],
          },
        ]}
      >
        <View style={styles.iconRow}>
          {isCorrect ? (
            <Check size={40} color="#ffffff" />
          ) : (
            <Heart size={40} color="#ffffff" />
          )}
        </View>

        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 200,
  },
  contentCorrect: {
    backgroundColor: '#22c55e',
  },
  contentIncorrect: {
    backgroundColor: '#f59e0b',
  },
  iconRow: {
    marginBottom: 4,
  },
  emoji: {
    fontSize: 32,
    marginVertical: 4,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});
