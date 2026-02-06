import { create } from 'zustand';
import type {
  BehavioralScenario,
  BehavioralSession,
  BehavioralChoice,
  EmotionalProfile,
  EmotionalDimension,
  ScenarioType,
  AdventureState,
  CharacterState,
  InventoryItem,
} from '@devassess/shared';
import { api } from '@/lib/api';

interface AdventureStoreState {
  // Current session data
  currentScenario: BehavioralScenario | null;
  currentSession: BehavioralSession | null;
  currentSegmentId: string | null;
  choiceHistory: BehavioralChoice[];

  // Game state
  characterState: Record<string, CharacterState>;
  score: number;
  stars: number;

  // Available scenarios
  availableScenarios: BehavioralScenario[];
  completedScenarioIds: string[];

  // Emotional profile
  emotionalProfile: EmotionalProfile | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  loadAvailableScenarios: (ageMonths: number) => Promise<void>;
  startScenario: (childId: string, scenarioId: string) => Promise<void>;
  submitChoice: (
    choiceId: string,
    selectedOption: string,
    reactionTimeMs: number,
    hesitationCount?: number
  ) => Promise<{ nextSegmentId?: string; isComplete: boolean }>;
  loadEmotionalProfile: (childId: string) => Promise<void>;
  setCurrentSegment: (segmentId: string) => void;
  updateCharacterState: (characterId: string, state: Partial<CharacterState>) => void;
  addScore: (points: number) => void;
  addStar: () => void;
  endSession: () => void;
  resetAdventure: () => void;
}

export const useAdventureStore = create<AdventureStoreState>((set, get) => ({
  currentScenario: null,
  currentSession: null,
  currentSegmentId: null,
  choiceHistory: [],
  characterState: {},
  score: 0,
  stars: 0,
  availableScenarios: [],
  completedScenarioIds: [],
  emotionalProfile: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadAvailableScenarios: async (ageMonths: number) => {
    set({ isLoading: true, error: null });

    try {
      const completedIds = get().completedScenarioIds.join(',');
      const url = `/behavioral/scenarios?age_months=${ageMonths}${
        completedIds ? `&exclude_completed=${completedIds}` : ''
      }`;

      const scenarios = await api.get<BehavioralScenario[]>(url);
      set({ availableScenarios: scenarios, isLoading: false });
    } catch (error) {
      console.error('Error loading scenarios:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load scenarios',
        isLoading: false,
      });
    }
  },

  startScenario: async (childId: string, scenarioId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Get scenario details
      const scenario = await api.get<BehavioralScenario>(`/behavioral/scenario/${scenarioId}`);

      // Start session
      const session = await api.post<BehavioralSession>('/behavioral/session/start', {
        child_id: childId,
        scenario_id: scenarioId,
      });

      // Initialize character states
      const characterState: Record<string, CharacterState> = {};
      scenario.storyContent.characters?.forEach((char: any) => {
        characterState[char.id] = {
          characterId: char.id,
          mood: 'neutral',
          position: { x: 0, y: 0 },
        };
      });

      // Find first segment
      const firstSegment = scenario.storyContent.narrative?.[0];

      set({
        currentScenario: scenario,
        currentSession: session,
        currentSegmentId: firstSegment?.id || null,
        characterState,
        choiceHistory: [],
        score: 0,
        stars: 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error starting scenario:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to start scenario',
        isLoading: false,
      });
    }
  },

  submitChoice: async (
    choiceId: string,
    selectedOption: string,
    reactionTimeMs: number,
    hesitationCount: number = 0
  ) => {
    const { currentSession } = get();
    if (!currentSession) {
      return { isComplete: false };
    }

    set({ isSubmitting: true, error: null });

    try {
      const response = await api.post<{
        recorded: boolean;
        dimension_scores: Record<string, number>;
        next_segment_id: string | null;
        feedback: { immediate?: string; animation?: string } | null;
        is_session_complete: boolean;
      }>('/behavioral/session/choice', {
        session_id: currentSession.id,
        choice_id: choiceId,
        selected_option: selectedOption,
        reaction_time_ms: reactionTimeMs,
        hesitation_count: hesitationCount,
      });

      // Add to choice history
      const choice: BehavioralChoice = {
        id: `${Date.now()}`,
        sessionId: currentSession.id,
        choiceId,
        choiceIndex: get().choiceHistory.length + 1,
        selectedOption,
        reactionTimeMs,
        hesitationCount,
        emotionalDimensions: Object.keys(response.dimension_scores) as EmotionalDimension[],
        dimensionScores: response.dimension_scores,
        createdAt: new Date(),
      };

      set((state) => ({
        choiceHistory: [...state.choiceHistory, choice],
        currentSegmentId: response.next_segment_id,
        isSubmitting: false,
      }));

      // Calculate score bonus based on dimension scores
      const scoreBonus = Object.values(response.dimension_scores).reduce(
        (sum, score) => sum + Math.abs(score),
        0
      );
      if (scoreBonus > 0) {
        get().addScore(Math.round(scoreBonus * 10));
      }

      if (response.is_session_complete) {
        // Mark scenario as completed
        set((state) => ({
          completedScenarioIds: [...state.completedScenarioIds, currentSession.scenarioId],
        }));
        get().addStar();
      }

      return {
        nextSegmentId: response.next_segment_id || undefined,
        isComplete: response.is_session_complete,
      };
    } catch (error) {
      console.error('Error submitting choice:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to submit choice',
        isSubmitting: false,
      });
      return { isComplete: false };
    }
  },

  loadEmotionalProfile: async (childId: string) => {
    try {
      const profile = await api.get<EmotionalProfile>(`/behavioral/profile/${childId}`);
      set({ emotionalProfile: profile });
    } catch (error) {
      console.error('Error loading emotional profile:', error);
    }
  },

  setCurrentSegment: (segmentId: string) => {
    set({ currentSegmentId: segmentId });
  },

  updateCharacterState: (characterId: string, state: Partial<CharacterState>) => {
    set((prev) => ({
      characterState: {
        ...prev.characterState,
        [characterId]: {
          ...prev.characterState[characterId],
          ...state,
        },
      },
    }));
  },

  addScore: (points: number) => {
    set((state) => ({ score: state.score + points }));
  },

  addStar: () => {
    set((state) => ({ stars: state.stars + 1 }));
  },

  endSession: () => {
    set({
      currentScenario: null,
      currentSession: null,
      currentSegmentId: null,
    });
  },

  resetAdventure: () => {
    set({
      currentScenario: null,
      currentSession: null,
      currentSegmentId: null,
      choiceHistory: [],
      characterState: {},
      score: 0,
      stars: 0,
      error: null,
    });
  },
}));
