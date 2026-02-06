import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface DialogueBoxProps {
  speaker?: string;
  text: string;
  speakerColor?: string;
  animated?: boolean;
}

export function DialogueBox({
  speaker,
  text,
  speakerColor = '#ec4899',
  animated = true,
}: DialogueBoxProps) {
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animated ? 20 : 0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [text, animated]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {speaker && (
        <Text style={[styles.speaker, { color: speakerColor }]}>{speaker}</Text>
      )}
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  speaker: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  text: {
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 28,
  },
});
