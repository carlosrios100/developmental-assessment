import { View, StyleSheet, Dimensions } from 'react-native';
import { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ScenarioType =
  | 'sharing'
  | 'empathy_response'
  | 'delayed_gratification'
  | 'cooperation'
  | 'failure_recovery'
  | 'risk_assessment';

interface GameCanvasProps {
  scenarioType: ScenarioType;
  children: ReactNode;
}

const SCENARIO_GRADIENTS: Record<ScenarioType, [string, string, string]> = {
  sharing: ['#1e3a8a', '#3b82f6', '#93c5fd'],
  empathy_response: ['#831843', '#ec4899', '#fbcfe8'],
  delayed_gratification: ['#78350f', '#f59e0b', '#fde68a'],
  cooperation: ['#14532d', '#22c55e', '#bbf7d0'],
  failure_recovery: ['#4c1d95', '#8b5cf6', '#ddd6fe'],
  risk_assessment: ['#7f1d1d', '#ef4444', '#fecaca'],
};

export function GameCanvas({ scenarioType, children }: GameCanvasProps) {
  const gradientColors = SCENARIO_GRADIENTS[scenarioType] || SCENARIO_GRADIENTS.sharing;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />

      {/* Decorative elements */}
      <View style={styles.decorations}>
        {/* Stars/particles background */}
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: Math.random() * SCREEN_WIDTH,
                top: Math.random() * (SCREEN_HEIGHT * 0.4),
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                opacity: Math.random() * 0.5 + 0.3,
              },
            ]}
          />
        ))}
      </View>

      {/* Game content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  content: {
    flex: 1,
  },
});
