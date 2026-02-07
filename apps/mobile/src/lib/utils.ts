/**
 * Calculate age from date of birth
 * @param dateOfBirth - ISO date string (YYYY-MM-DD or full ISO)
 * @returns Object with months count and formatted display string
 */
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
