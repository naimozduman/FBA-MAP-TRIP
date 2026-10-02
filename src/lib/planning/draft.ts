import type { City, CityVisit, TripDay, TripDraft, Stop } from "@/lib/model";
import { plusDays } from "./time";
export function newDay(date: string): TripDay {
  return { id: crypto.randomUUID(), date, departureLocal: "06:00", deadlineLocal: "18:00", visits: [], setupMinutes: 30, mealMinutes: 45, mealAfterVisitId: null, mealPoint: null, mealWindow: null, extraLoadingMinutes: 30, hotel: null, hotelConfirmed: false, checkInMinutes: 30, checkOutMinutes: 20, restMinutes: 480, checkInWindow: null, maxActiveMinutes: 720 };
}
export function newTrip(participants: string[], date: string): TripDraft {
  return {
    id: crypto.randomUUID(), name: "New sourcing trip", version: 0, origin: null, returnPoint: null,
    homeZone: "America/Chicago", returnDate: date, returnLocal: "18:00", nights: 0,
    participants, days: [newDay(date)], driveBufferMinutes: 15,
    transport: { mode: "car", vehicleIds: [], driverAssignments:[], eligibleDrivers: 0, destinationPickup: false, carMustReturn: true, transferPlan: "", pickup: null, returnDepot: null, pickupWindow: null, returnWindow: null, pickupMinutes: 30, returnMinutes: 30, roadRestrictionsVerified: false, payloadKg: null, cargoKg: null, capacityLiters: null, cargoLiters: null, peopleGearKg: null },
    economics: { usableBooks: null, contributionPerBookCents: null, contributionBasis: "", costs: [{ id: crypto.randomUUID(), name: "Shared vehicle cost", cents: null, basis: "other", vehicleId: null, pricing:'fixed', centsPerMile:null }], alternative: null }
  };
}
export function withNights(trip: TripDraft, nights: number): TripDraft {
  const start = trip.days[0].date;
  const days = Array.from({ length: nights + 1 }, (_, i) => ({ ...(trip.days[i] || newDay(plusDays(start, i))), date: plusDays(start, i) }));
  return { ...trip, nights, days, returnDate: plusDays(start, nights) };
}
export function newCityVisit(city: City): CityVisit {
  return { id: crypto.randomUUID(), cityId: city.id, cityName: city.name + ", " + city.state, zone: city.zone, reservedMinutes: 240, stops: [] };
}
export function newStop(): Stop {
  return { id: crypto.randomUUID(), sourceId: null, eventId: null, name: "Unconfirmed source", kind: "store", category: "independent", exceptionReason: "", point: null, minutes: 60, parkingMinutes: 10, loadingMinutes: 10, windows: null, evidenceUrl: null, checkedAt: null };
}
