// @devassess/shared - Main Entry Point
// Shared types, data, and utilities for the Developmental Assessment app

export * from './types';
export * from './data';
export * from './utils';

// App configuration
export const APP_CONFIG = {
  name: 'Developmental Assessment',
  version: '1.0.0',
  description: 'ASQ-3 based developmental screening with AI video analysis',

  assessment: {
    questionsPerDomain: 6,
    domainsPerAssessment: 5,
    totalQuestionsPerAssessment: 30,
    maxScorePerDomain: 60
  },

  video: {
    maxDurationSeconds: 600,
    minDurationSeconds: 60,
    recommendedDurationSeconds: 180,
    supportedFormats: ['mp4', 'mov', 'avi', 'webm'],
    maxFileSizeMB: 500
  },

  screeningIntervals: [9, 18, 24, 30, 48] as const, // AAP recommended
  autismScreeningAges: [18, 24] as const
} as const;
