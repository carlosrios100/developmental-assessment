// Utility Functions

import type { AgeInterval } from '../types';

/**
 * Calculate child's age in months from date of birth
 */
export function calculateAgeInMonths(dateOfBirth: Date): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);

  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months += today.getMonth() - birth.getMonth();

  // Adjust if we haven't reached the day of the month yet
  if (today.getDate() < birth.getDate()) {
    months--;
  }

  return Math.max(0, months);
}

/**
 * Calculate age-adjusted months for premature infants
 * Adjustment is applied up to 24 months chronological age
 */
export function calculateAdjustedAge(
  chronologicalAgeMonths: number,
  prematureWeeks: number
): number {
  if (chronologicalAgeMonths > 24 || prematureWeeks <= 0) {
    return chronologicalAgeMonths;
  }

  // Convert weeks premature to months (4.33 weeks per month)
  const adjustmentMonths = Math.round((prematureWeeks / 4.33) * 10) / 10;
  return Math.max(0, chronologicalAgeMonths - adjustmentMonths);
}

/**
 * Get the recommended questionnaire version for a child's age
 */
export function getRecommendedQuestionnaireAge(ageMonths: number): AgeInterval {
  const intervals: AgeInterval[] = [2, 4, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 27, 30, 33, 36, 42, 48, 54, 60];

  for (let i = intervals.length - 1; i >= 0; i--) {
    if (ageMonths >= intervals[i] - 1) {
      return intervals[i];
    }
  }

  return intervals[0];
}

/**
 * Format age for display
 */
export function formatAge(ageMonths: number): string {
  if (ageMonths < 12) {
    return `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
  }

  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;

  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  return `${years}y ${months}m`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(date));
}

/**
 * Check if a screening is due based on AAP recommended intervals
 */
export function isScreeningDue(
  ageMonths: number,
  lastScreeningAgeMonths: number | null
): boolean {
  const recommendedIntervals = [9, 18, 24, 30, 48]; // AAP recommended

  for (const interval of recommendedIntervals) {
    // Check if we're within ±1 month of a recommended interval
    if (ageMonths >= interval - 1 && ageMonths <= interval + 1) {
      // If no previous screening or last screening was before this interval
      if (!lastScreeningAgeMonths || lastScreeningAgeMonths < interval - 2) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Format video duration for display
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (mins === 0) {
    return `${secs}s`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Generate a unique ID
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  const id = `${timestamp}${randomPart}`;
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Check if value is defined and not null
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
