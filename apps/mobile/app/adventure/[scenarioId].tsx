import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { X, Star, ChevronRight } from 'lucide-react-native';
import { useAdventureStore } from '@/stores/adventure-store';
import { useChildStore } from '@/stores/child-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScenarioScreen() {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const { selectedChild: currentChild } = useChildStore();
  const {
    currentScenario,
    currentSession,
    currentSegmentId,
    isLoading,
    isSubmitting,
    startScenario,
    submitChoice,
    setCurrentSegment,
    endSession,
    addScore,
    score,
    stars,
  } = useAdventureStore();

  const [choiceStartTime, setChoiceStartTime] = useState<number | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scenarioId && currentChild) {
      startScenario(currentChild.id, scenarioId);
    }

    return () => {
      endSession();
    };
  }, [scenarioId, currentChild]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentSegmentId]);

  if (isLoading || !currentScenario || !currentSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Starting adventure...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentSegment = currentScenario.storyContent.narrative?.find(
    (s: any) => s.id === currentSegmentId
  );

  const currentChoice = currentSegment?.choiceId
    ? currentScenario.choices.find((c: any) => c.id === currentSegment.choiceId)
    : null;

  const handleChoiceSelect = async (optionId: string) => {
    if (!currentChoice || isSubmitting) return;

    const reactionTime = choiceStartTime ? Date.now() - choiceStartTime : 3000;

    const result = await submitChoice(
      currentChoice.id,
      optionId,
      reactionTime,
      0
    );

    if (result.isComplete) {
      setShowComplete(true);
    } else if (result.nextSegmentId) {
      fadeAnim.setValue(0);
      setChoiceStartTime(Date.now());
    }
  };

  const handleExit = () => {
    endSession();
    router.back();
  };

  // Start timing when choice is presented
  useEffect(() => {
    if (currentChoice) {
      setChoiceStartTime(Date.now());
    }
  }, [currentChoice?.id]);

  if (showComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completeContainer}>
          <View style={styles.completeIcon}>
            <Star size={64} color="#fbbf24" fill="#fbbf24" />
          </View>
          <Text style={styles.completeTitle}>Adventure Complete!</Text>
          <Text style={styles.completeSubtitle}>
            You earned {score} points!
          </Text>

          <View style={styles.starsEarned}>
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                size={40}
                color="#fbbf24"
                fill={i <= stars ? '#fbbf24' : 'transparent'}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.completeButton} onPress={handleExit}>
            <Text style={styles.completeButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <X size={24} color="#6b7280" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{currentScenario.title}</Text>
        </View>
        <View style={styles.scoreDisplay}>
          <Star size={18} color="#fbbf24" fill="#fbbf24" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      {/* Story Content */}
      <View style={styles.storyContainer}>
        {/* Background/Scene */}
        <View style={styles.sceneContainer}>
          <View style={styles.characterContainer}>
            {/* Placeholder for character sprites */}
            <View style={styles.characterPlaceholder}>
              <Text style={styles.characterEmoji}>
                {currentScenario.scenarioType === 'sharing' && '👫'}
                {currentScenario.scenarioType === 'empathy_response' && '🤗'}
                {currentScenario.scenarioType === 'delayed_gratification' && '🎁'}
                {currentScenario.scenarioType === 'cooperation' && '🤝'}
                {currentScenario.scenarioType === 'failure_recovery' && '💪'}
                {currentScenario.scenarioType === 'risk_assessment' && '🌟'}
              </Text>
            </View>
          </View>
        </View>

        {/* Dialogue Box */}
        {currentSegment && (
          <Animated.View style={[styles.dialogueBox, { opacity: fadeAnim }]}>
            {currentSegment.speaker && (
              <Text style={styles.speakerName}>{currentSegment.speaker}</Text>
            )}
            <Text style={styles.dialogueText}>{currentSegment.text}</Text>

            {/* Next button for non-choice segments */}
            {!currentChoice && currentSegment.nextSegmentId && (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => {
                  fadeAnim.setValue(0);
                  setCurrentSegment(currentSegment.nextSegmentId!);
                }}
              >
                <Text style={styles.nextButtonText}>Continue</Text>
                <ChevronRight size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Choice Panel */}
        {currentChoice && (
          <View style={styles.choicePanel}>
            <Text style={styles.choicePrompt}>{currentChoice.prompt}</Text>
            <View style={styles.choiceOptions}>
              {currentChoice.options.map((option: any) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.choiceButton,
                    { borderColor: option.color || '#ec4899' },
                  ]}
                  onPress={() => handleChoiceSelect(option.id)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.choiceButtonText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fbbf24',
  },
  storyContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterContainer: {
    alignItems: 'center',
  },
  characterPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterEmoji: {
    fontSize: 80,
  },
  dialogueBox: {
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
  speakerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
    marginBottom: 8,
  },
  dialogueText: {
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 28,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec4899',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: 'flex-end',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  choicePanel: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 20,
  },
  choicePrompt: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  choiceOptions: {
    gap: 10,
  },
  choiceButton: {
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  choiceButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  // Complete screen
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#16a34a',
  },
  completeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  starsEarned: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  completeButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 32,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
  },
});
