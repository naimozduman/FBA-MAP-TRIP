import type { Transport, TripDraft } from "@/lib/model";
import { localInstant, compareInstants } from "./time";
export function evaluateTransport(t: Transport, people: number) {
  const errors: string[] = [], unknowns: string[] = [];
  if (!t.eligibleDrivers) unknowns.push("Confirm at least one eligible driver.");
  if (t.eligibleDrivers > people) errors.push("Eligible drivers exceed assigned people.");
  if (t.vehicleIds.length === 0) unknowns.push("Vehicle assignment is unconfirmed.");
  if(t.vehicleIds.some(id=>!t.driverAssignments?.some(a=>a.vehicleId===id)))unknowns.push('Assign a specific eligible crew member to every vehicle.');
  if(new Set((t.driverAssignments||[]).map(a=>a.userId)).size>t.eligibleDrivers)errors.push('Assigned drivers exceed the confirmed eligible-driver count.');
  if (t.payloadKg === null || t.cargoKg === null || t.peopleGearKg === null) unknowns.push("Payload, cargo weight and people/gear allowance need confirmation.");
  else if (t.cargoKg + t.peopleGearKg > t.payloadKg) errors.push("Cargo and people/gear exceed the vehicle payload by " + (t.cargoKg + t.peopleGearKg - t.payloadKg).toFixed(1) + " kg.");
  if (t.capacityLiters === null || t.cargoLiters === null) unknowns.push("Cargo volume and usable volume need confirmation.");
  else if (t.cargoLiters > t.capacityLiters) errors.push("Cargo exceeds the usable volume.");
  if (t.mode === "truck") {
    if (!t.transferPlan.trim()) unknowns.push('Explain transport to pickup and home after the truck is returned, including any personal-car handoff.');
    if (!t.roadRestrictionsVerified) unknowns.push("Passenger-car directions do not verify truck clearances or restrictions.");
    if (!t.pickup || !t.returnDepot || !t.pickupWindow || !t.returnWindow) unknowns.push("Rental pickup/return locations and windows are unconfirmed.");
    if (t.destinationPickup && t.carMustReturn) {
      if (people < 2 || t.eligibleDrivers < 2 || t.vehicleIds.length < 2) errors.push("Two vehicles must return. This plan needs two assigned vehicles and two eligible drivers; a solo person cannot move both.");
      if(t.driverAssignments?.length>=2&&new Set(t.driverAssignments.map(a=>a.userId)).size<2)errors.push('The same person cannot drive both returning vehicles simultaneously.');
      if (!t.transferPlan.trim()) unknowns.push("Explain how the personal car gets home after destination truck pickup.");
      unknowns.push("Destination pickup remains provisional: the additional car's route, transfers and costs need a separate validated saved trip.");
    }
  }
  return { errors, unknowns };
}
export function tripConflicts(candidate: TripDraft, others: TripDraft[]): string[] {
  try {
  const start = localInstant(candidate.days[0].date, candidate.days[0].departureLocal, candidate.homeZone);
  const end = localInstant(candidate.returnDate, candidate.returnLocal, candidate.homeZone);
  return others.filter(t => t.id !== candidate.id).flatMap(t => {
    const otherStart = localInstant(t.days[0].date, t.days[0].departureLocal, t.homeZone);
    const otherEnd = localInstant(t.returnDate, t.returnLocal, t.homeZone);
    const overlap = compareInstants(start, otherEnd) < 0 && compareInstants(otherStart, end) < 0;
    if (!overlap) return [];
    const people = candidate.participants.some(p => t.participants.includes(p));
    const vehicles = candidate.transport.vehicleIds.some(v => t.transport.vehicleIds.includes(v));
    return people || vehicles ? ["Resource conflict with " + t.name + ": " + [people ? "person" : "", vehicles ? "vehicle" : ""].filter(Boolean).join(" and ") + " overlaps."] : [];
  });
  } catch { return ["Resource conflicts cannot be checked until all trip dates and time zones are valid."]; }
}
