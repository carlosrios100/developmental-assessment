import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Activity,
  Hand,
  Lightbulb,
  Users,
  HelpCircle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react-native';
import { mockChildren } from '@/lib/mock-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Response = 'yes' | 'sometimes' | 'not_yet' | null;

interface Question {
  id: string;
  domain: string;
  question: string;
  description: string;
  examples: string[];
}

const DOMAINS = [
  { id: 'communication', name: 'Communication', icon: MessageCircle, color: '#3b82f6', emoji: '💬' },
  { id: 'gross_motor', name: 'Gross Motor', icon: Activity, color: '#22c55e', emoji: '🏃' },
  { id: 'fine_motor', name: 'Fine Motor', icon: Hand, color: '#f59e0b', emoji: '✋' },
  { id: 'problem_solving', name: 'Problem Solving', icon: Lightbulb, color: '#8b5cf6', emoji: '💡' },
  { id: 'personal_social', name: 'Personal-Social', icon: Users, color: '#ec4899', emoji: '👥' },
];

// Generate sample questions for demonstration
function generateQuestions(ageMonths: number): Question[] {
  const questions: Question[] = [];

  const questionTemplates: Record<string, { questions: string[], descriptions: string[], examples: string[][] }> = {
    communication: {
      questions: [
        'Does your child respond to their name when called?',
        'Does your child use gestures like waving or pointing?',
        'Does your child try to communicate their needs?',
        'Does your child understand simple instructions?',
        'Does your child babble or make speech-like sounds?',
        'Does your child show interest when you talk to them?',
      ],
      descriptions: [
        'Child turns or looks when name is called',
        'Child uses hand movements to communicate',
        'Child attempts to express wants and needs',
        'Child follows simple verbal directions',
        'Child produces consonant-vowel combinations',
        'Child attends to speech and conversation',
      ],
      examples: [
        ['Looks up when you say their name', 'Turns toward you when called'],
        ['Waves bye-bye', 'Points to things they want'],
        ['Reaches toward desired objects', 'Makes sounds to get attention'],
        ['Comes when called', 'Stops when told "no"'],
        ['Says "ba-ba" or "da-da"', 'Makes varied sounds'],
        ['Watches your mouth when you talk', 'Gets quiet to listen'],
      ],
    },
    gross_motor: {
      questions: [
        'Does your child hold their head up steadily?',
        'Does your child roll over in both directions?',
        'Does your child sit without support?',
        'Does your child pull to stand using furniture?',
        'Does your child take steps while holding on?',
        'Does your child show good balance when moving?',
      ],
      descriptions: [
        'Child maintains head control',
        'Child can roll from back to tummy and back',
        'Child sits independently',
        'Child uses support to achieve standing',
        'Child cruises along furniture',
        'Child demonstrates stable movement patterns',
      ],
      examples: [
        ['Keeps head upright when held', 'Lifts head during tummy time'],
        ['Rolls from back to tummy', 'Rolls both ways easily'],
        ['Sits alone for several minutes', 'Balances while sitting'],
        ['Pulls up on couch or table', 'Stands holding furniture'],
        ['Walks along couch', 'Moves sideways holding support'],
        ['Rarely falls when walking', 'Moves smoothly'],
      ],
    },
    fine_motor: {
      questions: [
        'Does your child reach for and grasp objects?',
        'Does your child transfer objects between hands?',
        'Does your child use a pincer grasp (thumb and finger)?',
        'Does your child bang objects together?',
        'Does your child release objects voluntarily?',
        'Does your child pick up small items?',
      ],
      descriptions: [
        'Child can reach and grab toys',
        'Child passes items from hand to hand',
        'Child picks up small items with fingers',
        'Child brings objects together at midline',
        'Child can let go of items intentionally',
        'Child retrieves tiny objects',
      ],
      examples: [
        ['Grabs toys within reach', 'Holds rattle when given'],
        ['Moves block from left to right hand', 'Switches toy between hands'],
        ['Picks up Cheerios with fingers', 'Uses thumb and finger together'],
        ['Bangs blocks together', 'Hits toys against each other'],
        ['Drops items into container', 'Lets go when asked'],
        ['Picks up crumbs', 'Grabs small pieces of food'],
      ],
    },
    problem_solving: {
      questions: [
        'Does your child look for objects that fall out of sight?',
        'Does your child explore objects in different ways?',
        'Does your child imitate simple actions?',
        'Does your child use objects as tools?',
        'Does your child solve simple problems?',
        'Does your child show curiosity about new things?',
      ],
      descriptions: [
        'Child searches for dropped items',
        'Child examines objects thoroughly',
        'Child copies actions they observe',
        'Child uses items to achieve goals',
        'Child figures out how things work',
        'Child investigates unfamiliar items',
      ],
      examples: [
        ['Looks where toy fell', 'Searches for hidden objects'],
        ['Shakes, bangs, and mouths toys', 'Turns objects over to examine'],
        ['Claps after you clap', 'Waves after seeing you wave'],
        ['Uses spoon to reach toy', 'Pulls string to get object'],
        ['Figures out how to open containers', 'Removes obstacles'],
        ['Examines new toys carefully', 'Shows interest in unfamiliar items'],
      ],
    },
    personal_social: {
      questions: [
        'Does your child smile at familiar people?',
        'Does your child show separation anxiety?',
        'Does your child play interactive games?',
        'Does your child show affection openly?',
        'Does your child help with simple tasks?',
        'Does your child show awareness of others\' feelings?',
      ],
      descriptions: [
        'Child responds positively to known faces',
        'Child shows distress when parent leaves',
        'Child engages in back-and-forth play',
        'Child expresses love through actions',
        'Child participates in routines',
        'Child responds to others\' emotions',
      ],
      examples: [
        ['Smiles when sees parents', 'Happy around familiar faces'],
        ['Cries when parent leaves room', 'Clings in new situations'],
        ['Plays peek-a-boo', 'Enjoys pat-a-cake'],
        ['Gives hugs and kisses', 'Snuggles with caregiver'],
        ['Helps put toys away', 'Assists with dressing'],
        ['Looks concerned when someone cries', 'Notices when others are upset'],
      ],
    },
  };

  DOMAINS.forEach((domain) => {
    const templates = questionTemplates[domain.id];
    for (let i = 0; i < 6; i++) {
      questions.push({
        id: `${domain.id}_${ageMonths}_${i + 1}`,
        domain: domain.id,
        question: templates.questions[i],
        description: templates.descriptions[i],
        examples: templates.examples[i],
      });
    }
  });

  return questions;
}

