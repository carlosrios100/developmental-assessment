// Developmental Milestones Data - CDC Based
import type { Milestone, DevelopmentalDomain } from '../types';

export const MILESTONES: Milestone[] = [
  // 2 MONTHS
  { id: 'ms_2m_comm_1', domain: 'communication', ageMonths: 2, description: 'Coos and makes gurgling sounds', detailedDescription: 'Makes vowel sounds like "ah" and "oh" when content.', percentileAchieved: 75, videoIndicators: ['Produces vowel sounds', 'Makes sounds when alert'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_2m_pss_1', domain: 'personal_social', ageMonths: 2, description: 'Calms down when spoken to or picked up', detailedDescription: 'Shows response to soothing by calming when caregiver speaks softly or holds baby.', percentileAchieved: 75, videoIndicators: ['Reduces crying when held', 'Responds to soothing voice'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_2m_pss_2', domain: 'personal_social', ageMonths: 2, description: 'Looks at your face', detailedDescription: 'Focuses eyes on caregiver face during interactions.', percentileAchieved: 75, videoIndicators: ['Direct gaze at face', 'Eye contact during feeding'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_2m_pss_3', domain: 'personal_social', ageMonths: 2, description: 'Smiles when you talk to or smile at them', detailedDescription: 'Social smile emerges - baby smiles in response to your smile or voice.', percentileAchieved: 75, videoIndicators: ['Smiles during face-to-face interaction'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_2m_gm_1', domain: 'gross_motor', ageMonths: 2, description: 'Holds head up when on tummy', detailedDescription: 'During tummy time, can briefly lift head to about 45 degrees.', percentileAchieved: 75, videoIndicators: ['Lifts head during tummy time'], relatedQuestionItems: [], isRedFlag: false },

  // 4 MONTHS
  { id: 'ms_4m_comm_1', domain: 'communication', ageMonths: 4, description: 'Coos and makes sounds when you talk to them', detailedDescription: 'Responds vocally during back-and-forth "conversation" with caregiver.', percentileAchieved: 75, videoIndicators: ['Vocal turn-taking', 'Coos in response'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_4m_pss_1', domain: 'personal_social', ageMonths: 4, description: 'Smiles on their own to get your attention', detailedDescription: 'Uses social smile spontaneously to engage others.', percentileAchieved: 75, videoIndicators: ['Initiates smile'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_4m_pss_2', domain: 'personal_social', ageMonths: 4, description: 'Chuckles when you try to make them laugh', detailedDescription: 'Laughs out loud in response to playful interactions.', percentileAchieved: 75, videoIndicators: ['Laughing during play'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_4m_gm_1', domain: 'gross_motor', ageMonths: 4, description: 'Holds head steady without support', detailedDescription: 'Good head control when held upright.', percentileAchieved: 75, videoIndicators: ['Steady head when held upright'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_4m_fm_1', domain: 'fine_motor', ageMonths: 4, description: 'Brings hands to mouth', detailedDescription: 'Purposefully brings hands together and to mouth.', percentileAchieved: 75, videoIndicators: ['Hands to mouth', 'Hands together at midline'], relatedQuestionItems: [], isRedFlag: false },

  // 6 MONTHS
  { id: 'ms_6m_comm_1', domain: 'communication', ageMonths: 6, description: 'Takes turns making sounds with you', detailedDescription: 'Engages in vocal back-and-forth, waiting for pause then responding.', percentileAchieved: 75, videoIndicators: ['Vocal turn-taking'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_6m_pss_1', domain: 'personal_social', ageMonths: 6, description: 'Knows familiar people', detailedDescription: 'Shows recognition of familiar caregivers vs strangers.', percentileAchieved: 75, videoIndicators: ['Differential response to familiar people'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_6m_gm_1', domain: 'gross_motor', ageMonths: 6, description: 'Rolls from tummy to back', detailedDescription: 'Can roll over from stomach to back independently.', percentileAchieved: 75, videoIndicators: ['Complete roll tummy to back'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_6m_fm_1', domain: 'fine_motor', ageMonths: 6, description: 'Reaches to grab a toy they want', detailedDescription: 'Purposefully reaches out to grasp desired object.', percentileAchieved: 75, videoIndicators: ['Purposeful reaching'], relatedQuestionItems: [], isRedFlag: false },

  // 9 MONTHS
  { id: 'ms_9m_comm_1', domain: 'communication', ageMonths: 9, description: 'Makes different sounds like "mamamama"', detailedDescription: 'Produces varied consonant-vowel babbling.', percentileAchieved: 75, videoIndicators: ['Varied babbling'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_9m_pss_1', domain: 'personal_social', ageMonths: 9, description: 'Looks when you call their name', detailedDescription: 'Consistently responds to name by looking toward speaker.', percentileAchieved: 75, videoIndicators: ['Head turn to name'], relatedQuestionItems: ['comm_12_2'], isRedFlag: false },
  { id: 'ms_9m_gm_1', domain: 'gross_motor', ageMonths: 9, description: 'Gets to sitting position by self', detailedDescription: 'Can transition from lying to sitting without assistance.', percentileAchieved: 75, videoIndicators: ['Independent transition to sit'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_9m_ps_1', domain: 'problem_solving', ageMonths: 9, description: 'Looks for things they see you hide', detailedDescription: 'Demonstrates object permanence.', percentileAchieved: 75, videoIndicators: ['Searches under cloth'], relatedQuestionItems: ['ps_12_1', 'ps_12_2'], isRedFlag: false },

  // 12 MONTHS
  { id: 'ms_12m_comm_1', domain: 'communication', ageMonths: 12, description: 'Waves "bye-bye"', detailedDescription: 'Uses waving gesture appropriately when people leave.', percentileAchieved: 75, videoIndicators: ['Waves during goodbye'], relatedQuestionItems: ['comm_12_4'], isRedFlag: false },
  { id: 'ms_12m_comm_2', domain: 'communication', ageMonths: 12, description: 'Calls parent "mama" or "dada"', detailedDescription: 'Uses specific word to refer to parent.', percentileAchieved: 75, videoIndicators: ['Says mama/dada to correct person'], relatedQuestionItems: ['comm_12_5'], isRedFlag: false },
  { id: 'ms_12m_gm_1', domain: 'gross_motor', ageMonths: 12, description: 'Pulls up to stand', detailedDescription: 'Uses furniture to pull self to standing.', percentileAchieved: 75, videoIndicators: ['Pulls up on furniture'], relatedQuestionItems: ['gm_12_2'], isRedFlag: false },
  { id: 'ms_12m_gm_2', domain: 'gross_motor', ageMonths: 12, description: 'Walks holding on to furniture', detailedDescription: 'Cruises along furniture.', percentileAchieved: 75, videoIndicators: ['Cruising'], relatedQuestionItems: ['gm_12_4'], isRedFlag: false },
  { id: 'ms_12m_fm_1', domain: 'fine_motor', ageMonths: 12, description: 'Picks things up with pincer grasp', detailedDescription: 'Uses pincer grasp for small objects.', percentileAchieved: 75, videoIndicators: ['Pincer grasp'], relatedQuestionItems: ['fm_12_1'], isRedFlag: false },
  { id: 'ms_12m_pss_1', domain: 'personal_social', ageMonths: 12, description: 'Plays games like peek-a-boo', detailedDescription: 'Participates in simple interactive games.', percentileAchieved: 75, videoIndicators: ['Covers face for peek-a-boo'], relatedQuestionItems: ['pss_12_4'], isRedFlag: false },

  // 18 MONTHS
  { id: 'ms_18m_comm_1', domain: 'communication', ageMonths: 18, description: 'Tries to say one or two words', detailedDescription: 'Uses additional words beyond parent names.', percentileAchieved: 75, videoIndicators: ['Attempts words'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_18m_comm_2', domain: 'communication', ageMonths: 18, description: 'Points to show you something', detailedDescription: 'Uses pointing to share attention.', percentileAchieved: 75, videoIndicators: ['Points at objects'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_18m_gm_1', domain: 'gross_motor', ageMonths: 18, description: 'Walks without holding on', detailedDescription: 'Walks independently with reasonable balance.', percentileAchieved: 75, videoIndicators: ['Independent walking'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_18m_fm_1', domain: 'fine_motor', ageMonths: 18, description: 'Tries to use a spoon', detailedDescription: 'Attempts to self-feed with spoon.', percentileAchieved: 75, videoIndicators: ['Holds spoon', 'Brings spoon to mouth'], relatedQuestionItems: [], isRedFlag: false },

  // 24 MONTHS
  { id: 'ms_24m_comm_1', domain: 'communication', ageMonths: 24, description: 'Points to things in a book when asked', detailedDescription: 'Identifies pictures by pointing.', percentileAchieved: 75, videoIndicators: ['Points to named pictures'], relatedQuestionItems: ['comm_24_5'], isRedFlag: false },
  { id: 'ms_24m_comm_2', domain: 'communication', ageMonths: 24, description: 'Says at least two words together', detailedDescription: 'Combines two words to make phrases.', percentileAchieved: 75, videoIndicators: ['Two-word combinations'], relatedQuestionItems: ['comm_24_2'], isRedFlag: false },
  { id: 'ms_24m_gm_1', domain: 'gross_motor', ageMonths: 24, description: 'Kicks a ball', detailedDescription: 'Kicks ball forward in intended direction.', percentileAchieved: 75, videoIndicators: ['Forward kick'], relatedQuestionItems: ['gm_24_4'], isRedFlag: false },
  { id: 'ms_24m_gm_2', domain: 'gross_motor', ageMonths: 24, description: 'Runs', detailedDescription: 'Moves faster than walking with both feet leaving ground.', percentileAchieved: 75, videoIndicators: ['Running gait'], relatedQuestionItems: ['gm_24_2'], isRedFlag: false },
  { id: 'ms_24m_ps_1', domain: 'problem_solving', ageMonths: 24, description: 'Plays with more than one toy at a time', detailedDescription: 'Combines toys in play.', percentileAchieved: 75, videoIndicators: ['Combines objects in play'], relatedQuestionItems: ['ps_24_1'], isRedFlag: false },
  { id: 'ms_24m_pss_1', domain: 'personal_social', ageMonths: 24, description: 'Notices when others are upset', detailedDescription: 'Shows concern or attempts to comfort others.', percentileAchieved: 75, videoIndicators: ['Looks concerned', 'Offers comfort'], relatedQuestionItems: ['pss_24_6'], isRedFlag: false },

  // 36 MONTHS
  { id: 'ms_36m_comm_1', domain: 'communication', ageMonths: 36, description: 'Talks in conversation with back-and-forth exchanges', detailedDescription: 'Engages in true conversational turn-taking.', percentileAchieved: 75, videoIndicators: ['Conversational exchange'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_36m_gm_1', domain: 'gross_motor', ageMonths: 36, description: 'Pedals a tricycle', detailedDescription: 'Can pedal forward on tricycle.', percentileAchieved: 75, videoIndicators: ['Pedaling motion'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_36m_ps_1', domain: 'problem_solving', ageMonths: 36, description: 'Draws a circle when shown how', detailedDescription: 'Copies circle after demonstration.', percentileAchieved: 75, videoIndicators: ['Circular drawing'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_36m_pss_1', domain: 'personal_social', ageMonths: 36, description: 'Puts on some clothes by themselves', detailedDescription: 'Can put on simple clothing items.', percentileAchieved: 75, videoIndicators: ['Independent dressing'], relatedQuestionItems: [], isRedFlag: false },

  // 48 MONTHS
  { id: 'ms_48m_comm_1', domain: 'communication', ageMonths: 48, description: 'Says sentences with four or more words', detailedDescription: 'Uses complex sentences.', percentileAchieved: 75, videoIndicators: ['Long sentences'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_48m_gm_1', domain: 'gross_motor', ageMonths: 48, description: 'Catches a large ball most of the time', detailedDescription: 'Successfully catches ball thrown from short distance.', percentileAchieved: 75, videoIndicators: ['Ball catching'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_48m_ps_1', domain: 'problem_solving', ageMonths: 48, description: 'Names some colors', detailedDescription: 'Correctly identifies and names basic colors.', percentileAchieved: 75, videoIndicators: ['Color naming'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_48m_pss_1', domain: 'personal_social', ageMonths: 48, description: 'Plays cooperatively with other children', detailedDescription: 'Engages in true cooperative play.', percentileAchieved: 75, videoIndicators: ['Interactive play', 'Shares'], relatedQuestionItems: [], isRedFlag: false },

  // 60 MONTHS
  { id: 'ms_60m_comm_1', domain: 'communication', ageMonths: 60, description: 'Tells a story with at least two events', detailedDescription: 'Narrates stories with sequence.', percentileAchieved: 75, videoIndicators: ['Story telling'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_60m_gm_1', domain: 'gross_motor', ageMonths: 60, description: 'Hops on one foot', detailedDescription: 'Can hop forward on one foot several times.', percentileAchieved: 75, videoIndicators: ['Single foot hopping'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_60m_fm_1', domain: 'fine_motor', ageMonths: 60, description: 'Writes some letters in their name', detailedDescription: 'Can form recognizable letters.', percentileAchieved: 75, videoIndicators: ['Letter formation'], relatedQuestionItems: [], isRedFlag: false },
  { id: 'ms_60m_ps_1', domain: 'problem_solving', ageMonths: 60, description: 'Counts to 10', detailedDescription: 'Counts objects to at least 10.', percentileAchieved: 75, videoIndicators: ['Counting'], relatedQuestionItems: [], isRedFlag: false }
];

// Red flag milestones - important warnings if not met
export const RED_FLAGS = [
  { ageMonths: 2, concerns: ['Does not respond to loud sounds', 'Does not watch things as they move', 'Does not smile at people'] },
  { ageMonths: 4, concerns: ['Does not watch things as they move', 'Does not smile at people', 'Does not bring hands to mouth', 'Cannot hold head steady'] },
  { ageMonths: 6, concerns: ['Does not try to get things in reach', 'Shows no affection for caregivers', 'Does not respond to sounds', 'Does not make vowel sounds', 'Does not laugh'] },
  { ageMonths: 9, concerns: ['Does not look where you point', 'Does not recognize familiar people', 'Does not babble', 'Does not play back-and-forth games'] },
  { ageMonths: 12, concerns: ['Does not crawl', 'Cannot stand when supported', 'Does not say single words', 'Does not use gestures like waving', 'Does not point to things'] },
  { ageMonths: 18, concerns: ['Does not point to show things', 'Does not walk', 'Does not know what familiar things are for', 'Does not copy others', 'Does not have at least 6 words'] },
  { ageMonths: 24, concerns: ['Does not use two-word phrases', 'Does not know what to do with common items', 'Does not copy actions or words', 'Does not follow simple instructions', 'Loses skills they once had'] },
  { ageMonths: 36, concerns: ['Falls down a lot or has trouble with stairs', 'Drools or has very unclear speech', 'Cannot work simple toys', 'Does not speak in sentences', 'Does not play pretend', 'Does not want to play with others'] },
  { ageMonths: 48, concerns: ['Cannot jump in place', 'Has trouble scribbling', 'Shows no interest in interactive games', 'Does not respond to people outside family', 'Does not retell a favorite story'] },
  { ageMonths: 60, concerns: ['Does not show a wide range of emotions', 'Is extremely active or distractible', 'Does not respond to people', 'Cannot tell what is real vs make-believe', 'Does not draw pictures', 'Loses skills they once had'] }
];

// Helper functions
export function getMilestonesByAge(ageMonths: number): Milestone[] {
  return MILESTONES.filter(m => m.ageMonths <= ageMonths && m.ageMonths >= ageMonths - 6);
}

export function getMilestonesByDomain(domain: DevelopmentalDomain): Milestone[] {
  return MILESTONES.filter(m => m.domain === domain);
}

export function getUpcomingMilestones(ageMonths: number): Milestone[] {
  return MILESTONES.filter(m => m.ageMonths > ageMonths && m.ageMonths <= ageMonths + 6);
}

export function getRedFlagsForAge(ageMonths: number): string[] {
  const applicableFlags = RED_FLAGS.filter(rf => rf.ageMonths <= ageMonths);
  return applicableFlags.flatMap(rf => rf.concerns);
}
