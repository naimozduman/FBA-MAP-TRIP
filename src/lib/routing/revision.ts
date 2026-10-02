import type { TripDraft } from '@/lib/model';
export function routeRevision(trip: TripDraft): string {
  return JSON.stringify({ origin: trip.origin, returnPoint: trip.returnPoint, days: trip.days.map(d => ({ date: d.date, hotel: d.hotel, mealPoint: d.mealPoint, mealAfterVisitId: d.mealAfterVisitId, visits: d.visits.map(v => ({ stops: v.stops.map(s => ({ id: s.id, point: s.point })) })) })), transport: { mode: trip.transport.mode, pickup: trip.transport.pickup, returnDepot: trip.transport.returnDepot } });
}
