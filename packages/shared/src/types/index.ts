// Core Type Definitions for Developmental Assessment
// Based on ASQ-3 methodology with AI video analysis enhancements

// ==================== AGE & DOMAIN TYPES ====================

export const AGE_INTERVALS = [2, 4, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 27, 30, 33, 36, 42, 48, 54, 60] as const;
export type AgeInterval = typeof AGE_INTERVALS[number];

export const DEVELOPMENTAL_DOMAINS = ['communication', 'gross_motor', 'fine_motor', 'problem_solving', 'personal_social'] as const;
export type DevelopmentalDomain = typeof DEVELOPMENTAL_DOMAINS[number];

export const RESPONSE_VALUES = ['yes', 'sometimes', 'not_yet'] as const;
export type ResponseValue = typeof RESPONSE_VALUES[number];

export const RISK_LEVELS = ['typical', 'monitoring', 'at_risk', 'concern'] as const;
export type RiskLevel = typeof RISK_LEVELS[number];

export const VIDEO_BEHAVIORS = [
  'eye_contact', 'joint_attention', 'gesture_use', 'vocalization',
  'movement_quality', 'social_engagement', 'emotional_expression',
  'motor_coordination', 'object_manipulation', 'caregiver_interaction'
] as const;
export type VideoAnalysisBehavior = typeof VIDEO_BEHAVIORS[number];

export const VIDEO_CONTEXTS = [
  'free_play', 'structured_activity', 'caregiver_interaction',
  'feeding', 'book_reading', 'physical_activity', 'peer_interaction', 'self_care_routine'
] as const;
export type VideoContext = typeof VIDEO_CONTEXTS[number];

// ==================== QUESTIONNAIRE TYPES ====================

export interface QuestionnaireItem {
  id: string;
  domain: DevelopmentalDomain;
  ageMonths: AgeInterval;
  question: string;
  description: string;
  examples: string[];
  videoAnalyzable: boolean;
  videoBehaviors?: VideoAnalysisBehavior[];
  difficultyLevel: 1 | 2 | 3 | 4 | 5 | 6;
  skillCategory: string;
}

