import { create } from 'zustand';
import type {
  MosaicAssessment,
  ArchetypeMatch,
  IkigaiChart,
  MosaicGapAnalysis,
  CognitiveProfile,
  EmotionalProfile,
  Archetype,
  ArchetypeType,
} from '@devassess/shared';
import { api } from '@/lib/api';

interface MosaicState {
  // Current Mosaic assessment data
  currentAssessment: MosaicAssessment | null;
  archetypeMatches: ArchetypeMatch[];
  ikigaiChart: IkigaiChart | null;
  gapAnalysis: MosaicGapAnalysis[];
  cognitiveProfile: CognitiveProfile | null;
  emotionalProfile: EmotionalProfile | null;

  // All archetypes for reference
  archetypes: Archetype[];

  // Loading states
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  // Actions
  generateMosaic: (childId: string, includeContext?: boolean) => Promise<void>;
  loadMosaic: (childId: string, version?: number) => Promise<void>;
  loadMosaicHistory: (childId: string) => Promise<MosaicAssessment[]>;
  loadArchetypes: () => Promise<void>;
  getArchetype: (type: ArchetypeType) => Archetype | undefined;
  getArchetypeGuidance: (type: ArchetypeType) => Promise<any>;
  clearMosaic: () => void;
}

export const useMosaicStore = create<MosaicState>((set, get) => ({
  currentAssessment: null,
  archetypeMatches: [],
  ikigaiChart: null,
  gapAnalysis: [],
  cognitiveProfile: null,
  emotionalProfile: null,
  archetypes: [],
  isLoading: false,
  isGenerating: false,
  error: null,

  generateMosaic: async (childId: string, includeContext: boolean = true) => {
    set({ isGenerating: true, error: null });

    try {
      const response = await api.post<{
        mosaic_assessment: MosaicAssessment;
        archetype_matches: ArchetypeMatch[];
        ikigai_chart: IkigaiChart;
        gap_analysis: MosaicGapAnalysis[];
        cognitive_profile: CognitiveProfile | null;
        emotional_profile: EmotionalProfile | null;
      }>('/mosaic/generate', {
        child_id: childId,
        include_context: includeContext,
      });

      set({
        currentAssessment: response.mosaic_assessment,
        archetypeMatches: response.archetype_matches,
        ikigaiChart: response.ikigai_chart,
        gapAnalysis: response.gap_analysis,
        cognitiveProfile: response.cognitive_profile,
        emotionalProfile: response.emotional_profile,
        isGenerating: false,
      });
    } catch (error) {
      console.error('Error generating Mosaic:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to generate Mosaic',
        isGenerating: false,
      });
    }
  },

  loadMosaic: async (childId: string, version?: number) => {
    set({ isLoading: true, error: null });

    try {
      const url = version
        ? `/mosaic/assessment/${childId}?version=${version}`
        : `/mosaic/assessment/${childId}`;

      const assessment = await api.get<MosaicAssessment>(url);

      // Load related data
      if (assessment.id) {
        const [ikigai, gaps] = await Promise.all([
          api.get<IkigaiChart>(`/mosaic/ikigai/${assessment.id}`).catch(() => null),
          api.get<MosaicGapAnalysis[]>(`/mosaic/gaps/${assessment.id}`).catch(() => []),
        ]);

        // Load profiles
        const [cognitive, emotional] = await Promise.all([
          api.get<CognitiveProfile>(`/cognitive/profile/${childId}`).catch(() => null),
          api.get<EmotionalProfile>(`/behavioral/profile/${childId}`).catch(() => null),
        ]);

        set({
          currentAssessment: assessment,
          ikigaiChart: ikigai,
          gapAnalysis: gaps,
          cognitiveProfile: cognitive,
          emotionalProfile: emotional,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading Mosaic:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load Mosaic',
        isLoading: false,
      });
    }
  },

  loadMosaicHistory: async (childId: string) => {
    try {
      const history = await api.get<MosaicAssessment[]>(`/mosaic/assessment/${childId}/history`);
      return history;
    } catch (error) {
      console.error('Error loading Mosaic history:', error);
      return [];
    }
  },

  loadArchetypes: async () => {
    if (get().archetypes.length > 0) return;

    try {
      const archetypes = await api.get<Archetype[]>('/mosaic/archetypes');
      set({ archetypes });
    } catch (error) {
      console.error('Error loading archetypes:', error);
    }
  },

  getArchetype: (type: ArchetypeType) => {
    return get().archetypes.find((a) => a.type === type);
  },

  getArchetypeGuidance: async (type: ArchetypeType) => {
    try {
      return await api.get(`/mosaic/archetype/${type}/guidance`);
    } catch (error) {
      console.error('Error loading archetype guidance:', error);
      return null;
    }
  },

  clearMosaic: () => {
    set({
      currentAssessment: null,
      archetypeMatches: [],
      ikigaiChart: null,
      gapAnalysis: [],
      cognitiveProfile: null,
      emotionalProfile: null,
      error: null,
    });
  },
}));
