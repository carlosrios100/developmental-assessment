import { View, StyleSheet, Animated } from 'react-native';
import { ReactNode, useEffect, useRef } from 'react';

type CognitiveDomain = 'math' | 'logic' | 'verbal' | 'spatial' | 'memory';

interface PuzzleContainerProps {
  domain: CognitiveDomain;
  children: ReactNode;
  animated?: boolean;
}

const DOMAIN_COLORS: Record<CognitiveDomain, string> = {
  math: '#3b82f6',
  logic: '#8b5cf6',
  verbal: '#22c55e',
  spatial: '#f59e0b',
  memory: '#ec4899',
};

export function PuzzleContainer({
  domain,
  children,
  animated = true,
}: PuzzleContainerProps) {
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animated ? 30 : 0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated]);

  const color = DOMAIN_COLORS[domain];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: color + '15',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    margin: 16,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 20,
  },
});
