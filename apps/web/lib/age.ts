export function ageInMonths(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  return (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
}

export function eligibleFromDate(dateOfBirth: string, minimumAgeMonths: number): Date {
  const dob = new Date(dateOfBirth);
  return new Date(dob.getFullYear(), dob.getMonth() + minimumAgeMonths, dob.getDate());
}

export function monthsUntilEligible(dateOfBirth: string, minimumAgeMonths: number): number {
  const eligible = eligibleFromDate(dateOfBirth, minimumAgeMonths);
  const now = new Date();
  return (eligible.getFullYear() - now.getFullYear()) * 12 + (eligible.getMonth() - now.getMonth());
}

export function formatAge(dateOfBirth: string): string {
  const months = ageInMonths(dateOfBirth);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths}mo`;
  if (remainingMonths === 0) return `${years}y`;
  return `${years}y ${remainingMonths}mo`;
}
