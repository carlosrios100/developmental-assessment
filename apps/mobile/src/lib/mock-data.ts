// Mock data for demo mode
export const DEMO_MODE = true;

export const mockChildren = [
  {
    id: '1',
    first_name: 'Emma',
    last_name: 'Johnson',
    date_of_birth: '2024-03-15',
    gender: 'female',
    photo_url: null,
    created_at: '2024-03-20T10:00:00Z',
  },
  {
    id: '2',
    first_name: 'Liam',
    last_name: 'Smith',
    date_of_birth: '2023-08-22',
    gender: 'male',
    photo_url: null,
    created_at: '2023-09-01T10:00:00Z',
  },
];

export const mockAssessments = [
  {
    id: '1',
    child_id: '1',
    age_at_assessment: 10,
    questionnaire_version: 10,
    status: 'completed',
    completed_at: '2026-01-15T14:30:00Z',
    overall_risk_level: 'typical',
    domain_scores: [
      { domain: 'communication', raw_score: 45, percentile: 72, risk_level: 'typical' },
      { domain: 'gross_motor', raw_score: 50, percentile: 85, risk_level: 'typical' },
      { domain: 'fine_motor', raw_score: 40, percentile: 55, risk_level: 'typical' },
      { domain: 'problem_solving', raw_score: 48, percentile: 78, risk_level: 'typical' },
      { domain: 'personal_social', raw_score: 42, percentile: 62, risk_level: 'typical' },
    ],
  },
  {
    id: '2',
    child_id: '2',
    age_at_assessment: 16,
    questionnaire_version: 16,
    status: 'completed',
    completed_at: '2026-01-10T09:15:00Z',
    overall_risk_level: 'monitoring',
    domain_scores: [
      { domain: 'communication', raw_score: 35, percentile: 45, risk_level: 'monitoring' },
      { domain: 'gross_motor', raw_score: 52, percentile: 88, risk_level: 'typical' },
      { domain: 'fine_motor', raw_score: 38, percentile: 48, risk_level: 'typical' },
      { domain: 'problem_solving', raw_score: 30, percentile: 32, risk_level: 'monitoring' },
      { domain: 'personal_social', raw_score: 45, percentile: 70, risk_level: 'typical' },
    ],
  },
];

export const mockVideos = [
  {
    id: '1',
    child_id: '1',
    file_name: 'emma_playing.mp4',
    duration: 45,
    context: 'free_play',
    processing_status: 'completed',
    recorded_at: '2026-01-14T15:00:00Z',
  },
  {
    id: '2',
    child_id: '2',
    file_name: 'liam_crawling.mp4',
    duration: 30,
    context: 'structured_activity',
    processing_status: 'completed',
    recorded_at: '2026-01-09T11:30:00Z',
  },
];

export function calculateAge(dateOfBirth: string): { months: number; display: string } {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());

  if (months < 24) {
    return { months, display: `${months} months` };
  } else {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return {
      months,
      display: remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`
    };
  }
}
