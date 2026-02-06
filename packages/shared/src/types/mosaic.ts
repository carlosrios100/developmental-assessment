// Mosaic Protocol Type Definitions
// Holistic child assessment combining cognitive, emotional, and contextual factors

// ==================== COGNITIVE DOMAIN TYPES ====================

export const COGNITIVE_DOMAINS = ['math', 'logic', 'verbal', 'spatial', 'memory'] as const;
export type CognitiveDomain = typeof COGNITIVE_DOMAINS[number];

export const EMOTIONAL_DIMENSIONS = [
  'empathy', 'risk_tolerance', 'delayed_gratification',
  'cooperation', 'failure_resilience', 'emotional_regulation'
] as const;
export type EmotionalDimension = typeof EMOTIONAL_DIMENSIONS[number];

export const SCENARIO_TYPES = [
  'sharing', 'delayed_gratification', 'failure_recovery',
  'empathy_response', 'risk_assessment', 'cooperation'
] as const;
export type ScenarioType = typeof SCENARIO_TYPES[number];

export const ARCHETYPE_TYPES = [
  'diplomat', 'systems_architect', 'operator', 'caregiver', 'creator',
  'analyst', 'builder', 'explorer', 'connector', 'guardian'
] as const;
export type ArchetypeType = typeof ARCHETYPE_TYPES[number];

export const CONSENT_STATUSES = ['pending', 'granted', 'revoked', 'expired'] as const;
export type ConsentStatus = typeof CONSENT_STATUSES[number];

export const CONSENT_CATEGORIES = [
  'socioeconomic', 'location', 'family_context', 'research_aggregate', 'district_analytics'
] as const;
export type ConsentCategory = typeof CONSENT_CATEGORIES[number];

// ==================== COGNITIVE ASSESSMENT TYPES ====================

export interface CognitiveTestItem {
  id: string;
  domain: CognitiveDomain;
  difficulty: number; // IRT b parameter (-3 to +3)
  discrimination: number; // IRT a parameter (0.5 to 2.5)
  guessing: number; // IRT c parameter (0 to 0.5)
  minAgeMonths: number;
  maxAgeMonths: number;
  content: CognitiveItemContent;
  instructions?: string;
  requiresAudio: boolean;
  requiresTouch: boolean;
  tags?: string[];
  active: boolean;
}

export interface CognitiveItemContent {
  type: 'multiple_choice' | 'drag_drop' | 'sequence' | 'matching' | 'touch_count';
  prompt: string;
  promptAudio?: string;
  options?: CognitiveItemOption[];
  correctAnswer: string | string[];
  images?: { id: string; url: string; alt: string }[];
  animation?: string; // Lottie animation URL
  feedback?: {
    correct: string;
    incorrect: string;
  };
}

export interface CognitiveItemOption {
  id: string;
  label?: string;
  image?: string;
  audio?: string;
  position?: { x: number; y: number };
}

export interface CognitiveAssessment {
  id: string;
  childId: string;
  domain: CognitiveDomain;
  startedAt: Date;
  completedAt?: Date;
  abilityEstimate?: number; // Theta (-3 to +3)
  standardError?: number;
  itemsAdministered: number;
  stoppingReason?: 'min_se' | 'max_items' | 'time_limit' | 'user_stopped';
  rawScore?: number;
  percentile?: number;
  status: 'in_progress' | 'completed' | 'archived';
}

export interface CognitiveResponse {
  id: string;
  assessmentId: string;
  itemId: string;
  response: string | string[];
  isCorrect: boolean;
  reactionTimeMs?: number;
  thetaBefore: number;
  thetaAfter: number;
  seBefore: number;
  seAfter: number;
  itemSequence: number;
  createdAt: Date;
}

export interface CognitiveProfile {
  id: string;
  childId: string;
  mathScore?: number;
  mathPercentile?: number;
  logicScore?: number;
  logicPercentile?: number;
  verbalScore?: number;
  verbalPercentile?: number;
  spatialScore?: number;
  spatialPercentile?: number;
  memoryScore?: number;
  memoryPercentile?: number;
  compositeScore?: number;
  compositePercentile?: number;
  strengths: CognitiveDomain[];
  growthAreas: CognitiveDomain[];
  lastUpdatedAt: Date;
}

