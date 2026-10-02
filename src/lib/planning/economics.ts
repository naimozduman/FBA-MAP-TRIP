import type { Economics } from "@/lib/model";
export function evaluateEconomics(input: Economics, personHours: number[] | null, roadMeters: number | null = null) {
  const costs=input.costs.map(c=>({...c,cents:c.pricing==='per_mile'?(roadMeters!==null&&c.centsPerMile!==null?Math.round(roadMeters/1609.344*c.centsPerMile):null):c.cents}));
  const errors: string[] = [];
  if (input.costs.some(c => c.basis === "fuel" && input.costs.some(m => m.basis === "mileage_inclusive" && (m.vehicleId || "shared") === (c.vehicleId || "shared")))) errors.push("Choose fuel or inclusive mileage; do not charge both for the same shared vehicle.");
  if (!input.contributionBasis.trim()) errors.push("Define which acquisition, fees, prep and freight costs the book contribution already includes.");
  const known = input.usableBooks !== null && input.contributionPerBookCents !== null && costs.length > 0 && costs.every(c => c.cents !== null) && errors.length === 0;
  const bookContributionCents = input.usableBooks !== null && input.contributionPerBookCents !== null && input.contributionBasis.trim() ? input.usableBooks * input.contributionPerBookCents : null;
  const tripCostsCents = costs.length && costs.every(c => c.cents !== null) ? costs.reduce((sum, c) => sum + c.cents!, 0) : null;
  const contributionCents = known && bookContributionCents !== null && tripCostsCents !== null ? bookContributionCents - tripCostsCents : null;
  const totalPersonHours = personHours && personHours.every(h => h > 0 && Number.isFinite(h)) ? personHours.reduce((s, h) => s + h, 0) : null;
  return { errors, bookContributionCents, tripCostsCents, contributionCents, totalPersonHours, perPersonHourCents: contributionCents !== null && totalPersonHours ? contributionCents / totalPersonHours : null };
}
export function breakEvenBooks(incrementalCents: number | null, perBookCents: number | null): number | null {
  return incrementalCents !== null && incrementalCents >= 0 && perBookCents !== null && perBookCents > 0 ? Math.ceil(incrementalCents / perBookCents) : null;
}