export default function ScreeningQuestionnaire() {
  const { age, childId } = useLocalSearchParams<{ age: string; childId: string }>();
  const ageMonths = parseInt(age || '12', 10);
  const child = mockChildren.find(c => c.id === childId);

  const [questions] = useState(() => generateQuestions(ageMonths));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [showHelp, setShowHelp] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentIndex];
  const currentDomain = DOMAINS.find(d => d.id === currentQuestion.domain);
  const progress = (currentIndex + 1) / questions.length;

  // Questions in current domain
  const domainQuestions = questions.filter(q => q.domain === currentQuestion.domain);
  const domainIndex = domainQuestions.findIndex(q => q.id === currentQuestion.id);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleResponse = (response: Response) => {
    setResponses(prev => ({ ...prev, [currentQuestion.id]: response }));

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        animateSlide('next');
        setCurrentIndex(prev => prev + 1);
      } else {
        completeScreening();
      }
    }, 300);
  };

  const animateSlide = (direction: 'next' | 'prev') => {
    slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 20,
    }).start();
  };

  const goBack = () => {
    if (currentIndex > 0) {
      animateSlide('prev');
      setCurrentIndex(prev => prev - 1);
    }
  };

  const completeScreening = () => {
    // Calculate scores
    const domainScores: Record<string, { score: number; total: number }> = {};

    DOMAINS.forEach(domain => {
      const domainQs = questions.filter(q => q.domain === domain.id);
      let score = 0;
      domainQs.forEach(q => {
        const response = responses[q.id];
        if (response === 'yes') score += 10;
        else if (response === 'sometimes') score += 5;
      });
      domainScores[domain.id] = { score, total: 60 };
    });

    // Navigate to results
    router.replace({
      pathname: '/screening/results',
      params: {
        childId,
        age: ageMonths.toString(),
        scores: JSON.stringify(domainScores),
      },
    });
  };

  const exitScreening = () => {
    Alert.alert(
      'Exit Screening?',
      'Your progress will be lost. Are you sure you want to exit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const answeredInDomain = domainQuestions.filter(q => responses[q.id]).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={exitScreening}>
          <X size={24} color="#6b7280" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{child?.first_name}'s Screening</Text>
          <Text style={styles.headerSubtitle}>{ageMonths}-Month Questionnaire</Text>
        </View>
        <TouchableOpacity style={styles.helpButton} onPress={() => setShowHelp(true)}>
          <HelpCircle size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: currentDomain?.color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {questions.length}
        </Text>
      </View>

      {/* Domain Header */}
      <View style={[styles.domainHeader, { backgroundColor: currentDomain?.color + '15' }]}>
        <Text style={styles.domainEmoji}>{currentDomain?.emoji}</Text>
        <View style={styles.domainInfo}>
          <Text style={[styles.domainName, { color: currentDomain?.color }]}>
            {currentDomain?.name}
          </Text>
          <Text style={styles.domainProgress}>
            Question {domainIndex + 1} of 6 • {answeredInDomain} answered
          </Text>
        </View>
      </View>

      {/* Question Card */}
      <Animated.View
        style={[
          styles.questionContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <ScrollView
          style={styles.questionScroll}
          contentContainerStyle={styles.questionScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            <Text style={styles.questionDescription}>{currentQuestion.description}</Text>

            {/* Examples */}
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Examples:</Text>
              {currentQuestion.examples.map((example, idx) => (
                <View key={idx} style={styles.exampleRow}>
                  <View style={[styles.exampleBullet, { backgroundColor: currentDomain?.color }]} />
                  <Text style={styles.exampleText}>{example}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Response Options */}
          <View style={styles.responseContainer}>
            <Text style={styles.responsePrompt}>Based on your observations:</Text>

            <TouchableOpacity
              style={[
                styles.responseButton,
                styles.responseYes,
                responses[currentQuestion.id] === 'yes' && styles.responseYesSelected,
              ]}
              onPress={() => handleResponse('yes')}
            >
              <View style={styles.responseIcon}>
                <CheckCircle
                  size={24}
                  color={responses[currentQuestion.id] === 'yes' ? '#ffffff' : '#22c55e'}
                />
              </View>
              <View style={styles.responseContent}>
                <Text style={[
                  styles.responseTitle,
                  responses[currentQuestion.id] === 'yes' && styles.responseTitleSelected,
                ]}>
                  Yes
                </Text>
                <Text style={[
                  styles.responseDesc,
                  responses[currentQuestion.id] === 'yes' && styles.responseDescSelected,
                ]}>
                  My child does this regularly
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.responseButton,
                styles.responseSometimes,
                responses[currentQuestion.id] === 'sometimes' && styles.responseSometimesSelected,
              ]}
              onPress={() => handleResponse('sometimes')}
            >
              <View style={styles.responseIcon}>
                <Clock
                  size={24}
                  color={responses[currentQuestion.id] === 'sometimes' ? '#ffffff' : '#f59e0b'}
                />
              </View>
              <View style={styles.responseContent}>
                <Text style={[
                  styles.responseTitle,
                  responses[currentQuestion.id] === 'sometimes' && styles.responseTitleSelected,
                ]}>
                  Sometimes
                </Text>
                <Text style={[
                  styles.responseDesc,
                  responses[currentQuestion.id] === 'sometimes' && styles.responseDescSelected,
                ]}>
                  My child is starting to do this
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.responseButton,
                styles.responseNotYet,
                responses[currentQuestion.id] === 'not_yet' && styles.responseNotYetSelected,
              ]}
              onPress={() => handleResponse('not_yet')}
            >
              <View style={styles.responseIcon}>
                <X
                  size={24}
                  color={responses[currentQuestion.id] === 'not_yet' ? '#ffffff' : '#ef4444'}
                />
              </View>
              <View style={styles.responseContent}>
                <Text style={[
                  styles.responseTitle,
                  responses[currentQuestion.id] === 'not_yet' && styles.responseTitleSelected,
                ]}>
                  Not Yet
                </Text>
                <Text style={[
                  styles.responseDesc,
                  responses[currentQuestion.id] === 'not_yet' && styles.responseDescSelected,
                ]}>
                  My child doesn't do this yet
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={goBack}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={24} color={currentIndex === 0 ? '#d1d5db' : '#6b7280'} />
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        {/* Domain indicators */}
        <View style={styles.domainIndicators}>
          {DOMAINS.map((domain, idx) => {
            const domainQs = questions.filter(q => q.domain === domain.id);
            const firstIndex = questions.findIndex(q => q.domain === domain.id);
            const lastIndex = firstIndex + 5;
            const isActive = currentIndex >= firstIndex && currentIndex <= lastIndex;
            const isComplete = domainQs.every(q => responses[q.id]);

            return (
              <View
                key={domain.id}
                style={[
                  styles.domainDot,
                  { backgroundColor: isActive ? domain.color : isComplete ? domain.color + '40' : '#e5e7eb' },
                ]}
              />
            );
          })}
        </View>

        {currentIndex < questions.length - 1 ? (
          <TouchableOpacity
            style={[styles.navButton, !responses[currentQuestion.id] && styles.navButtonDisabled]}
            onPress={() => {
              animateSlide('next');
              setCurrentIndex(prev => prev + 1);
            }}
            disabled={!responses[currentQuestion.id]}
          >
            <Text style={[styles.navButtonText, !responses[currentQuestion.id] && styles.navButtonTextDisabled]}>
              Skip
            </Text>
            <ChevronRight size={24} color={responses[currentQuestion.id] ? '#6b7280' : '#d1d5db'} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.finishButton, Object.keys(responses).length < questions.length && styles.finishButtonDisabled]}
            onPress={completeScreening}
          >
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  exitButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  helpButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    width: 60,
    textAlign: 'right',
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  domainEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  domainInfo: {
    flex: 1,
  },
  domainName: {
    fontSize: 18,
    fontWeight: '700',
  },
  domainProgress: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  questionContainer: {
    flex: 1,
  },
  questionScroll: {
    flex: 1,
  },
  questionScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 28,
  },
  questionDescription: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 22,
  },
  examplesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  exampleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  responseContainer: {
    gap: 12,
  },
  responsePrompt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  responseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  responseYes: {
    borderColor: '#dcfce7',
    backgroundColor: '#f0fdf4',
  },
  responseYesSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  responseSometimes: {
    borderColor: '#fef3c7',
    backgroundColor: '#fffbeb',
  },
  responseSometimesSelected: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  responseNotYet: {
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  responseNotYetSelected: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  responseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  responseContent: {
    flex: 1,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  responseTitleSelected: {
    color: '#ffffff',
  },
  responseDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  responseDescSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  navButtonTextDisabled: {
    color: '#d1d5db',
  },
  domainIndicators: {
    flexDirection: 'row',
    gap: 6,
  },
  domainDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  finishButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  finishButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
