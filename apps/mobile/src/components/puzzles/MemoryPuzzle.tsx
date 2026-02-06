import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect, useState } from 'react';

interface MemoryCard {
  id: string;
  value: string;
  color: string;
}

interface MemoryPuzzleProps {
  mode: 'sequence' | 'matching';
  prompt: string;
  sequence?: string[]; // For sequence mode
  cards?: MemoryCard[]; // For matching mode
  onAnswer: (answerId: string) => void;
  onSequenceComplete?: (sequence: string[]) => void;
  disabled?: boolean;
  showingSequence?: boolean;
  currentHighlight?: number;
}

export function MemoryPuzzle({
  mode,
  prompt,
  sequence = [],
  cards = [],
  onAnswer,
  onSequenceComplete,
  disabled = false,
  showingSequence = false,
  currentHighlight = -1,
}: MemoryPuzzleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const cardAnims = useRef(cards.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    setUserSequence([]);
    setFlippedCards(new Set());

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [prompt]);

  // Highlight animation for sequence mode
  useEffect(() => {
    if (mode === 'sequence' && currentHighlight >= 0 && currentHighlight < sequence.length) {
      // Flash the current item
      const index = parseInt(sequence[currentHighlight]) - 1;
      if (index >= 0 && cardAnims[index]) {
        Animated.sequence([
          Animated.timing(cardAnims[index], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(cardAnims[index], {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [currentHighlight]);

  const handleSequencePress = (value: string) => {
    if (disabled || showingSequence) return;

    const newSequence = [...userSequence, value];
    setUserSequence(newSequence);

    if (newSequence.length === sequence.length) {
      onSequenceComplete?.(newSequence);
    }
  };

  const handleCardPress = (cardId: string) => {
    if (disabled) return;

    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(cardId)) {
      newFlipped.delete(cardId);
    } else {
      newFlipped.add(cardId);
    }
    setFlippedCards(newFlipped);
    onAnswer(cardId);
  };

  if (mode === 'sequence') {
    // Sequence memory game (Simon-like)
    const buttons = [
      { id: '1', color: '#ef4444', label: '1' },
      { id: '2', color: '#22c55e', label: '2' },
      { id: '3', color: '#3b82f6', label: '3' },
      { id: '4', color: '#f59e0b', label: '4' },
    ];

    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.prompt}>{prompt}</Text>

        {showingSequence && (
          <Text style={styles.watchText}>Watch carefully...</Text>
        )}

        {!showingSequence && userSequence.length > 0 && (
          <View style={styles.userSequence}>
            <Text style={styles.sequenceLabel}>Your sequence:</Text>
            <View style={styles.sequenceDots}>
              {userSequence.map((_, i) => (
                <View key={i} style={styles.sequenceDot} />
              ))}
              {Array.from({ length: sequence.length - userSequence.length }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.sequenceDotEmpty} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.sequenceGrid}>
          {buttons.map((button, index) => (
            <Animated.View
              key={button.id}
              style={[
                styles.sequenceButtonWrapper,
                {
                  transform: [
                    {
                      scale: cardAnims[index]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }) || 1,
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.sequenceButton,
                  { backgroundColor: button.color },
                ]}
                onPress={() => handleSequencePress(button.id)}
                disabled={disabled || showingSequence}
              >
                <Text style={styles.sequenceButtonText}>{button.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  }

  // Card matching mode
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.prompt}>{prompt}</Text>

      <View style={styles.cardGrid}>
        {cards.map((card) => {
          const isFlipped = flippedCards.has(card.id);

          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                isFlipped && { backgroundColor: card.color },
              ]}
              onPress={() => handleCardPress(card.id)}
              disabled={disabled}
            >
              {isFlipped ? (
                <Text style={styles.cardValue}>{card.value}</Text>
              ) : (
                <Text style={styles.cardBack}>?</Text>
              )}
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
  watchText: {
    fontSize: 18,
    color: '#ec4899',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  userSequence: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sequenceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  sequenceDots: {
    flexDirection: 'row',
    gap: 8,
  },
  sequenceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  sequenceDotEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  sequenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  sequenceButtonWrapper: {
    width: '42%',
  },
  sequenceButton: {
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sequenceButtonText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  card: {
    width: 70,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardBack: {
    fontSize: 32,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
});