export interface QuestionnaireResponse {
  id: string;
  assessmentId: string;
  itemId: string;
  response: ResponseValue;
  responseValue: number; // yes=10, sometimes=5, not_yet=0
  videoEvidenceIds?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== VIDEO ANALYSIS TYPES ====================

export interface VideoUpload {
  id: string;
  childId: string;
  assessmentId?: string;
  fileName: string;
  fileSize: number;
  duration: number; // seconds
  context: VideoContext;
  recordedAt: Date;
  uploadedAt: Date;
  storageUrl: string;
  thumbnailUrl?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  analysisResult?: VideoAnalysisResult;
}

export interface VideoAnalysisResult {
  id: string;
  videoId: string;
  analyzedAt: Date;
  duration: number;
  behaviors: DetectedBehavior[];
  movementMetrics: MovementMetrics;
  interactionMetrics: InteractionMetrics;
  developmentalIndicators: DevelopmentalIndicator[];
  confidence: number;
  rawData?: Record<string, unknown>;
}

export interface DetectedBehavior {
  type: VideoAnalysisBehavior;
  startTime: number;
  endTime: number;
  confidence: number;
  description: string;
  relatedMilestones: string[];
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface MovementMetrics {
  distanceTraversed: number;
  movementQuality: 'smooth' | 'jerky' | 'uncoordinated' | 'coordinated';
  postureStability: number; // 0-1
  bilateralCoordination: number; // 0-1
  crossingMidline: boolean;
  averageSpeed: number;
}

export interface InteractionMetrics {
  eyeContactDuration: number;
  eyeContactPercentage: number;
  jointAttentionEpisodes: number;
  vocalizations: number;
  vocalizationDuration: number;
  positiveAffectInstances: number;
  responsivenessToCues: number;
  turnTakingInstances: number;
  proximityToCaregiver: number;
}

export interface DevelopmentalIndicator {
  domain: DevelopmentalDomain;
  indicator: string;
  observed: boolean;
  confidence: number;
  ageExpectation: number; // months
  suggestedFollowUp?: string;
}

// ==================== SCORING TYPES ====================

export interface DomainScore {
  domain: DevelopmentalDomain;
  rawScore: number;
  maxScore: number; // Always 60 (6 items × 10 points)
  percentile?: number;
  riskLevel: RiskLevel;
  cutoffScore: number;
  monitoringZoneCutoff: number;
  zScore?: number;
}

export interface CutoffScores {
  ageMonths: AgeInterval;
  domain: DevelopmentalDomain;
  atRiskCutoff: number;
  monitoringZoneCutoff: number;
  mean: number;
  standardDeviation: number;
}

// ==================== ASSESSMENT TYPES ====================

export interface Assessment {
  id: string;
  childId: string;
  ageAtAssessment: number;
  questionnaireVersion: AgeInterval;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  completedBy: 'parent' | 'caregiver' | 'professional';
  completedByUserId: string;
  startedAt: Date;
  completedAt?: Date;
  domainScores?: DomainScore[];
  overallRiskLevel?: RiskLevel;
  videoIds?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentWithResponses extends Assessment {
  responses: QuestionnaireResponse[];
  videos?: VideoUpload[];
}

// ==================== RECOMMENDATION TYPES ====================

export interface Recommendation {
  id: string;
  assessmentId: string;
  priority: 'high' | 'medium' | 'low';
  domain: DevelopmentalDomain;
  type: 'activity' | 'referral' | 'monitoring' | 'reassessment';
  title: string;
  description: string;
  activities?: DevelopmentalActivity[];
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
}

export interface DevelopmentalActivity {
  id: string;
  title: string;
  description: string;
  domain: DevelopmentalDomain;
  ageRangeMonths: { min: number; max: number };
  materialsNeeded: string[];
  duration: string;
  frequency: string;
  instructions: string[];
  videoExampleUrl?: string;
  tips?: string[];
}

// ==================== MILESTONE TYPES ====================

export interface Milestone {
  id: string;
  domain: DevelopmentalDomain;
  ageMonths: number;
  description: string;
  detailedDescription: string;
  percentileAchieved: number;
  videoIndicators: string[];
  relatedQuestionItems: string[];
  isRedFlag: boolean;
}

export interface MilestoneProgress {
  milestoneId: string;
  childId: string;
  status: 'not_started' | 'emerging' | 'achieved';
  firstObservedAt?: Date;
  achievedAt?: Date;
  videoEvidenceIds?: string[];
  notes?: string;
}

// ==================== CHILD PROFILE TYPES ====================

export interface Child {
  id: string;
  parentUserId: string;
  firstName: string;
  lastName?: string;
  dateOfBirth: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  prematureWeeks?: number;
  photoUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChildWithAssessments extends Child {
  assessments: Assessment[];
  videos?: VideoUpload[];
  milestoneProgress?: MilestoneProgress[];
}

// ==================== USER TYPES ====================

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'parent' | 'caregiver' | 'professional' | 'admin';
  profilePhotoUrl?: string;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  notifications: {
    assessmentReminders: boolean;
    milestoneAlerts: boolean;
    weeklyProgress: boolean;
  };
  privacy: {
    shareWithProfessionals: boolean;
    allowAnonymousResearch: boolean;
  };
  language: string;
  timezone: string;
}

// ==================== REPORT TYPES ====================

export type ReportType = 'parent_summary' | 'professional_detailed' | 'referral' | 'progress_comparison' | 'video_analysis';
export type ReportFormat = 'pdf' | 'html' | 'json';

export interface Report {
  id: string;
  assessmentId: string;
  childId: string;
  type: ReportType;
  format: ReportFormat;
  generatedAt: Date;
  storageUrl?: string;
  content?: ReportContent;
  expiresAt?: Date;
}

export interface ReportContent {
  title: string;
  sections: ReportSection[];
  generatedBy: string;
  disclaimer: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  charts?: ChartConfig[];
  tables?: TableConfig[];
  highlight?: boolean;
  order: number;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'radar' | 'gauge' | 'pie';
  title: string;
  data: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export interface TableConfig {
  headers: string[];
  rows: string[][];
  highlightRows?: number[];
  caption?: string;
}

// ==================== LONGITUDINAL TYPES ====================

export interface LongitudinalTrend {
  childId: string;
  domain: DevelopmentalDomain;
  metric: string;
  trend: 'improving' | 'stable' | 'declining';
  dataPoints: TrendDataPoint[];
  significance: number;
  calculatedAt: Date;
}

export interface TrendDataPoint {
  date: Date;
  value: number;
  assessmentId?: string;
  videoId?: string;
}

// ==================== API TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================== VIDEO PROCESSING API TYPES ====================

export interface VideoProcessingRequest {
  videoId: string;
  videoUrl: string;
  childAgeMonths: number;
  analysisTypes: VideoAnalysisBehavior[];
  priority?: 'low' | 'normal' | 'high';
}

export interface VideoProcessingStatus {
  videoId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface VideoProcessingResult {
  videoId: string;
  success: boolean;
  analysisResult?: VideoAnalysisResult;
  processingTimeMs: number;
  error?: string;
}
