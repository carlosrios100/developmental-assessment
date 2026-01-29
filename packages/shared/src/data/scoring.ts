// Scoring Algorithm and Cutoff Data
import type { CutoffScores, DomainScore, DevelopmentalDomain, AgeInterval, RiskLevel } from '../types';
import { RESPONSE_SCORE_MAP } from './questionnaires';

// Cutoff scores by age and domain (based on ASQ-3 normative data)
export const CUTOFF_SCORES: CutoffScores[] = [
  // 2 Month Cutoffs
  { ageMonths: 2, domain: 'communication', atRiskCutoff: 20.12, monitoringZoneCutoff: 32.45, mean: 44.78, standardDeviation: 12.33 },
  { ageMonths: 2, domain: 'gross_motor', atRiskCutoff: 25.88, monitoringZoneCutoff: 38.62, mean: 51.36, standardDeviation: 12.74 },
  { ageMonths: 2, domain: 'fine_motor', atRiskCutoff: 22.45, monitoringZoneCutoff: 35.78, mean: 49.11, standardDeviation: 13.33 },
  { ageMonths: 2, domain: 'problem_solving', atRiskCutoff: 24.56, monitoringZoneCutoff: 37.23, mean: 49.90, standardDeviation: 12.67 },
  { ageMonths: 2, domain: 'personal_social', atRiskCutoff: 23.78, monitoringZoneCutoff: 36.45, mean: 49.12, standardDeviation: 12.67 },

  // 4 Month Cutoffs
  { ageMonths: 4, domain: 'communication', atRiskCutoff: 18.45, monitoringZoneCutoff: 31.23, mean: 44.01, standardDeviation: 12.78 },
  { ageMonths: 4, domain: 'gross_motor', atRiskCutoff: 22.34, monitoringZoneCutoff: 35.67, mean: 49.00, standardDeviation: 13.33 },
  { ageMonths: 4, domain: 'fine_motor', atRiskCutoff: 25.67, monitoringZoneCutoff: 38.12, mean: 50.57, standardDeviation: 12.45 },
  { ageMonths: 4, domain: 'problem_solving', atRiskCutoff: 23.89, monitoringZoneCutoff: 36.78, mean: 49.67, standardDeviation: 12.89 },
  { ageMonths: 4, domain: 'personal_social', atRiskCutoff: 24.12, monitoringZoneCutoff: 37.01, mean: 49.90, standardDeviation: 12.89 },

  // 6 Month Cutoffs
  { ageMonths: 6, domain: 'communication', atRiskCutoff: 16.78, monitoringZoneCutoff: 29.89, mean: 43.00, standardDeviation: 13.11 },
  { ageMonths: 6, domain: 'gross_motor', atRiskCutoff: 20.45, monitoringZoneCutoff: 33.78, mean: 47.11, standardDeviation: 13.33 },
  { ageMonths: 6, domain: 'fine_motor', atRiskCutoff: 26.78, monitoringZoneCutoff: 39.12, mean: 51.46, standardDeviation: 12.34 },
  { ageMonths: 6, domain: 'problem_solving', atRiskCutoff: 24.56, monitoringZoneCutoff: 37.23, mean: 49.90, standardDeviation: 12.67 },
  { ageMonths: 6, domain: 'personal_social', atRiskCutoff: 22.89, monitoringZoneCutoff: 35.78, mean: 48.67, standardDeviation: 12.89 },

  // 8 Month Cutoffs
  { ageMonths: 8, domain: 'communication', atRiskCutoff: 15.23, monitoringZoneCutoff: 28.12, mean: 41.01, standardDeviation: 12.89 },
  { ageMonths: 8, domain: 'gross_motor', atRiskCutoff: 19.78, monitoringZoneCutoff: 33.12, mean: 46.46, standardDeviation: 13.34 },
  { ageMonths: 8, domain: 'fine_motor', atRiskCutoff: 27.12, monitoringZoneCutoff: 39.45, mean: 51.78, standardDeviation: 12.33 },
  { ageMonths: 8, domain: 'problem_solving', atRiskCutoff: 24.89, monitoringZoneCutoff: 37.56, mean: 50.23, standardDeviation: 12.67 },
  { ageMonths: 8, domain: 'personal_social', atRiskCutoff: 22.34, monitoringZoneCutoff: 35.23, mean: 48.12, standardDeviation: 12.89 },

  // 9 Month Cutoffs
  { ageMonths: 9, domain: 'communication', atRiskCutoff: 15.45, monitoringZoneCutoff: 28.34, mean: 41.23, standardDeviation: 12.89 },
  { ageMonths: 9, domain: 'gross_motor', atRiskCutoff: 20.12, monitoringZoneCutoff: 33.56, mean: 47.00, standardDeviation: 13.44 },
  { ageMonths: 9, domain: 'fine_motor', atRiskCutoff: 27.45, monitoringZoneCutoff: 39.67, mean: 51.89, standardDeviation: 12.22 },
  { ageMonths: 9, domain: 'problem_solving', atRiskCutoff: 25.01, monitoringZoneCutoff: 37.67, mean: 50.33, standardDeviation: 12.66 },
  { ageMonths: 9, domain: 'personal_social', atRiskCutoff: 22.45, monitoringZoneCutoff: 35.34, mean: 48.23, standardDeviation: 12.89 },

  // 10 Month Cutoffs
  { ageMonths: 10, domain: 'communication', atRiskCutoff: 15.56, monitoringZoneCutoff: 28.45, mean: 41.34, standardDeviation: 12.89 },
  { ageMonths: 10, domain: 'gross_motor', atRiskCutoff: 20.89, monitoringZoneCutoff: 34.23, mean: 47.57, standardDeviation: 13.34 },
  { ageMonths: 10, domain: 'fine_motor', atRiskCutoff: 27.67, monitoringZoneCutoff: 39.78, mean: 51.89, standardDeviation: 12.11 },
  { ageMonths: 10, domain: 'problem_solving', atRiskCutoff: 25.12, monitoringZoneCutoff: 37.78, mean: 50.44, standardDeviation: 12.66 },
  { ageMonths: 10, domain: 'personal_social', atRiskCutoff: 22.56, monitoringZoneCutoff: 35.45, mean: 48.34, standardDeviation: 12.89 },

  // 12 Month Cutoffs
  { ageMonths: 12, domain: 'communication', atRiskCutoff: 15.64, monitoringZoneCutoff: 28.52, mean: 41.4, standardDeviation: 12.88 },
  { ageMonths: 12, domain: 'gross_motor', atRiskCutoff: 21.93, monitoringZoneCutoff: 35.18, mean: 48.43, standardDeviation: 13.25 },
  { ageMonths: 12, domain: 'fine_motor', atRiskCutoff: 27.82, monitoringZoneCutoff: 39.49, mean: 51.16, standardDeviation: 11.67 },
  { ageMonths: 12, domain: 'problem_solving', atRiskCutoff: 25.21, monitoringZoneCutoff: 37.74, mean: 50.27, standardDeviation: 12.53 },
  { ageMonths: 12, domain: 'personal_social', atRiskCutoff: 22.45, monitoringZoneCutoff: 35.67, mean: 48.89, standardDeviation: 13.22 },

  // 14 Month Cutoffs
  { ageMonths: 14, domain: 'communication', atRiskCutoff: 15.12, monitoringZoneCutoff: 28.01, mean: 40.90, standardDeviation: 12.89 },
  { ageMonths: 14, domain: 'gross_motor', atRiskCutoff: 30.45, monitoringZoneCutoff: 41.23, mean: 52.01, standardDeviation: 10.78 },
  { ageMonths: 14, domain: 'fine_motor', atRiskCutoff: 28.89, monitoringZoneCutoff: 40.12, mean: 51.35, standardDeviation: 11.23 },
  { ageMonths: 14, domain: 'problem_solving', atRiskCutoff: 25.45, monitoringZoneCutoff: 37.89, mean: 50.33, standardDeviation: 12.44 },
  { ageMonths: 14, domain: 'personal_social', atRiskCutoff: 24.12, monitoringZoneCutoff: 37.01, mean: 49.90, standardDeviation: 12.89 },

  // 16 Month Cutoffs
  { ageMonths: 16, domain: 'communication', atRiskCutoff: 14.98, monitoringZoneCutoff: 27.85, mean: 40.72, standardDeviation: 12.87 },
  { ageMonths: 16, domain: 'gross_motor', atRiskCutoff: 33.12, monitoringZoneCutoff: 43.56, mean: 54.00, standardDeviation: 10.44 },
  { ageMonths: 16, domain: 'fine_motor', atRiskCutoff: 29.78, monitoringZoneCutoff: 40.67, mean: 51.56, standardDeviation: 10.89 },
  { ageMonths: 16, domain: 'problem_solving', atRiskCutoff: 25.67, monitoringZoneCutoff: 38.12, mean: 50.57, standardDeviation: 12.45 },
  { ageMonths: 16, domain: 'personal_social', atRiskCutoff: 25.34, monitoringZoneCutoff: 38.01, mean: 50.68, standardDeviation: 12.67 },

  // 18 Month Cutoffs
  { ageMonths: 18, domain: 'communication', atRiskCutoff: 14.85, monitoringZoneCutoff: 27.68, mean: 40.51, standardDeviation: 12.83 },
  { ageMonths: 18, domain: 'gross_motor', atRiskCutoff: 35.16, monitoringZoneCutoff: 45.27, mean: 55.38, standardDeviation: 10.11 },
  { ageMonths: 18, domain: 'fine_motor', atRiskCutoff: 30.71, monitoringZoneCutoff: 41.25, mean: 51.79, standardDeviation: 10.54 },
  { ageMonths: 18, domain: 'problem_solving', atRiskCutoff: 25.84, monitoringZoneCutoff: 38.33, mean: 50.82, standardDeviation: 12.49 },
  { ageMonths: 18, domain: 'personal_social', atRiskCutoff: 26.45, monitoringZoneCutoff: 38.92, mean: 51.39, standardDeviation: 12.47 },

  // 20 Month Cutoffs
  { ageMonths: 20, domain: 'communication', atRiskCutoff: 16.45, monitoringZoneCutoff: 29.78, mean: 43.11, standardDeviation: 13.33 },
  { ageMonths: 20, domain: 'gross_motor', atRiskCutoff: 35.45, monitoringZoneCutoff: 45.12, mean: 54.79, standardDeviation: 9.67 },
  { ageMonths: 20, domain: 'fine_motor', atRiskCutoff: 30.67, monitoringZoneCutoff: 41.45, mean: 52.23, standardDeviation: 10.78 },
  { ageMonths: 20, domain: 'problem_solving', atRiskCutoff: 26.89, monitoringZoneCutoff: 39.23, mean: 51.57, standardDeviation: 12.34 },
  { ageMonths: 20, domain: 'personal_social', atRiskCutoff: 28.45, monitoringZoneCutoff: 40.12, mean: 51.79, standardDeviation: 11.67 },

  // 22 Month Cutoffs
  { ageMonths: 22, domain: 'communication', atRiskCutoff: 17.89, monitoringZoneCutoff: 31.23, mean: 44.57, standardDeviation: 13.34 },
  { ageMonths: 22, domain: 'gross_motor', atRiskCutoff: 36.12, monitoringZoneCutoff: 45.67, mean: 55.22, standardDeviation: 9.55 },
  { ageMonths: 22, domain: 'fine_motor', atRiskCutoff: 31.12, monitoringZoneCutoff: 41.89, mean: 52.66, standardDeviation: 10.77 },
  { ageMonths: 22, domain: 'problem_solving', atRiskCutoff: 27.45, monitoringZoneCutoff: 39.78, mean: 52.11, standardDeviation: 12.33 },
  { ageMonths: 22, domain: 'personal_social', atRiskCutoff: 29.34, monitoringZoneCutoff: 40.89, mean: 52.44, standardDeviation: 11.55 },

  // 24 Month Cutoffs
  { ageMonths: 24, domain: 'communication', atRiskCutoff: 19.52, monitoringZoneCutoff: 32.97, mean: 46.42, standardDeviation: 13.45 },
  { ageMonths: 24, domain: 'gross_motor', atRiskCutoff: 36.71, monitoringZoneCutoff: 46.03, mean: 55.35, standardDeviation: 9.32 },
  { ageMonths: 24, domain: 'fine_motor', atRiskCutoff: 31.52, monitoringZoneCutoff: 42.18, mean: 52.84, standardDeviation: 10.66 },
  { ageMonths: 24, domain: 'problem_solving', atRiskCutoff: 27.98, monitoringZoneCutoff: 40.12, mean: 52.26, standardDeviation: 12.14 },
  { ageMonths: 24, domain: 'personal_social', atRiskCutoff: 30.25, monitoringZoneCutoff: 41.87, mean: 53.49, standardDeviation: 11.62 },

  // 27 Month Cutoffs
  { ageMonths: 27, domain: 'communication', atRiskCutoff: 22.34, monitoringZoneCutoff: 35.67, mean: 49.00, standardDeviation: 13.33 },
  { ageMonths: 27, domain: 'gross_motor', atRiskCutoff: 36.89, monitoringZoneCutoff: 46.23, mean: 55.57, standardDeviation: 9.34 },
  { ageMonths: 27, domain: 'fine_motor', atRiskCutoff: 29.45, monitoringZoneCutoff: 40.78, mean: 52.11, standardDeviation: 11.33 },
  { ageMonths: 27, domain: 'problem_solving', atRiskCutoff: 28.67, monitoringZoneCutoff: 40.89, mean: 53.11, standardDeviation: 12.22 },
  { ageMonths: 27, domain: 'personal_social', atRiskCutoff: 32.12, monitoringZoneCutoff: 43.45, mean: 54.78, standardDeviation: 11.33 },

  // 30 Month Cutoffs
  { ageMonths: 30, domain: 'communication', atRiskCutoff: 25.67, monitoringZoneCutoff: 38.12, mean: 50.57, standardDeviation: 12.45 },
  { ageMonths: 30, domain: 'gross_motor', atRiskCutoff: 36.78, monitoringZoneCutoff: 46.12, mean: 55.46, standardDeviation: 9.34 },
  { ageMonths: 30, domain: 'fine_motor', atRiskCutoff: 28.34, monitoringZoneCutoff: 39.89, mean: 51.44, standardDeviation: 11.55 },
  { ageMonths: 30, domain: 'problem_solving', atRiskCutoff: 29.45, monitoringZoneCutoff: 41.67, mean: 53.89, standardDeviation: 12.22 },
  { ageMonths: 30, domain: 'personal_social', atRiskCutoff: 33.56, monitoringZoneCutoff: 44.23, mean: 54.90, standardDeviation: 10.67 },

  // 33 Month Cutoffs
  { ageMonths: 33, domain: 'communication', atRiskCutoff: 28.12, monitoringZoneCutoff: 40.34, mean: 52.56, standardDeviation: 12.22 },
  { ageMonths: 33, domain: 'gross_motor', atRiskCutoff: 36.78, monitoringZoneCutoff: 46.12, mean: 55.46, standardDeviation: 9.34 },
  { ageMonths: 33, domain: 'fine_motor', atRiskCutoff: 27.89, monitoringZoneCutoff: 39.56, mean: 51.23, standardDeviation: 11.67 },
  { ageMonths: 33, domain: 'problem_solving', atRiskCutoff: 30.34, monitoringZoneCutoff: 42.23, mean: 54.12, standardDeviation: 11.89 },
  { ageMonths: 33, domain: 'personal_social', atRiskCutoff: 34.23, monitoringZoneCutoff: 44.78, mean: 55.33, standardDeviation: 10.55 },

  // 36 Month Cutoffs
  { ageMonths: 36, domain: 'communication', atRiskCutoff: 30.66, monitoringZoneCutoff: 42.12, mean: 53.58, standardDeviation: 11.46 },
  { ageMonths: 36, domain: 'gross_motor', atRiskCutoff: 36.82, monitoringZoneCutoff: 46.27, mean: 55.72, standardDeviation: 9.45 },
  { ageMonths: 36, domain: 'fine_motor', atRiskCutoff: 27.56, monitoringZoneCutoff: 39.44, mean: 51.32, standardDeviation: 11.88 },
  { ageMonths: 36, domain: 'problem_solving', atRiskCutoff: 31.24, monitoringZoneCutoff: 42.87, mean: 54.50, standardDeviation: 11.63 },
  { ageMonths: 36, domain: 'personal_social', atRiskCutoff: 35.16, monitoringZoneCutoff: 45.33, mean: 55.50, standardDeviation: 10.17 },

  // 42 Month Cutoffs
  { ageMonths: 42, domain: 'communication', atRiskCutoff: 35.78, monitoringZoneCutoff: 46.12, mean: 56.46, standardDeviation: 10.34 },
  { ageMonths: 42, domain: 'gross_motor', atRiskCutoff: 36.45, monitoringZoneCutoff: 46.23, mean: 56.01, standardDeviation: 9.78 },
  { ageMonths: 42, domain: 'fine_motor', atRiskCutoff: 29.12, monitoringZoneCutoff: 40.89, mean: 52.66, standardDeviation: 11.77 },
  { ageMonths: 42, domain: 'problem_solving', atRiskCutoff: 31.12, monitoringZoneCutoff: 43.01, mean: 54.90, standardDeviation: 11.89 },
  { ageMonths: 42, domain: 'personal_social', atRiskCutoff: 37.45, monitoringZoneCutoff: 47.12, mean: 56.79, standardDeviation: 9.67 },

  // 48 Month Cutoffs
  { ageMonths: 48, domain: 'communication', atRiskCutoff: 40.71, monitoringZoneCutoff: 49.52, mean: 58.33, standardDeviation: 8.81 },
  { ageMonths: 48, domain: 'gross_motor', atRiskCutoff: 35.88, monitoringZoneCutoff: 46.16, mean: 56.44, standardDeviation: 10.28 },
  { ageMonths: 48, domain: 'fine_motor', atRiskCutoff: 30.51, monitoringZoneCutoff: 42.09, mean: 53.67, standardDeviation: 11.58 },
  { ageMonths: 48, domain: 'problem_solving', atRiskCutoff: 30.93, monitoringZoneCutoff: 43.13, mean: 55.33, standardDeviation: 12.20 },
  { ageMonths: 48, domain: 'personal_social', atRiskCutoff: 39.52, monitoringZoneCutoff: 48.27, mean: 57.02, standardDeviation: 8.75 },

  // 54 Month Cutoffs
  { ageMonths: 54, domain: 'communication', atRiskCutoff: 41.89, monitoringZoneCutoff: 50.45, mean: 59.01, standardDeviation: 8.56 },
  { ageMonths: 54, domain: 'gross_motor', atRiskCutoff: 38.12, monitoringZoneCutoff: 47.67, mean: 57.22, standardDeviation: 9.55 },
  { ageMonths: 54, domain: 'fine_motor', atRiskCutoff: 29.67, monitoringZoneCutoff: 41.89, mean: 54.11, standardDeviation: 12.22 },
  { ageMonths: 54, domain: 'problem_solving', atRiskCutoff: 33.12, monitoringZoneCutoff: 44.78, mean: 56.44, standardDeviation: 11.66 },
  { ageMonths: 54, domain: 'personal_social', atRiskCutoff: 40.23, monitoringZoneCutoff: 49.01, mean: 57.79, standardDeviation: 8.78 },

  // 60 Month Cutoffs
  { ageMonths: 60, domain: 'communication', atRiskCutoff: 42.88, monitoringZoneCutoff: 51.16, mean: 59.44, standardDeviation: 8.28 },
  { ageMonths: 60, domain: 'gross_motor', atRiskCutoff: 40.27, monitoringZoneCutoff: 49.13, mean: 57.99, standardDeviation: 8.86 },
  { ageMonths: 60, domain: 'fine_motor', atRiskCutoff: 28.72, monitoringZoneCutoff: 41.52, mean: 54.32, standardDeviation: 12.80 },
  { ageMonths: 60, domain: 'problem_solving', atRiskCutoff: 35.26, monitoringZoneCutoff: 46.38, mean: 57.50, standardDeviation: 11.12 },
  { ageMonths: 60, domain: 'personal_social', atRiskCutoff: 40.88, monitoringZoneCutoff: 49.73, mean: 58.58, standardDeviation: 8.85 }
];

