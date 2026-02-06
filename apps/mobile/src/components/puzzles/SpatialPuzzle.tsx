import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';

interface ShapeOption {
  id: string;
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'hexagon';
  color: string;
  rotation?: number;
}

interface SpatialPuzzleProps {
  prompt: string;
  targetShape?: ShapeOption;
  options: ShapeOption[];
  onAnswer: (answerId: string) => void;
  disabled?: boolean;
  selectedId?: string | null;
  correctId?: string | null;
  showResult?: boolean;
}

function ShapeView({ shape, color, rotation = 0, size = 48 }: {
  shape: ShapeOption['shape'];
  color: string;
  rotation?: number;
  size?: number;
}) {
  const getShapeStyle = () => {
    switch (shape) {
      case 'circle':
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        };
      case 'square':
        return {
          width: size,
          height: size,
          borderRadius: 4,
          backgroundColor: color,
          transform: [{ rotate: `${rotation}deg` }],
        };
      case 'triangle':
        return {
          width: 0,
          height: 0,
          borderLeftWidth: size / 2,
          borderRightWidth: size / 2,
          borderBottomWidth: size,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          transform: [{ rotate: `${rotation}deg` }],
        };
      case 'star':
        // Simplified star using emoji
        return null;
      case 'hexagon':
        // Simplified hexagon representation
        return {
          width: size,
          height: size * 0.87,
          backgroundColor: color,
          borderRadius: 8,
          transform: [{ rotate: `${rotation}deg` }],
        };
      default:
        return {
          width: size,
          height: size,
          backgroundColor: color,
        };
    }
  };

  const shapeStyle = getShapeStyle();

  // Use emoji for complex shapes
  if (shape === 'star') {
    return (
      <View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
        <Text style={{ fontSize: size * 0.8, color }}>{'\u2B50'}</Text>
      </View>
    );
  }

  return <View style={shapeStyle} />;
}

export function SpatialPuzzle({
  prompt,
  targetShape,
  options,
  onAnswer,
  disabled = false,
  selectedId = null,
  correctId = null,
  showResult = false,
}: SpatialPuzzleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Rotate target shape for attention
    if (targetShape) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [prompt]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Prompt */}
      <Text style={styles.prompt}>{prompt}</Text>

      {/* Target shape to match */}
      {targetShape && (
        <Animated.View
          style={[
            styles.targetContainer,
            {
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <ShapeView
            shape={targetShape.shape}
            color={targetShape.color}
            rotation={targetShape.rotation}
            size={80}
          />
        </Animated.View>
      )}

      {/* Options grid */}
      <View style={styles.optionsGrid}>
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
              <ShapeView
                shape={option.shape}
                color={option.color}
                rotation={option.rotation}
                size={48}
              />
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
  targetContainer: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  optionButton: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#f59e0b',
    backgroundColor: '#fefce8',
  },
  optionCorrect: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  optionWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
});
