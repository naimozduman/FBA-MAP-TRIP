import { tripSchema, type Point, type RouteLeg, type Stop, type TripDraft } from "@/lib/model";
import { addMinutes, compareInstants, localInstant, minutesBetween } from "./time";
import { evaluateTransport } from "./transport";

export type Activity = { id: string; day: number; kind: "drive" | "source" | "wait" | "parking" | "loading" | "meal" | "flex" | "setup" | "checkin" | "checkout" | "rest"; label: string; start: string | null; end: string | null; minutes: number | null; zone: string; cityVisitId: string | null; routeKind?: RouteLeg["kind"] };
export type Schedule = { status: "feasible" | "tight" | "infeasible" | "provisional"; reasons: string[]; activities: Activity[]; arrival: string | null; elapsedHours: number | null; personHours: number[] | null; meters: number | null };
export const routable = (p: Point | null): p is Point => !!p && p.precision === "exact" && p.confirmed;
export function routeWaypoints(trip: TripDraft): { point: Point; kind: RouteLeg["kind"] }[] {
  if (!routable(trip.origin)) throw new Error("Confirm an exact private origin.");
  const points: { point: Point; kind: RouteLeg["kind"] }[] = [{ point: { ...trip.origin, id: "home" }, kind: "outbound" }];
  const push = (point: Point | null, id: string, kind: RouteLeg["kind"]) => {
    if (!routable(point)) throw new Error("Every source, lodging and return point must have confirmed exact coordinates.");
    points.push({ point: { ...point, id }, kind });
  };
  if (trip.transport.mode === "truck") push(trip.transport.pickup, "rental-pickup", "rental");
  trip.days.forEach((day, dayIndex) => {
    if (!day.visits.length || day.visits.some(v => !v.stops.length)) throw new Error("City-centroid planning is not store navigation. Choose actual stores/events.");
    day.visits.forEach((visit, visitIndex) => { visit.stops.forEach((stop, stopIndex) => {
      if ((stop.category === "regular_goodwill" || stop.category === "half_price_books") && !stop.exceptionReason.trim()) throw new Error("An excluded source needs an explicit current-trip exception.");
      push(stop.point && stop.point.address.trim() ? stop.point : null, stop.id, stopIndex > 0 ? "local" : (dayIndex === 0 && visitIndex === 0 && trip.transport.mode !== "truck" ? "outbound" : "intercity"));
    });
      if (day.mealPoint && (day.mealAfterVisitId ? day.mealAfterVisitId === visit.id : visitIndex === 0)) push(day.mealPoint, "meal-" + day.id, "local");
    });
    if (dayIndex < trip.days.length - 1) push(day.hotel, "hotel-" + day.id, "lodging");
  });
  if (trip.transport.mode === "truck") push(trip.transport.returnDepot, "rental-return", "rental");
  push(trip.returnPoint || trip.origin, "return-home", "return");
  return points;
}

