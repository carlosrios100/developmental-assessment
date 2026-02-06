import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';

interface PatternItem {
  id: string;
  value: string;
  color?: string;
}

interface LogicPuzzleProps {
  prompt: string;
  pattern: PatternItem[];
  options: Array<{ id: string; label: string }>;
  onAnswer: (answerId: string) => void;
  disabled?: boolean;
  selectedId?: string | null;
  correctId?: string | null;
  showResult?: boolean;
}

export function LogicPuzzle({
  prompt,
  pattern,
  options,
  onAnswer,
  disabled = false,
  selectedId = null,
  correctId = null,
  showResult = false,
}: LogicPuzzleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const patternAnims = useRef(pattern.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    patternAnims.forEach((anim) => anim.setValue(0));

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Animate pattern items sequentially
      const animations = patternAnims.map((anim, index) =>
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.spring(anim, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
        ])
      );
      Animated.parallel(animations).start();
    });
  }, [prompt]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Prompt */}
      <Text style={styles.prompt}>{prompt}</Text>

      {/* Pattern display */}
      <View style={styles.patternContainer}>
        {pattern.map((item, index) => (
          <Animated.View
            key={item.id}
            style={[
              styles.patternItem,
              item.color && { backgroundColor: item.color },
              {
                transform: [
                  {
                    scale: patternAnims[index] || new Animated.Value(1),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.patternText}>{item.value}</Text>
          </Animated.View>
        ))}

        {/* Question mark for the answer */}
        <View style={[styles.patternItem, styles.patternItemQuestion]}>
          <Text style={styles.questionMark}>?</Text>
        </View>
      </View>

      {/* Answer options */}
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrect = showResult && option.id === correctId;
          const isWrong = showResult && isSelected && option.id !== correctId;

          return (
            <TouchableOpacity
              key={option.id}
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
  prompt: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  patternContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  patternItem: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternItemQuestion: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderStyle: 'dashed',
  },
  patternText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4338ca',
  },
  questionMark: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f59e0b',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  optionButton: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
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
    fontSize: 22,
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