// ==================== BEHAVIORAL ASSESSMENT TYPES ====================

export interface BehavioralScenario {
  id: string;
  scenarioType: ScenarioType;
  title: string;
  description?: string;
  storyContent: ScenarioStoryContent;
  choices: ScenarioChoice[];
  minAgeMonths: number;
  maxAgeMonths: number;
  estimatedDurationSeconds: number;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  emotionalDimensions: EmotionalDimension[];
  assets?: ScenarioAssets;
  audioAssets?: ScenarioAudioAssets;
  active: boolean;
  version: number;
}

export interface ScenarioStoryContent {
  setting: {
    background: string;
    description: string;
  };
  characters: ScenarioCharacter[];
  narrative: ScenarioNarrativeSegment[];
}

export interface ScenarioCharacter {
  id: string;
  name: string;
  role: 'protagonist' | 'friend' | 'helper' | 'antagonist' | 'neutral';
  sprite: string;
  expressions: Record<string, string>; // emotion -> sprite URL
  voiceActor?: string;
}

export interface ScenarioNarrativeSegment {
  id: string;
  type: 'narration' | 'dialogue' | 'action' | 'choice_prompt';
  speaker?: string; // Character ID
  text: string;
  audio?: string;
  animation?: string;
  duration?: number;
  nextSegmentId?: string;
  choiceId?: string; // If type is 'choice_prompt'
}

export interface ScenarioChoice {
  id: string;
  prompt: string;
  options: ScenarioChoiceOption[];
  timeLimit?: number; // seconds
  showTimer?: boolean;
}

export interface ScenarioChoiceOption {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  dimensionScores: Partial<Record<EmotionalDimension, number>>; // -10 to +10
  nextSegmentId: string;
  feedback?: {
    immediate?: string;
    animation?: string;
  };
}

export interface ScenarioAssets {
  backgrounds: Record<string, string>;
  sprites: Record<string, string>;
  animations: Record<string, string>; // Lottie animations
  icons: Record<string, string>;
}

export interface ScenarioAudioAssets {
  music?: string;
  effects: Record<string, string>;
  voiceovers: Record<string, string>;
}

export interface BehavioralSession {
  id: string;
  childId: string;
  scenarioId: string;
  startedAt: Date;
  completedAt?: Date;
  totalDurationMs?: number;
  choicesMade: number;
  engagementScore?: number; // 0 to 1
  status: 'in_progress' | 'completed' | 'abandoned';
  deviceInfo?: {
    screenWidth: number;
    screenHeight: number;
    touchCapable: boolean;
    platform: string;
  };
}

export interface BehavioralChoice {
  id: string;
  sessionId: string;
  choiceId: string;
  choiceIndex: number;
  selectedOption: string;
  reactionTimeMs: number;
  hesitationCount: number;
  emotionalDimensions: EmotionalDimension[];
  dimensionScores: Partial<Record<EmotionalDimension, number>>;
  contextState?: Record<string, unknown>;
  createdAt: Date;
}

export interface EmotionalProfile {
  id: string;
  childId: string;
  empathyScore?: number;
  riskToleranceScore?: number;
  delayedGratificationScore?: number;
  cooperationScore?: number;
  failureResilienceScore?: number;
  emotionalRegulationScore?: number;
  compositeEqScore?: number;
  instinctIndex?: number; // Based on fast reaction times
  consistencyIndex?: number; // Consistency across scenarios
  sessionsCompleted: number;
  lastUpdatedAt: Date;
}

// ==================== CONTEXT TYPES ====================