export function buildSchedule(trip: TripDraft, legs: RouteLeg[] = [], conflicts: string[] = []): Schedule {
  const parsed = tripSchema.safeParse(trip);
  if (!parsed.success) return { status: "infeasible", reasons: parsed.error.issues.map(i => i.path.join(".") + ": " + i.message), activities: [], arrival: null, elapsedHours: null, personHours: null, meters: null };
  trip = parsed.data;
  const activities: Activity[] = [], hard: string[] = [], unknown: string[] = [];
  hard.push(...conflicts);
  let cursor: string | null = null, arrival: string | null = null, first: string | null = null, previousNightReady: string | null = null;
  let fromId = "home", totalMeters = 0, allRoutesKnown = true;
  if (!routable(trip.origin)) unknown.push("Exact Affton / Lakeshire base pin is not confirmed.");
  if (trip.returnPoint && !routable(trip.returnPoint)) unknown.push("Return destination is unconfirmed.");
  const transport = evaluateTransport(trip.transport, trip.participants.length);
  hard.push(...transport.errors); unknown.push(...transport.unknowns);
  const add = (day: number, kind: Activity["kind"], label: string, minutes: number | null, zone: string, cityVisitId: string | null = null, routeKind?: RouteLeg["kind"]) => {
    const start = cursor;
    cursor = start && minutes !== null ? addMinutes(start, minutes) : null;
    activities.push({ id: "activity-" + activities.length, day, kind, label, minutes, start, end: cursor, zone, cityVisitId, routeKind });
  };
  const drive = (day: number, toId: string, label: string, zone: string, cityVisitId: string | null = null): number | null => {
    const leg = legs.find(l => l.from === fromId && l.to === toId);
    if (!leg) { unknown.push("Route unavailable: " + label + "."); allRoutesKnown = false; }
    else totalMeters += leg.meters;
    const minutes = leg ? leg.seconds / 60 + trip.driveBufferMinutes : null;
    add(day, "drive", label, minutes, zone, cityVisitId, leg?.kind);
    fromId = toId;
    return minutes;
  };
  const visitStop = (day: number, stop: Stop, zone: string, visitId: string) => {
    if (!routable(stop.point) || !stop.point.address.trim()) unknown.push(stop.name + ": exact access address unconfirmed.");
    if ((stop.category === "regular_goodwill" || stop.category === "half_price_books") && !stop.exceptionReason.trim()) hard.push(stop.name + ": excluded by default; record a trip-specific exception.");
    add(day, "parking", "Parking / setup — " + stop.name, stop.parkingMinutes, zone, visitId);
    if (!stop.windows?.length || !stop.evidenceUrl || !stop.checkedAt) unknown.push(stop.name + ": dated opening hours / provenance unconfirmed.");
    if (stop.checkedAt && trip.days[day].date > stop.checkedAt.slice(0,10) && Date.parse(trip.days[day].date+'T12:00:00Z')-Date.parse(stop.checkedAt)>90*86400000) unknown.push(stop.name+': opening evidence is over 90 days old relative to the trip; recheck it.');
    if (stop.windows?.length) {
      const required = stop.minutes;
      if (stop.windows.every(w => minutesBetween(w.start, w.end) < required)) hard.push(stop.name + ": the requested sourcing time exceeds every known opening window.");
      if (cursor) {
        const current = cursor;
        const window = [...stop.windows].sort((a, b) => compareInstants(a.start, b.start)).find(w => {
          const start = compareInstants(current, w.start) < 0 ? w.start : current;
          return compareInstants(addMinutes(start, required), w.end) <= 0;
        });
        if (window && compareInstants(cursor, window.start) < 0) add(day, "wait", "Wait for " + stop.name + " to open", minutesBetween(cursor, window.start), zone, visitId);
        if (!window) hard.push(stop.name + ": full requested visit does not fit the dated opening / event windows. Duration preserved.");
      }
    }
    add(day, "source", stop.name, stop.minutes, zone, visitId);
    add(day, "loading", "Load / exit — " + stop.name, stop.loadingMinutes, zone, visitId);
  };
  try {
    trip.days.forEach((day, dayIndex) => {
      const zone = dayIndex > 0 ? (trip.days[dayIndex - 1].hotel?.zone || trip.homeZone) : trip.homeZone;
      cursor = localInstant(day.date, day.departureLocal, zone);
      const dayStart = cursor;
      if (!first) first = cursor;
      if (previousNightReady && compareInstants(cursor, previousNightReady) < 0) hard.push("Day " + (dayIndex + 1) + ": departure violates rest/checkout by " + Math.ceil(minutesBetween(cursor, previousNightReady)) + " minutes.");
      if (dayIndex > 0) {
        const previous = trip.days[dayIndex - 1];
        fromId = "hotel-" + previous.id;
        if (!routable(previous.hotel) || !previous.hotelConfirmed) unknown.push("Day " + (dayIndex + 1) + ": previous-night lodging is unconfirmed.");
      }
      if (!day.visits.length) unknown.push("Day " + (dayIndex + 1) + ": choose a primary sourcing city and actual stops.");
      if (dayIndex === 0 && trip.transport.mode === "truck") {
        drive(dayIndex, "rental-pickup", "Travel to rental pickup", trip.transport.pickup?.zone || zone);
        const w = trip.transport.pickupWindow;
        if (cursor && w && compareInstants(cursor, w.start) < 0) add(dayIndex, "wait", "Wait for rental pickup", minutesBetween(cursor, w.start), zone);
        if (cursor && w && compareInstants(addMinutes(cursor, trip.transport.pickupMinutes), w.end) > 0) hard.push("Rental pickup misses its confirmed window.");
        add(dayIndex, "setup", "Rental pickup / inspection", trip.transport.pickupMinutes, zone);
      }
      day.visits.forEach((visit, vi) => {
        drive(dayIndex, visit.stops[0]?.id || "unconfirmed-city-" + visit.id, (vi === 0 ? "Drive to " : "Intercity drive to ") + visit.cityName, visit.zone);
        if (vi === 0) add(dayIndex, "setup", "Arrival setup", day.setupMinutes, visit.zone);
        const cityStartIndex = activities.length;
        if (!visit.stops.length) {
          unknown.push(visit.cityName + ": city work window only; no confirmed store/event stops.");
          add(dayIndex, "flex", visit.cityName + " sourcing reservation", visit.reservedMinutes, visit.zone, visit.id);
        } else {
          visit.stops.forEach((stop, si) => {
            if (si > 0) drive(dayIndex, stop.id, "Local transfer to " + stop.name, visit.zone, visit.id);
            visitStop(dayIndex, stop, visit.zone, visit.id);
          });
          const cityActivities = activities.slice(cityStartIndex);
          if (cityActivities.some(a => a.minutes === null)) add(dayIndex, "flex", "Unallocated city time — local driving unconfirmed", null, visit.zone, visit.id);
          else {
            const used = cityActivities.reduce((sum, a) => sum + a.minutes!, 0);
            if (used < visit.reservedMinutes) add(dayIndex, "flex", "Unallocated sourcing time", visit.reservedMinutes - used, visit.zone, visit.id);
          }
        }
        const mealHere = day.mealAfterVisitId ? day.mealAfterVisitId === visit.id : vi === 0;
        if (mealHere) {
          if (day.mealPoint) {
            if (!routable(day.mealPoint)) unknown.push("Meal access point is unconfirmed.");
            drive(dayIndex, "meal-" + day.id, "Drive to selected meal stop", day.mealPoint.zone);
            if (!day.mealWindow) unknown.push("Meal stop opening window is unconfirmed.");
            if (cursor && day.mealWindow && compareInstants(cursor, day.mealWindow.start) < 0) add(dayIndex, "wait", "Wait for meal stop opening", minutesBetween(cursor, day.mealWindow.start), day.mealPoint.zone);
            if (cursor && day.mealWindow && compareInstants(addMinutes(cursor, day.mealMinutes), day.mealWindow.end) > 0) hard.push("Meal does not fit the selected opening window.");
          }
          add(dayIndex, "meal", day.mealPoint ? "Meal / rest — " + day.mealPoint.label : "Packed meal / rest break", day.mealMinutes, day.mealPoint?.zone || visit.zone);
          add(dayIndex, "loading", "Additional bulk loading", day.extraLoadingMinutes, visit.zone);
        }
      });
      const isLast = dayIndex === trip.days.length - 1;
      if (isLast && trip.transport.mode === "truck") {
        drive(dayIndex, "rental-return", "Travel to rental return", trip.transport.returnDepot?.zone || zone);
        const w = trip.transport.returnWindow;
        if (cursor && w && compareInstants(cursor, w.start) < 0) add(dayIndex, "wait", "Wait for rental return", minutesBetween(cursor, w.start), zone);
        if (cursor && w && compareInstants(addMinutes(cursor, trip.transport.returnMinutes), w.end) > 0) hard.push("Rental return misses its confirmed window.");
        add(dayIndex, "loading", "Rental unloading / return", trip.transport.returnMinutes, zone);
      }
      const endZone = isLast ? (trip.returnPoint?.zone || trip.homeZone) : (day.hotel?.zone || zone);
      drive(dayIndex, isLast ? "return-home" : "hotel-" + day.id, isLast ? "Return home" : "Drive to overnight lodging", endZone);
      arrival = cursor;
      const deadline = isLast ? localInstant(trip.returnDate, trip.returnLocal, trip.homeZone) : localInstant(day.date, day.deadlineLocal, endZone);
      if (cursor && compareInstants(cursor, deadline) > 0) hard.push("Day " + (dayIndex + 1) + ": arrival misses the deadline by " + Math.ceil(minutesBetween(deadline, cursor)) + " minutes.");
      const knownMinutes = activities.filter(a => a.day === dayIndex && a.kind !== "rest").reduce((sum, a) => sum + (a.minutes ?? 0), 0);
      if (!cursor && knownMinutes > minutesBetween(dayStart, deadline)) hard.push("Day " + (dayIndex + 1) + ": confirmed activity durations already exceed the available day, even before unknown driving.");
      if (knownMinutes > day.maxActiveMinutes) hard.push("Day " + (dayIndex + 1) + ": activity exceeds the protected daily limit of " + day.maxActiveMinutes / 60 + " hours.");
      if (!isLast) {
        if (!routable(day.hotel) || !day.hotelConfirmed) unknown.push("Night " + (dayIndex + 1) + ": actual lodging/check-in availability is unconfirmed.");
        if (!day.checkInWindow) unknown.push("Night " + (dayIndex + 1) + ": dated hotel check-in window is unconfirmed.");
        if (cursor && day.checkInWindow && compareInstants(cursor, day.checkInWindow.start) < 0) add(dayIndex, "wait", "Wait for hotel check-in", minutesBetween(cursor, day.checkInWindow.start), endZone);
        if (cursor && day.checkInWindow && compareInstants(addMinutes(cursor, day.checkInMinutes), day.checkInWindow.end) > 0) hard.push("Night " + (dayIndex + 1) + ": arrival/check-in misses the lodging window.");
        add(dayIndex, "checkin", "Hotel check-in", day.checkInMinutes, endZone);
        add(dayIndex, "rest", "Protected overnight rest", day.restMinutes, endZone);
        add(dayIndex, "checkout", "Hotel checkout", day.checkOutMinutes, endZone);
        previousNightReady = cursor;
      }
    });
  } catch {
    hard.push("Invalid date, IANA time zone, or ambiguous/nonexistent local time. Choose a valid explicit local time.");
  }
  const reasons = [...new Set([...hard, ...unknown])];
  const elapsedHours = first && arrival && allRoutesKnown ? minutesBetween(first, arrival) / 60 : null;
  let slack: number | null = null;
  try { if (arrival) slack = minutesBetween(arrival, localInstant(trip.returnDate, trip.returnLocal, trip.homeZone)); } catch { /* Invalid local times already make the schedule infeasible. */ }
  return {
    status: hard.length ? "infeasible" : unknown.length ? "provisional" : slack !== null && slack < 60 ? "tight" : "feasible",
    reasons, activities, arrival, elapsedHours, personHours: elapsedHours !== null ? trip.participants.map(() => elapsedHours) : null,
    meters: allRoutesKnown ? totalMeters : null
  };
}
