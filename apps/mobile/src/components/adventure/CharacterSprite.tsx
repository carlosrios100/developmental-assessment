import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

type ScenarioType =
  | 'sharing'
  | 'empathy_response'
  | 'delayed_gratification'
  | 'cooperation'
  | 'failure_recovery'
  | 'risk_assessment';

interface CharacterSpriteProps {
  scenarioType: ScenarioType;
  size?: number;
  animated?: boolean;
}

const SCENARIO_EMOJIS: Record<ScenarioType, string> = {
  sharing: '\uD83D\uDC6B', // 👫
  empathy_response: '\uD83E\uDD17', // 🤗
  delayed_gratification: '\uD83C\uDF81', // 🎁
  cooperation: '\uD83E\uDD1D', // 🤝
  failure_recovery: '\uD83D\uDCAA', // 💪
  risk_assessment: '\uD83C\uDF1F', // 🌟
};

const SCENARIO_COLORS: Record<ScenarioType, string> = {
  sharing: '#3b82f6',
  empathy_response: '#ec4899',
  delayed_gratification: '#f59e0b',
  cooperation: '#22c55e',
  failure_recovery: '#8b5cf6',
  risk_assessment: '#ef4444',
};

export function CharacterSprite({
  scenarioType,
  size = 150,
  animated = true,
}: CharacterSpriteProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entry animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Continuous gentle bounce
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  const emoji = SCENARIO_EMOJIS[scenarioType] || '\uD83D\uDE0A';
  const color = SCENARIO_COLORS[scenarioType] || '#6b7280';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + '20',
          transform: [
            { translateY: bounceAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});