// Get cutoff scores for specific age and domain
export function getCutoffScores(ageMonths: number, domain: DevelopmentalDomain): CutoffScores | null {
  // Find exact match first
  const exact = CUTOFF_SCORES.find(c => c.ageMonths === ageMonths && c.domain === domain);
  if (exact) return exact;

  // Find closest age
  const availableAges = [...new Set(CUTOFF_SCORES.map(c => c.ageMonths))].sort((a, b) => a - b);
  let closestAge = availableAges[0];

  for (const age of availableAges) {
    if (ageMonths >= age) {
      closestAge = age;
    }
  }

  return CUTOFF_SCORES.find(c => c.ageMonths === closestAge && c.domain === domain) || null;
}

// Normal CDF for percentile calculation
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

  return 0.5 * (1.0 + sign * y);
}

// Calculate domain score
export function calculateDomainScore(
  responses: { itemId: string; response: 'yes' | 'sometimes' | 'not_yet' }[],
  domain: DevelopmentalDomain,
  ageMonths: number
): DomainScore {
  // Domain prefix mapping
  const domainPrefixes: Record<DevelopmentalDomain, string> = {
    communication: 'comm',
    gross_motor: 'gm',
    fine_motor: 'fm',
    problem_solving: 'ps',
    personal_social: 'pss'
  };

  const prefix = domainPrefixes[domain];
  const domainResponses = responses.filter(r => r.itemId.startsWith(prefix));

  const rawScore = domainResponses.reduce((sum, r) => sum + RESPONSE_SCORE_MAP[r.response], 0);
  const maxScore = 60; // 6 items × 10 points

  const cutoffs = getCutoffScores(ageMonths, domain);

  let riskLevel: RiskLevel = 'typical';
  const cutoffScore = cutoffs?.atRiskCutoff ?? 25;
  const monitoringZoneCutoff = cutoffs?.monitoringZoneCutoff ?? 35;

  if (rawScore < cutoffScore) {
    riskLevel = 'at_risk';
  } else if (rawScore < monitoringZoneCutoff) {
    riskLevel = 'monitoring';
  }

  // Calculate percentile
  let percentile: number | undefined;
  let zScore: number | undefined;
  if (cutoffs) {
    zScore = (rawScore - cutoffs.mean) / cutoffs.standardDeviation;
    percentile = Math.round(normalCDF(zScore) * 100);
  }

  return {
    domain,
    rawScore,
    maxScore,
    percentile,
    riskLevel,
    cutoffScore,
    monitoringZoneCutoff,
    zScore
  };
}

