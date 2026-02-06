import { create } from 'zustand';
import type {
  CognitiveAssessment,
  CognitiveTestItem,
  CognitiveProfile,
  CognitiveDomain,
  PuzzleState,
  PuzzleProgress,
} from '@devassess/shared';
import { api } from '@/lib/api';

interface PuzzleStoreState {
  // Current puzzle session
  currentAssessment: CognitiveAssessment | null;
  currentItem: CognitiveTestItem | null;
  currentDomain: CognitiveDomain | null;

  // Progress tracking
  itemsCompleted: number;
  correctAnswers: number;
  currentTheta: number;
  currentSE: number;

  // UI state
  stars: number;
  encouragementLevel: number; // 0-3, increases with correct answers
  isComplete: boolean;

  // Domain progress
  domainProgress: Record<CognitiveDomain, PuzzleProgress>;

  // Cognitive profile
  cognitiveProfile: CognitiveProfile | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  startPuzzle: (childId: string, domain: CognitiveDomain) => Promise<void>;
  submitAnswer: (
    response: string | string[],
    reactionTimeMs: number
  ) => Promise<{ isCorrect: boolean; isComplete: boolean }>;
  loadCognitiveProfile: (childId: string) => Promise<void>;
  getDomainProgress: (domain: CognitiveDomain) => PuzzleProgress | null;
  resetPuzzle: () => void;
}

// Initial domain progress
const createInitialDomainProgress = (): Record<CognitiveDomain, PuzzleProgress> => ({
  math: { domain: 'math', completed: false, starsEarned: 0 },
  logic: { domain: 'logic', completed: false, starsEarned: 0 },
  verbal: { domain: 'verbal', completed: false, starsEarned: 0 },
  spatial: { domain: 'spatial', completed: false, starsEarned: 0 },
  memory: { domain: 'memory', completed: false, starsEarned: 0 },
});

// Encouragement messages by level
const ENCOURAGEMENT_MESSAGES = {
  0: ['Keep trying!', 'You can do it!', "Let's try another one!"],
  1: ['Nice work!', 'Good job!', "You're doing great!"],
  2: ['Awesome!', 'Fantastic!', "You're a star!"],
  3: ['Amazing!', 'Incredible!', "You're on fire!"],
};

