import { z } from "zod";
export const zoneSchema = z.string().min(1).max(80).refine(zone => { try { new Intl.DateTimeFormat("en", { timeZone: zone }); return true; } catch { return false; } }, "Use a valid IANA time zone.");
const dateSchema = z.iso.date();
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const evidenceSchema = z.url().max(2000).refine(url => url.startsWith("https://"), "Evidence must use HTTPS.");

export const pointSchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  address: z.string().max(500),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  zone: zoneSchema,
  precision: z.enum(["exact", "approximate"]),
  confirmed: z.boolean()
});
export type Point = z.infer<typeof pointSchema>;
export const openingSchema = z.object({ start: z.iso.datetime({ offset: true }), end: z.iso.datetime({ offset: true }) }).refine(w => Date.parse(w.end) > Date.parse(w.start), "Closing must follow opening.");
export type Opening = z.infer<typeof openingSchema>;
export const categorySchema = z.enum(["library_sale", "independent", "thrift", "charity", "church", "estate", "outlet", "regular_goodwill", "half_price_books", "other"]);
export const stopSchema = z.object({
  id: z.uuid(),
  sourceId: z.uuid().nullable(),
  eventId: z.uuid().nullable(),
  name: z.string().min(1).max(200),
  kind: z.enum(["store", "event"]),
  category: categorySchema,
  exceptionReason: z.string().max(500),
  point: pointSchema.nullable(),
  minutes: z.number().int().min(1).max(600),
  parkingMinutes: z.number().int().min(0).max(120),
  loadingMinutes: z.number().int().min(0).max(120),
  windows: z.array(openingSchema).max(50).nullable(),
  evidenceUrl: evidenceSchema.nullable(),
  checkedAt: z.iso.datetime({ offset: true }).nullable()
});
export type Stop = z.infer<typeof stopSchema>;
export const cityVisitSchema = z.object({
  id: z.uuid(), cityId: z.string().min(1).max(100), cityName: z.string().min(1).max(200),
  zone: zoneSchema, reservedMinutes: z.number().int().min(60).max(600),
  stops: z.array(stopSchema).max(30)
});
export type CityVisit = z.infer<typeof cityVisitSchema>;
export const daySchema = z.object({
  id: z.uuid(), date: dateSchema,
  departureLocal: timeSchema, deadlineLocal: timeSchema,
  visits: z.array(cityVisitSchema).max(10),
  setupMinutes: z.number().int().min(0).max(120), mealMinutes: z.number().int().min(0).max(120),
  mealAfterVisitId: z.uuid().nullable(), extraLoadingMinutes: z.number().int().min(0).max(180),
  mealPoint: pointSchema.nullable().default(null),
  mealWindow: openingSchema.nullable().default(null),
  hotel: pointSchema.nullable(), hotelConfirmed: z.boolean(),
  checkInMinutes: z.number().int().min(0).max(120), checkOutMinutes: z.number().int().min(0).max(120),
  restMinutes: z.number().int().min(360).max(840),
  checkInWindow: openingSchema.nullable().default(null),
  maxActiveMinutes: z.number().int().min(240).max(960).default(720)
});
export type TripDay = z.infer<typeof daySchema>;
export const transportSchema = z.object({
  mode: z.enum(["car", "truck"]), vehicleIds: z.array(z.uuid()).max(4),
  driverAssignments: z.array(z.object({vehicleId:z.uuid(),userId:z.uuid()})).max(4).default([]),
  eligibleDrivers: z.number().int().min(0).max(4),
  destinationPickup: z.boolean(), carMustReturn: z.boolean(),
  transferPlan: z.string().max(2000), pickup: pointSchema.nullable(), returnDepot: pointSchema.nullable(),
  pickupWindow: openingSchema.nullable(), returnWindow: openingSchema.nullable(),
  pickupMinutes: z.number().int().min(0).max(180), returnMinutes: z.number().int().min(0).max(180),
  roadRestrictionsVerified: z.boolean(),
  payloadKg: z.number().nonnegative().nullable(), cargoKg: z.number().nonnegative().nullable(),
  capacityLiters: z.number().nonnegative().nullable(), cargoLiters: z.number().nonnegative().nullable(),
  peopleGearKg: z.number().nonnegative().nullable()
});
export type Transport = z.infer<typeof transportSchema>;
export const economicsSchema = z.object({
  usableBooks: z.number().int().nonnegative().nullable(),
  contributionPerBookCents: z.number().int().nullable(),
  contributionBasis: z.string().max(2000),
  costs: z.array(z.object({ id: z.string().max(100), name: z.string().min(1).max(200), cents: z.number().int().nonnegative().nullable(), basis: z.enum(["fuel", "mileage_inclusive", "other"]), vehicleId: z.uuid().nullable().default(null), pricing: z.enum(['fixed','per_mile']).default('fixed'), centsPerMile: z.number().nonnegative().nullable().default(null) })).max(40),
  alternative: z.object({ extraCostCents: z.number().int().nonnegative().nullable(), extraUsableBooks: z.number().int().nonnegative().nullable(), extraHoursPerPerson: z.number().nonnegative().nullable(), evidence: z.string().max(2000) }).nullable().default(null)
});
export type Economics = z.infer<typeof economicsSchema>;
export const tripSchema = z.object({
  id: z.uuid(), name: z.string().min(1).max(200), version: z.number().int().nonnegative(),
  origin: pointSchema.nullable(), returnPoint: pointSchema.nullable(),
  homeZone: zoneSchema, returnDate: dateSchema,
  returnLocal: timeSchema,
  nights: z.number().int().min(0).max(3), participants: z.array(z.string().min(1).max(100)).min(1).max(4),
  days: z.array(daySchema).min(1).max(4), transport: transportSchema, economics: economicsSchema,
  driveBufferMinutes: z.number().int().min(0).max(120)
}).superRefine((trip, ctx) => {
  if (trip.days.length !== trip.nights + 1) ctx.addIssue({ code: "custom", message: "Days must match the chosen night preset.", path: ["days"] });
  const ids = [trip.id, ...trip.days.flatMap(d => [d.id, ...d.visits.flatMap(v => [v.id, ...v.stops.map(s => s.id)])])];
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "Itinerary IDs must be unique." });
  if (new Set(trip.participants).size !== trip.participants.length) ctx.addIssue({ code: "custom", message: "Duplicate participant." });
  if (new Set(trip.transport.vehicleIds).size !== trip.transport.vehicleIds.length) ctx.addIssue({ code: "custom", message: "Duplicate vehicle." });
  if (trip.transport.eligibleDrivers > trip.participants.length) ctx.addIssue({ code: "custom", message: "Eligible drivers cannot exceed the crew." });
  if(new Set(trip.transport.driverAssignments.map(a=>a.vehicleId)).size!==trip.transport.driverAssignments.length || trip.transport.driverAssignments.some(a=>!trip.transport.vehicleIds.includes(a.vehicleId)||!trip.participants.includes(a.userId)))ctx.addIssue({code:'custom',message:'Drivers must belong to this crew and assigned vehicle; choose one driver per vehicle.'});
  trip.days.forEach((day, i) => {
    if (i && day.date <= trip.days[i - 1].date) ctx.addIssue({ code: "custom", message: "Day dates must increase.", path: ["days", i, "date"] });
    if (day.mealAfterVisitId && !day.visits.some(v => v.id === day.mealAfterVisitId)) ctx.addIssue({ code: "custom", message: "Meal must follow a city on this day.", path: ["days", i, "mealAfterVisitId"] });
    day.visits.forEach((v, j) => v.stops.forEach((s, k) => { if (s.eventId && !s.sourceId) ctx.addIssue({ code: "custom", message: "A dated event must belong to a source.", path: ["days", i, "visits", j, "stops", k] }); }));
  });
});
export type TripDraft = z.infer<typeof tripSchema>;
export type City = { id: string; name: string; state: string; zone: string; lat: number | null; lng: number | null; overview: string; provenance: string; corridor: string };
export type Source = { id: string; city_id: string; name: string; category: z.infer<typeof categorySchema>; point: Point | null; windows: Opening[] | null; evidence_url: string | null; checked_at: string | null; is_lead: boolean };
export type Food = { id: string; city_id: string; name: string; status: "certified" | "business_stated" | "community_reported" | "unverified"; evidence_url: string | null; checked_at: string | null; scope: string; point: Point | null; windows: Opening[] | null };
export type SourceEvent = { id: string; source_id: string; name: string; windows: Opening[] | null; evidence_url: string | null; checked_at: string | null };
export type Vehicle = { id: string; name: string; payload_kg: number | null; volume_liters: number | null };
export type Note = { id: string; city_id: string | null; source_id: string | null; trip_id: string | null; body: string; updated_at: string };
export type Corridor = { id: string; name: string };
export type CorridorCity = { corridor_id: string; city_id: string; position: number };
export type VisitResult = { id: string; city_id: string; source_id: string | null; visited_at: string; bought: number | null; scanned: number | null; usable: number | null; purchase_cents: number | null; minutes: number | null; notes: string };
export type Member = { user_id: string; display_name: string; role: "owner" | "partner" };
export type WorkspaceData = { workspaceId: string | null; members: Member[]; cities: City[]; sources: Source[]; food: Food[]; visits: VisitResult[]; trips: TripDraft[]; origin: Point | null; vehicles: Vehicle[]; events: SourceEvent[]; notes: Note[]; corridors: Corridor[]; corridorCities: CorridorCity[] };
export type RouteLeg = { from: string; to: string; seconds: number; meters: number; geometry: [number, number][]; kind: "outbound" | "local" | "intercity" | "return" | "lodging" | "rental"; provider: "mapbox"; fetchedAt: string };
export type RouteResult = { status: "available" | "unavailable"; revision: string; legs: RouteLeg[]; reason: string | null };
