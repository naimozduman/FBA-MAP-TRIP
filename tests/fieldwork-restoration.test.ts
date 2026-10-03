import { describe, expect, it } from "vitest";
import { cities, cityById, corridors, seedSources } from "../src/lib/fieldwork/data";
import { actualEconomics, legacyIds, observationSummary, sourceExclusion, sourcingBrief } from "../src/lib/fieldwork/brief";
import { visitSchema } from "../src/lib/fieldwork/validation";
import type { Trip, Visit } from "../src/lib/fieldwork/types";
const visit: Visit = { id: "visit-1", routeId: 1, tripId: null, cityId: "rolla", sourceId: null, sourceName: "Observed source", sourceType: "Thrift store", date: "2026-10-03", books: 0, scanned: null, spend: 0, hours: 1, contribution: 8, competition: null, notes: "" };
describe("recovered catalog and evidence boundaries", () => {
  it("retains every original identity, membership and reconciled destination", () => {
    expect(cities).toHaveLength(109);
    expect(new Set(cities.map(city => `${city.name}|${city.state}`)).size).toBe(109);
    expect(corridors).toHaveLength(15);
    expect(corridors.reduce((sum, route) => sum + route.cities.length, 0)).toBe(113);
    expect(seedSources).toHaveLength(6);
    expect(legacyIds).toHaveLength(108);
    for (const place of legacyIds) expect(cityById[place.legacy_id]?.state).toBe(place.state);
    expect(sourcingBrief.required_scanning_fields).toHaveLength(21);
    expect(sourcingBrief.source_classes).toHaveLength(4);
    expect(cityById["springfield-mo"].state).toBe("MO");
    expect(cityById["springfield-il"].state).toBe("IL");
    expect(legacyIds.some(place => place.legacy_id === "stl")).toBe(false);
  });
  it("keeps unobserved metrics unknown and includes recorded zero-book visits", () => {
    expect(observationSummary([]).saturation).toBeNull();
    const zero = observationSummary([visit]);
    expect(zero.zeroBookStopRate).toBe(1);
    expect(zero.averageCost).toBeNull();
    expect(zero.buyRate).toBeNull();
    const observed = { ...visit, scanned: 100, books: 20, spend: 10, competition: 4 };
    expect(observationSummary([observed, observed]).saturation).toBeNull();
    const summary = observationSummary([observed, { ...observed, competition: 6 }, { ...observed, competition: 8 }]);
    expect(summary.saturation).toBe(6);
    expect(summary.buyRate).toBe(.2);
    expect(summary.averageCost).toBe(.5);
  });
  it("does not infer actual profit from projections or deduct acquisition twice", () => {
    const trip = { contribution: 100, expectedBooks: 500 } as Trip;
    expect(actualEconomics(trip)).toBeNull();
    const actual = { ...trip, actualBookProfit: 120.51, actualTravelCost: 20.25, actualProcessingCost: 0, actualSourcingLaborCost: 10, actualTripHours: 5 };
    expect(actualEconomics(actual)).toEqual({ net: 90.26, perHour: 18.052 });
    expect(actualEconomics({ ...actual, actualProcessingCost: null })).toBeNull();
  });
  it("preserves source exclusions, outlet distinction and an explicit override reason", () => {
    const retail = { ...seedSources[0], name: "Goodwill retail", type: "Thrift store" };
    expect(sourceExclusion(retail)).toMatch(/excluded/);
    expect(sourceExclusion({ ...retail, type: "Goodwill outlet" })).toBeNull();
    expect(sourceExclusion({ ...retail, name: "Half Price Books" })).toMatch(/excluded/);
    expect(sourceExclusion({ ...retail, exclusionOverrideReason: "Confirmed bulk clearance offer" })).toBeNull();
  });
  it("requires raw evidence for quality scores and validates observation counts/times", () => {
    expect(visitSchema.safeParse({ ...visit, quality: { volume: { score: 4, raw: "" } } }).success).toBe(false);
    expect(visitSchema.safeParse({ ...visit, quality: { volume: { score: 4, raw: "Counted four full shelves" } } }).success).toBe(true);
    expect(visitSchema.safeParse({ ...visit, scanned: 10, books: 8, booksRejected: 4 }).success).toBe(false);
    expect(visitSchema.safeParse({ ...visit, arrivalTime: "2026-10-03T14:00", departureTime: "2026-10-03T13:00" }).success).toBe(false);
  });
});