export const usePuzzleStore = create<PuzzleStoreState>((set, get) => ({
  currentAssessment: null,
  currentItem: null,
  currentDomain: null,
  itemsCompleted: 0,
  correctAnswers: 0,
  currentTheta: 0,
  currentSE: 1.0,
  stars: 0,
  encouragementLevel: 0,
  isComplete: false,
  domainProgress: createInitialDomainProgress(),
  cognitiveProfile: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  startPuzzle: async (childId: string, domain: CognitiveDomain) => {
    set({ isLoading: true, error: null, isComplete: false });

    try {
      const response = await api.post<{
        assessment: CognitiveAssessment;
        first_item: CognitiveTestItem | null;
      }>('/cognitive/start', {
        child_id: childId,
        domain,
      });

      set({
        currentAssessment: response.assessment,
        currentItem: response.first_item,
        currentDomain: domain,
        itemsCompleted: 0,
        correctAnswers: 0,
        currentTheta: 0,
        currentSE: 1.0,
        encouragementLevel: 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error starting puzzle:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to start puzzle',
        isLoading: false,
      });
    }
  },

  submitAnswer: async (response: string | string[], reactionTimeMs: number) => {
    const { currentAssessment, currentItem } = get();
    if (!currentAssessment || !currentItem) {
      return { isCorrect: false, isComplete: false };
    }

    set({ isSubmitting: true, error: null });

    try {
      const result = await api.post<{
        is_correct: boolean;
        new_theta: number;
        new_se: number;
        is_complete: boolean;
        next_item: CognitiveTestItem | null;
        feedback: { correct: string; encouragement: string } | null;
      }>('/cognitive/respond', {
        assessment_id: currentAssessment.id,
        item_id: currentItem.id,
        response,
        reaction_time_ms: reactionTimeMs,
      });

      const { is_correct, new_theta, new_se, is_complete, next_item } = result;

      // Update encouragement level based on streak
      let newEncouragementLevel = get().encouragementLevel;
      if (is_correct) {
        newEncouragementLevel = Math.min(3, newEncouragementLevel + 1);
      } else {
        newEncouragementLevel = Math.max(0, newEncouragementLevel - 1);
      }

      // Calculate stars earned for this session
      const newCorrectAnswers = get().correctAnswers + (is_correct ? 1 : 0);
      const newItemsCompleted = get().itemsCompleted + 1;
      const accuracy = newCorrectAnswers / newItemsCompleted;
      let starsForSession = 0;
      if (is_complete) {
        if (accuracy >= 0.8) starsForSession = 3;
        else if (accuracy >= 0.6) starsForSession = 2;
        else if (accuracy >= 0.4) starsForSession = 1;
      }

      set((state) => ({
        currentItem: next_item,
        currentTheta: new_theta,
        currentSE: new_se,
        itemsCompleted: newItemsCompleted,
        correctAnswers: newCorrectAnswers,
        encouragementLevel: newEncouragementLevel,
        isComplete: is_complete,
        stars: is_complete ? state.stars + starsForSession : state.stars,
        isSubmitting: false,
      }));

      // Update domain progress if complete
      if (is_complete && get().currentDomain) {
        const domain = get().currentDomain!;
        set((state) => ({
          domainProgress: {
            ...state.domainProgress,
            [domain]: {
              domain,
              completed: true,
              score: new_theta,
              percentile: Math.round((new_theta + 3) / 6 * 100),
              starsEarned: starsForSession,
              lastAttemptAt: new Date(),
            },
          },
        }));

        // Reload profile
        if (currentAssessment.childId) {
          get().loadCognitiveProfile(currentAssessment.childId);
        }
      }

      return { isCorrect: is_correct, isComplete: is_complete };
    } catch (error) {
      console.error('Error submitting answer:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to submit answer',
        isSubmitting: false,
      });
      return { isCorrect: false, isComplete: false };
    }
  },

  loadCognitiveProfile: async (childId: string) => {
    try {
      const profile = await api.get<CognitiveProfile>(`/cognitive/profile/${childId}`);
      set({ cognitiveProfile: profile });

      // Update domain progress from profile
      if (profile) {
        const domains: CognitiveDomain[] = ['math', 'logic', 'verbal', 'spatial', 'memory'];
        const updatedProgress = { ...get().domainProgress };

        domains.forEach((domain) => {
          const score = profile[`${domain}Score` as keyof CognitiveProfile] as number | undefined;
          const percentile = profile[`${domain}Percentile` as keyof CognitiveProfile] as number | undefined;

          if (score !== undefined && percentile !== undefined) {
            updatedProgress[domain] = {
              domain,
              completed: true,
              score,
              percentile,
              starsEarned: percentile >= 70 ? 3 : percentile >= 50 ? 2 : 1,
              lastAttemptAt: profile.lastUpdatedAt ? new Date(profile.lastUpdatedAt) : undefined,
            };
          }
        });

        set({ domainProgress: updatedProgress });
      }
    } catch (error) {
      console.error('Error loading cognitive profile:', error);
    }
  },

  getDomainProgress: (domain: CognitiveDomain) => {
    return get().domainProgress[domain] || null;
  },

  resetPuzzle: () => {
    set({
      currentAssessment: null,
      currentItem: null,
      currentDomain: null,
      itemsCompleted: 0,
      correctAnswers: 0,
      currentTheta: 0,
      currentSE: 1.0,
      encouragementLevel: 0,
      isComplete: false,
      error: null,
    });
  },
}));

// Helper function to get encouragement message
export function getEncouragementMessage(level: number): string {
  const messages = ENCOURAGEMENT_MESSAGES[level as keyof typeof ENCOURAGEMENT_MESSAGES] || ENCOURAGEMENT_MESSAGES[0];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Helper function to get domain display info
export function getDomainInfo(domain: CognitiveDomain) {
  const info: Record<CognitiveDomain, { name: string; icon: string; color: string; description: string }> = {
    math: {
      name: 'Math',
      icon: 'calculator',
      color: '#4CAF50',
      description: 'Counting, patterns, and numbers',
    },
    logic: {
      name: 'Logic',
      icon: 'puzzle',
      color: '#2196F3',
      description: 'Patterns and sequences',
    },
    verbal: {
      name: 'Words',
      icon: 'book',
      color: '#9C27B0',
      description: 'Vocabulary and language',
    },
    spatial: {
      name: 'Shapes',
      icon: 'shapes',
      color: '#FF9800',
      description: 'Puzzles and rotation',
    },
    memory: {
      name: 'Memory',
      icon: 'brain',
      color: '#E91E63',
      description: 'Recall and matching',
    },
  };

  return info[domain];
}