export interface OpportunityIndex {
  id: string;
  zipCode: string;
  stateCode: string;
  city?: string;
  opportunityIndex: number; // 0 to 1
  keyIndustries: string[];
  localGrants?: LocalGrant[];
  riskFactors?: string[];
  growthTrends?: Record<string, number>; // industry -> growth rate
  schoolQualityScore?: number; // 0 to 10
  internetAccessScore?: number; // 0 to 1
  foodAccessScore?: number; // 0 to 1
  medianIncome?: number;
  educationAttainment?: Record<string, number>; // level -> percentage
  dataSource?: string;
  dataVersion?: string;
  fetchedAt: Date;
  expiresAt: Date;
}

export interface LocalGrant {
  name: string;
  description: string;
  eligibility: string;
  url?: string;
  amount?: string;
  deadline?: string;
}

export interface FamilyContext {
  id: string;
  childId: string;
  zipCode?: string;
  householdSize?: number;
  parentEducationLevel?: 'less_than_high_school' | 'high_school' | 'some_college' | 'associates' | 'bachelors' | 'masters' | 'doctorate';
  householdIncomeBracket?: 'under_25k' | '25k_50k' | '50k_75k' | '75k_100k' | '100k_150k' | '150k_200k' | 'over_200k' | 'prefer_not_say';
  singleParent?: boolean;
  languagesSpoken?: string[];
  primaryLanguage?: string;
  receivesAssistance?: boolean;
  assistanceTypes?: string[];
  childcareType?: 'parent_home' | 'relative' | 'nanny' | 'daycare' | 'preschool' | 'other';
  screenTimeHoursDaily?: number;
  outdoorTimeHoursDaily?: number;
  booksInHome?: number;
  consentVersion: number;
  encryptedFields?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContextConsent {
  id: string;
  userId: string;
  childId: string;
  category: ConsentCategory;
  status: ConsentStatus;
  grantedAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  consentText: string;
  consentVersion: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContextMultiplier {
  id: string;
  childId: string;
  opportunityIndex?: number;
  socioEconStatus?: number;
  gapScore?: number; // opportunity_index - socio_econ_status
  adversityMultiplier: number; // 1.0 to 1.5
  calculationDetails?: {
    components: Record<string, number>;
    weights: Record<string, number>;
    formula: string;
  };
  dataCompleteness: number; // 0 to 1
  calculatedAt: Date;
}

// ==================== MOSAIC OUTPUT TYPES ====================

export interface MosaicAssessment {
  id: string;
  childId: string;
  cognitiveProfileId?: string;
  emotionalProfileId?: string;
  contextMultiplierId?: string;
  rawCognitiveScore?: number;
  rawEmotionalScore?: number;
  rawCombinedScore?: number; // (cognitive * 0.4) + (emotional * 0.6)
  adversityMultiplier: number;
  truePotentialScore?: number; // raw_combined * adversity_multiplier
  truePotentialPercentile?: number;
  confidenceLevel?: number;
  primaryArchetype?: ArchetypeType;
  secondaryArchetype?: ArchetypeType;
  localViabilityScore?: number;
  calculatedAt: Date;
  version: number;
}

export interface Archetype {
  id: string;
  type: ArchetypeType;
  name: string;
  description: string;
  icon: string;
  colorPrimary: string;
  colorSecondary: string;
  traitWeights: Partial<Record<CognitiveDomain | EmotionalDimension, number>>;
  careerPathways: CareerPathway[];
  industryMatches: string[];
  strengths: string[];
  growthAreas: string[];
  famousExamples?: string[];
  affirmation: string;
  parentGuidance: string;
  active: boolean;
}

export interface CareerPathway {
  industry: string;
  roles: string[];
  growthOutlook: 'declining' | 'stable' | 'growing' | 'rapidly_growing';
}

export interface ArchetypeMatch {
  id: string;
  mosaicAssessmentId: string;
  archetypeType: ArchetypeType;
  matchScore: number; // 0 to 100
  matchRank: number; // 1 to 10
  traitBreakdown: Partial<Record<CognitiveDomain | EmotionalDimension, number>>;
  localViability: boolean;
}

export interface IkigaiChart {
  id: string;
  mosaicAssessmentId: string;
  talents: IkigaiTalent[];
  passions: IkigaiPassion[];
  worldNeeds: IkigaiWorldNeed[];
  viableCareers: IkigaiCareer[];
  ikigaiCenter?: IkigaiCenter;
  visualizationData?: IkigaiVisualization;
}

export interface IkigaiTalent {
  name: string;
  score: number;
  source: 'cognitive' | 'behavioral' | 'milestone' | 'video_analysis';
}

export interface IkigaiPassion {
  name: string;
  engagementScore: number;
  inferredFrom: string; // Which scenarios/activities showed high engagement
}

export interface IkigaiWorldNeed {
  need: string;
  localDemand: 'low' | 'medium' | 'high';
  growthTrend: number; // percentage
}

export interface IkigaiCareer {
  career: string;
  matchScore: number;
  localAvailability: 'limited' | 'moderate' | 'abundant';
  salaryRange?: { min: number; max: number };
  educationRequired?: string;
}

export interface IkigaiCenter {
  primaryPath: string;
  secondaryPaths: string[];
  description: string;
  actionableSteps: string[];
}

export interface IkigaiVisualization {
  talentCircle: { x: number; y: number; radius: number };
  passionCircle: { x: number; y: number; radius: number };
  worldNeedCircle: { x: number; y: number; radius: number };
  viableCareerCircle: { x: number; y: number; radius: number };
  intersections: Record<string, { x: number; y: number; items: string[] }>;
}

export interface MosaicGapAnalysis {
  id: string;
  mosaicAssessmentId: string;
  gapType: 'skill' | 'experience' | 'resource' | 'access';
  gapName: string;
  gapDescription?: string;
  currentLevel?: number;
  targetLevel?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  relatedArchetype?: ArchetypeType;
  matchedResources?: GapResource[];
  localPrograms?: LocalProgram[];
  estimatedEffort?: 'weeks' | 'months' | 'years';
}

export interface GapResource {
  resourceType: 'book' | 'course' | 'app' | 'activity' | 'program' | 'tool';
  name: string;
  description: string;
  url?: string;
  isLocal: boolean;
  cost?: 'free' | 'low' | 'medium' | 'high';
}

export interface LocalProgram {
  name: string;
  organization: string;
  description: string;
  eligibility?: string;
  contact?: string;
  url?: string;
}

export interface DistrictAnalytics {
  id: string;
  zipCode: string;
  stateCode: string;
  periodStart: Date;
  periodEnd: Date;
  sampleSize: number; // Must be >= 50
  ageGroup: '2-4' | '4-6' | '6-8';
  archetypeDistribution: Record<ArchetypeType, number>;
  cognitiveDomainAverages: Record<CognitiveDomain, { mean: number; stddev: number }>;
  emotionalDimensionAverages: Record<EmotionalDimension, { mean: number; stddev: number }>;
  opportunityUtilization: number;
  topGaps?: string[];
  recommendedPrograms?: LocalProgram[];
  differentialPrivacyEpsilon: number;
}

// ==================== ADVENTURE GAME TYPES ====================

export interface AdventureState {
  currentScenarioId?: string;
  currentSessionId?: string;
  currentSegmentId?: string;
  choiceHistory: BehavioralChoice[];
  characterState: Record<string, CharacterState>;
  inventory: InventoryItem[];
  score: number;
  stars: number;
  unlockedScenarios: string[];
  completedScenarios: string[];
}

export interface CharacterState {
  characterId: string;
  mood: 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral';
  position: { x: number; y: number };
  animation?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  quantity: number;
  obtainedAt: Date;
}

// ==================== PUZZLE GAME TYPES ====================

export interface PuzzleState {
  currentDomain?: CognitiveDomain;
  currentAssessmentId?: string;
  currentItemId?: string;
  itemsCompleted: number;
  correctAnswers: number;
  currentTheta: number;
  currentSE: number;
  stars: number;
  encouragementLevel: number; // 0-3, increases with correct answers
}

export interface PuzzleProgress {
  domain: CognitiveDomain;
  completed: boolean;
  score?: number;
  percentile?: number;
  starsEarned: number;
  lastAttemptAt?: Date;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface StartCognitiveAssessmentRequest {
  childId: string;
  domain: CognitiveDomain;
}

export interface SubmitCognitiveResponseRequest {
  assessmentId: string;
  itemId: string;
  response: string | string[];
  reactionTimeMs: number;
}

export interface SubmitCognitiveResponseResponse {
  isCorrect: boolean;
  newTheta: number;
  newSE: number;
  isComplete: boolean;
  nextItemId?: string;
  feedback?: {
    correct: string;
    encouragement: string;
  };
}

export interface StartBehavioralSessionRequest {
  childId: string;
  scenarioId: string;
}

export interface SubmitBehavioralChoiceRequest {
  sessionId: string;
  choiceId: string;
  selectedOption: string;
  reactionTimeMs: number;
  hesitationCount?: number;
}

export interface SaveFamilyContextRequest {
  childId: string;
  context: Partial<Omit<FamilyContext, 'id' | 'childId' | 'createdAt' | 'updatedAt'>>;
}

export interface GrantConsentRequest {
  childId: string;
  category: ConsentCategory;
  consentText: string;
}

export interface GenerateMosaicRequest {
  childId: string;
  includeContext?: boolean;
}

export interface GenerateMosaicResponse {
  mosaicAssessment: MosaicAssessment;
  archetypeMatches: ArchetypeMatch[];
  ikigaiChart: IkigaiChart;
  gapAnalysis: MosaicGapAnalysis[];
}

export interface GetDistrictAnalyticsRequest {
  zipCode: string;
  ageGroup?: '2-4' | '4-6' | '6-8';
  periodMonths?: number;
}

// ==================== CONSTANTS ====================

export const MOSAIC_WEIGHTS = {
  COGNITIVE_WEIGHT: 0.4,
  EMOTIONAL_WEIGHT: 0.6,
  MIN_ADVERSITY_MULTIPLIER: 1.0,
  MAX_ADVERSITY_MULTIPLIER: 1.5,
} as const;

export const ADAPTIVE_TESTING_CONFIG = {
  MIN_ITEMS: 10,
  MAX_ITEMS: 30,
  TARGET_SE: 0.3,
  INITIAL_THETA: 0.0,
  INITIAL_SE: 1.0,
} as const;

export const SCENARIO_ENGAGEMENT_THRESHOLDS = {
  LOW: 0.3,
  MEDIUM: 0.6,
  HIGH: 0.8,
} as const;

export const CONSENT_TEXT = {
  socioeconomic: `We would like to collect information about your family's socio-economic context to better understand and support your child's development. This data helps us:

1. Recognize resilience and potential in children facing challenges
2. Match recommendations to locally available resources
3. Identify community-level needs (only with aggregated, anonymized data)

Your data is encrypted and never shared in identifiable form. You can withdraw consent at any time.`,

  location: `We would like to use your location (zip code) to:

1. Find local programs, grants, and resources for your child
2. Match career pathways to local job market opportunities
3. Contribute to anonymized community insights (with separate consent)

We never track precise location. Only zip code is stored.`,

  family_context: `We would like to collect optional family context information to:

1. Adjust expectations based on environmental factors
2. Recognize achievements in context (the "true potential" score)
3. Provide culturally and economically relevant recommendations

All fields are optional. Data is encrypted and you can delete it anytime.`,

  research_aggregate: `We would like to include your child's anonymized data in aggregate research to:

1. Improve our assessment algorithms
2. Identify developmental patterns across populations
3. Publish findings that help all children

No individual data is ever identifiable. Minimum sample sizes (50+) are required for any reporting.`,

  district_analytics: `We would like to include your child's anonymized data in district-level analytics to:

1. Help city planners understand community needs
2. Inform resource allocation for early childhood programs
3. Identify gaps in local services

Data is anonymized using differential privacy techniques. No individual child can ever be identified.`,
} as const;
