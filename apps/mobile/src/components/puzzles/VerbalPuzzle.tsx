import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { Volume2 } from 'lucide-react-native';

interface VerbalPuzzleProps {
  prompt: string;
  options: Array<{ id: string; label: string; imageEmoji?: string }>;
  onAnswer: (answerId: string) => void;
  onPlayAudio?: () => void;
  hasAudio?: boolean;
  disabled?: boolean;
  selectedId?: string | null;
  correctId?: string | null;
  showResult?: boolean;
}

export function VerbalPuzzle({
  prompt,
  options,
  onAnswer,
  onPlayAudio,
  hasAudio = false,
  disabled = false,
  selectedId = null,
  correctId = null,
  showResult = false,
}: VerbalPuzzleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [prompt]);

  useEffect(() => {
    if (hasAudio) {
      // Pulse animation for audio button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [hasAudio]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Prompt with optional audio */}
      <View style={styles.promptContainer}>
        <Text style={styles.prompt}>{prompt}</Text>

        {hasAudio && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.audioButton} onPress={onPlayAudio}>
              <Volume2 size={28} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Answer options - vertical list with optional images */}
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
              {option.imageEmoji && (
                <Text style={styles.optionEmoji}>{option.imageEmoji}</Text>
              )}
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
  promptContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  prompt: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 32,
  },
  audioButton: {
    marginTop: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    gap: 12,
  },
  optionSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  optionCorrect: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  optionWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  optionTextCorrect: {
    color: '#16a34a',
  },
  optionTextWrong: {
    color: '#dc2626',
  },
});
