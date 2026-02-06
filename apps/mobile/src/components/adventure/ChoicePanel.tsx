import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface ChoiceOption {
  id: string;
  label: string;
  color?: string;
}

interface ChoicePanelProps {
  prompt: string;
  options: ChoiceOption[];
  onSelect: (optionId: string) => void;
  disabled?: boolean;
  selectedId?: string | null;
}

export function ChoicePanel({
  prompt,
  options,
  onSelect,
  disabled = false,
  selectedId = null,
}: ChoicePanelProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(options.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = (optionId: string, index: number) => {
    if (disabled) return;

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onSelect(optionId);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.options}>
        {options.map((option, index) => {
          const isSelected = selectedId === option.id;
          const borderColor = option.color || '#ec4899';

          return (
            <Animated.View
              key={option.id}
              style={{ transform: [{ scale: scaleAnims[index] }] }}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { borderColor },
                  isSelected && styles.optionButtonSelected,
                  disabled && !isSelected && styles.optionButtonDisabled,
                ]}
                onPress={() => handlePress(option.id, index)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                    disabled && !isSelected && styles.optionTextDisabled,
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 20,
  },
  prompt: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  options: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#fdf2f8',
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  optionTextSelected: {
    color: '#ec4899',
  },
  optionTextDisabled: {
    color: '#9ca3af',
  },
});
