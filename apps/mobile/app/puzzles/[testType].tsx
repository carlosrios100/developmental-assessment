import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { X, Star, Check, ChevronRight } from 'lucide-react-native';
import { usePuzzleStore, getEncouragementMessage, getDomainInfo } from '@/stores/puzzle-store';
import { useChildStore } from '@/stores/child-store';
import type { CognitiveDomain } from '@devassess/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PuzzleTestScreen() {
  const { testType } = useLocalSearchParams<{ testType: string }>();
  const domain = testType as CognitiveDomain;
  const { selectedChild: currentChild } = useChildStore();
  const {
    currentItem,
    itemsCompleted,
    correctAnswers,
    encouragementLevel,
    isComplete,
    isLoading,
    isSubmitting,
    startPuzzle,
    submitAnswer,
    resetPuzzle,
    stars,
  } = usePuzzleStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const domainInfo = getDomainInfo(domain);

  useEffect(() => {
    if (currentChild && domain) {
      resetPuzzle();
      startPuzzle(currentChild.id, domain);
    }

    return () => {
      resetPuzzle();
    };
  }, [currentChild, domain]);

  useEffect(() => {
    if (currentItem) {
      setStartTime(Date.now());
      setSelectedAnswer(null);
    }
  }, [currentItem?.id]);

  const handleAnswer = async (answer: string) => {
    if (isSubmitting || showFeedback) return;

    setSelectedAnswer(answer);
    const reactionTime = Date.now() - startTime;

    const result = await submitAnswer(answer, reactionTime);

    setLastCorrect(result.isCorrect);
    setShowFeedback(true);

    // Animate feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide feedback after delay
    setTimeout(() => {
      setShowFeedback(false);
      if (result.isComplete) {
        // Will trigger isComplete state
      }
    }, 1500);
  };

  const handleExit = () => {
    resetPuzzle();
    router.back();
  };

  if (isLoading || !currentItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: domainInfo.color + '15' }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading puzzle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    const accuracy = itemsCompleted > 0 ? (correctAnswers / itemsCompleted) * 100 : 0;
    const starsEarned = accuracy >= 80 ? 3 : accuracy >= 60 ? 2 : accuracy >= 40 ? 1 : 0;

    return (
      <SafeAreaView style={styles.completeContainer}>
        <View style={styles.completeContent}>
          <View style={[styles.completeIcon, { backgroundColor: domainInfo.color + '20' }]}>
            <Check size={64} color={domainInfo.color} />
          </View>
          <Text style={styles.completeTitle}>Puzzle Complete!</Text>
          <Text style={styles.completeScore}>
            {correctAnswers} / {itemsCompleted} correct
          </Text>

          <View style={styles.starsEarned}>
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                size={48}
                color="#fbbf24"
                fill={i <= starsEarned ? '#fbbf24' : 'transparent'}
              />
            ))}
          </View>

          <Text style={styles.encouragementText}>
            {starsEarned === 3
              ? "Amazing! You're a puzzle master!"
              : starsEarned === 2
              ? 'Great job! Keep practicing!'
              : starsEarned === 1
              ? 'Good effort! Try again to earn more stars!'
              : "Nice try! Practice makes perfect!"}
          </Text>

          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: domainInfo.color }]}
            onPress={handleExit}
          >
            <Text style={styles.completeButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const content = currentItem.content;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: domainInfo.color + '15' }]}
      edges={['bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <X size={24} color="#6b7280" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((itemsCompleted / 15) * 100, 100)}%`,
                  backgroundColor: domainInfo.color,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.starsContainer}>
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              size={20}
              color="#fbbf24"
              fill={i <= encouragementLevel ? '#fbbf24' : 'transparent'}
            />
          ))}
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{content.prompt}</Text>

        {/* Images if any */}
        {content.images && content.images.length > 0 && (
          <View style={styles.imageContainer}>
            {/* Placeholder for images */}
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>🖼️</Text>
            </View>
          </View>
        )}
      </View>

      {/* Answer Options */}
      <View style={styles.optionsContainer}>
        {content.options?.map((option: any, index: number) => {
          const isSelected = selectedAnswer === option.id;
          const showCorrect = showFeedback && option.id === content.correctAnswer;
          const showWrong = showFeedback && isSelected && option.id !== content.correctAnswer;

          return (
            <Animated.View
              key={option.id}
              style={[
                { transform: [{ scale: isSelected ? scaleAnim : 1 }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  isSelected && { borderColor: domainInfo.color, borderWidth: 3 },
                  showCorrect && styles.optionCorrect,
                  showWrong && styles.optionWrong,
                ]}
                onPress={() => handleAnswer(option.id)}
                disabled={isSubmitting || showFeedback}
              >
                <Text style={styles.optionLabel}>
                  {option.label || option.id}
                </Text>
                {showCorrect && <Check size={24} color="#22c55e" />}
                {showWrong && <X size={24} color="#ef4444" />}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Feedback Overlay */}
      {showFeedback && (
        <View style={[styles.feedbackOverlay, lastCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackText}>
            {lastCorrect
              ? getEncouragementMessage(encouragementLevel)
              : "That's not quite right. Keep trying!"}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 34,
  },
  imageContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 60,
  },
  optionsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCorrect: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  optionWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1f2937',
  },
  feedbackOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  feedbackCorrect: {
    backgroundColor: '#22c55e',
  },
  feedbackWrong: {
    backgroundColor: '#ef4444',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  // Complete screen
  completeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  completeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  completeScore: {
    fontSize: 20,
    color: '#6b7280',
    marginTop: 8,
  },
  starsEarned: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  encouragementText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 24,
  },
  completeButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 32,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
