import dataset from "./implementation-dataset.json";
import reconciliation from "./legacy-id-reconciliation.json";
import { corridors } from "./data";
import type { Source, Visit, Trip } from "./types";
export const sourcingBrief = dataset;
export const legacyIds = reconciliation.id_mapping;
export function cityBrief(id: string) {
  return corridors.filter(route => route.cities.includes(id)).map(route => ({
    original: route,
    brief: dataset.corridors.find(item => item.number === route.id)!,
  }));
}
export function sourceExclusion(source: Source) {
  if (source.exclusionOverrideReason?.trim()) return null;
  if (/half\s*price\s*books/i.test(source.name)) return "Half Price Books is excluded by default";
  if (/goodwill/i.test(source.name) && source.type !== "Goodwill outlet" && !/outlet/i.test(source.name)) return "Regular Goodwill retail is excluded by default";
  return null;
}
export function observationSummary(visits: Visit[]) {
  const books = visits.reduce((sum, visit) => sum + visit.books, 0);
  const hours = visits.reduce((sum, visit) => sum + visit.hours, 0);
  const spend = visits.reduce((sum, visit) => sum + Math.round(visit.spend * 100), 0) / 100;
  const counted = visits.filter(visit => visit.scanned !== null);
  const scanned = counted.reduce((sum, visit) => sum + visit.scanned!, 0);
  const scored = visits.filter(visit => visit.competition !== null);
  return {
    samples: visits.length, books, hours, spend,
    booksPerHour: hours > 0 ? books / hours : null,
    averageCost: books > 0 ? spend / books : null,
    buyRate: scanned > 0 ? counted.reduce((sum, visit) => sum + visit.books, 0) / scanned : null,
    zeroBookStopRate: visits.length ? visits.filter(visit => visit.books === 0).length / visits.length : null,
    saturation: scored.length >= 3 ? scored.reduce((sum, visit) => sum + visit.competition!, 0) / scored.length : null,
    saturationSamples: scored.length,
    lastVisit: visits.map(visit => visit.date).sort().at(-1) ?? null,
  };
}
export function actualEconomics(trip: Trip) {
  const costs = [trip.actualBookProfit, trip.actualTravelCost, trip.actualProcessingCost, trip.actualSourcingLaborCost];
  if (costs.some(value => value === undefined || value === null)) return null;
  const netCents = Math.round(trip.actualBookProfit! * 100) - Math.round(trip.actualTravelCost! * 100) - Math.round(trip.actualProcessingCost! * 100) - Math.round(trip.actualSourcingLaborCost! * 100);
  return { net: netCents / 100, perHour: trip.actualTripHours && trip.actualTripHours > 0 ? netCents / 100 / trip.actualTripHours : null };
}