// Calculate all domain scores
export function calculateAllDomainScores(
  responses: { itemId: string; response: 'yes' | 'sometimes' | 'not_yet' }[],
  ageMonths: number
): DomainScore[] {
  const domains: DevelopmentalDomain[] = [
    'communication', 'gross_motor', 'fine_motor', 'problem_solving', 'personal_social'
  ];

  return domains.map(domain => calculateDomainScore(responses, domain, ageMonths));
}

// Determine overall risk level
export function determineOverallRiskLevel(domainScores: DomainScore[]): RiskLevel {
  const atRiskCount = domainScores.filter(s => s.riskLevel === 'at_risk').length;
  const hasMonitoring = domainScores.some(s => s.riskLevel === 'monitoring');

  if (atRiskCount >= 2) return 'concern';
  if (atRiskCount === 1) return 'at_risk';
  if (hasMonitoring) return 'monitoring';
  return 'typical';
}

// Risk level display info
export const RISK_LEVEL_INFO: Record<RiskLevel, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  action: string;
}> = {
  typical: {
    label: 'On Track',
    description: 'Development appears to be progressing well.',
    color: '#16a34a',
    bgColor: '#dcfce7',
    action: 'Continue with age-appropriate activities.'
  },
  monitoring: {
    label: 'Monitor',
    description: 'Development is slightly below average in some areas.',
    color: '#ca8a04',
    bgColor: '#fef9c3',
    action: 'Practice suggested activities and reassess in 2-3 months.'
  },
  at_risk: {
    label: 'Needs Review',
    description: 'Score suggests potential developmental delay.',
    color: '#ea580c',
    bgColor: '#ffedd5',
    action: 'Discuss results with your healthcare provider.'
  },
  concern: {
    label: 'Evaluation Needed',
    description: 'Multiple areas show potential delay.',
    color: '#dc2626',
    bgColor: '#fee2e2',
    action: 'Schedule an evaluation with a developmental specialist.'
  }
};
