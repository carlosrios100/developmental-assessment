import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';

interface MathPuzzleProps {
  prompt: string;
  options: Array<{ id: string; label: string }>;
  onAnswer: (answerId: string) => void;
  disabled?: boolean;
  selectedId?: string | null;
  correctId?: string | null;
  showResult?: boolean;
}

export function MathPuzzle({
  prompt,
  options,
  onAnswer,
  disabled = false,
  selectedId = null,
  correctId = null,
  showResult = false,
}: MathPuzzleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnims = useRef(options.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [prompt]);

  useEffect(() => {
    if (showResult && selectedId && selectedId !== correctId) {
      // Shake incorrect answer
      const index = options.findIndex((o) => o.id === selectedId);
      if (index >= 0) {
        Animated.sequence([
          Animated.timing(shakeAnims[index], { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnims[index], { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnims[index], { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnims[index], { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }
    }
  }, [showResult]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Question prompt */}
      <View style={styles.promptContainer}>
        <Text style={styles.prompt}>{prompt}</Text>
      </View>

      {/* Answer options - 2x2 grid for touch-friendly */}
      <View style={styles.optionsGrid}>
        {options.map((option, index) => {
          const isSelected = selectedId === option.id;
          const isCorrect = showResult && option.id === correctId;
          const isWrong = showResult && isSelected && option.id !== correctId;

          return (
            <Animated.View
              key={option.id}
              style={[
                styles.optionWrapper,
                { transform: [{ translateX: shakeAnims[index] }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  isSelected && styles.optionSelected,
                  isCorrect && styles.optionCorrect,
                  isWrong && styles.optionWrong,
                ]}
                onPress={() => onAnswer(option.id)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.optionText,
                    isCorrect && styles.optionTextCorrect,
                    isWrong && styles.optionTextWrong,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  promptContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  prompt: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  optionWrapper: {
    width: '45%',
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionCorrect: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  optionWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  optionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
  },
  optionTextCorrect: {
    color: '#16a34a',
  },
  optionTextWrong: {
    color: '#dc2626',
  },
});
