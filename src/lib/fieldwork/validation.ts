import { z } from "zod";
import { cityById, routeById, sourceTypes } from "./data";
import { qualityDimensions } from "./types";
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
const text = (n = 4000) => z.string().max(n);
const cost = z.number().finite().min(0).max(1000000);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((d) => {
    const n = new Date(d + "T12:00:00Z");
    return !Number.isNaN(n.getTime()) && n.toISOString().slice(0, 10) === d;
  }, "Enter a valid date.");
const optionalDate = z.union([date, z.literal("")]);
const city = z.string().refine((id) => !!cityById[id], "Choose a known city.");
const route = z
  .number()
  .int()
  .refine((n) => !!routeById[n], "Choose a corridor.");
const stopList = z
  .array(city)
  .max(30)
  .refine(
    (a) => !a.includes("stl") && new Set(a).size === a.length,
    "Use each stop once. Home is added automatically.",
  );
export const tripSchema = z
  .object({
    id,
    routeId: route,
    title: text(120).min(1),
    actualBookProfit: z.number().finite().min(-1000000).max(1000000).nullable().optional(),
    actualTravelCost: cost.nullable().optional(),
    actualProcessingCost: cost.nullable().optional(),
    actualSourcingLaborCost: cost.nullable().optional(),
    actualTripHours: z.number().finite().min(0).max(10000).nullable().optional(),
    date,
    endDate: date,
    reason: text(2000).min(1),
    people: text(120).min(1),
    vehicle: text(120).min(1),
    status: z.enum(["planned", "active", "complete"]),
    stops: stopList.refine(
      (a) => a.length > 0,
      "Choose at least one outbound stop.",
    ),
    returnStops: stopList,
    miles: cost,
    mpg: z.number().finite().min(1).max(200),
    gasPrice: cost,
    hotel: cost,
    tolls: cost,
    other: cost,
    expectedBooks: z.number().int().min(0).max(100000),
    contribution: z.number().finite().min(-1000).max(100000),
    hours: z.number().finite().min(0).max(10000),
    processing: cost,
    laborRate: cost,
    notes: text(),
  })
  .strict()
  .refine((t) => t.endDate >= t.date, "Return date must follow departure.")
  .refine(
    (t) => !t.returnStops.some((s) => t.stops.includes(s)),
    "A return stop is already on the outbound list.",
  );
export const visitSchema = z
  .object({
    arrivalTime: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)]).optional(),
    departureTime: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)]).optional(),
    projectedRevenue: cost.nullable().optional(),
    projectedAmazonFees: cost.nullable().optional(),
    projectedProfit: z.number().finite().min(-1000000).max(1000000).nullable().optional(),
    booksRejected: z.number().int().min(0).max(10000000).nullable().optional(),
    rejectionReason: text(1000).optional(),
    scannersObserved: z.number().int().min(0).max(10000).nullable().optional(),
    stockPicked: z.enum(["unknown", "fresh", "picked"]).optional(),
    restockFrequency: text(300).optional(),
    organizerContact: text(300).optional(),
    acceptsBulk: z.enum(["unknown", "yes", "no"]).optional(),
    nextRestockDate: optionalDate.optional(),
    quality: z.partialRecord(z.enum(qualityDimensions), z.object({ score: z.number().int().min(0).max(5).nullable(), raw: text(1000) }).refine(item => item.score === null || item.raw.trim().length > 0, "Record raw evidence behind each source quality score.")).optional(),
    id,
    routeId: route,
    tripId: id.nullable(),
    cityId: city,
    sourceId: id.nullable(),
    sourceName: text(180).min(1),
    sourceType: z.string().refine((t) => sourceTypes.includes(t)),
    date,
    books: z.number().int().min(0).max(100000),
    scanned: z.number().int().min(0).max(10000000).nullable(),
    spend: cost,
    hours: z.number().finite().min(0).max(500),
    contribution: z.number().finite().min(-1000).max(100000),
    competition: z.number().int().min(0).max(10).nullable(),
    notes: text(),
  })
  .strict()
  .refine(
    (v) => v.scanned === null || v.scanned >= v.books,
    "Books scanned must equal or exceed books bought.",
  )
  .refine(v => !v.arrivalTime || !v.departureTime || v.departureTime > v.arrivalTime, "Departure must follow arrival in recorded local time.")
  .refine(v => v.scanned === null || v.books + (v.booksRejected ?? 0) <= v.scanned, "Bought and rejected books cannot exceed the scanned count.");
export const sourceSchema = z
  .object({
    historical: z.boolean().optional(),
    inventoryClass: z.number().int().min(1).max(4).nullable().optional(),
    revisitCadence: text(300).optional(),
    exclusionOverrideReason: text(500).optional(),
    id,
    routeId: route,
    cityId: city,
    name: text(180).min(1),
    type: z.string().refine((t) => sourceTypes.includes(t)),
    address: text(300),
    hours: text(500),
    pricing: text(700),
    contact: text(200),
    url: z.union([
      z.literal(""),
      z
        .string()
        .url()
        .max(2000)
        .refine((x) => x.startsWith("https://") || x.startsWith("http://")),
    ]),
    scanPolicy: z.enum(["Unknown", "Allowed", "Prohibited"]),
    notes: text(),
    verifiedAt: optionalDate,
    nextDate: optionalDate,
    endDate: optionalDate,
  })
  .strict()
  .refine(
    (s) => !s.endDate || !s.nextDate || s.endDate >= s.nextDate,
    "End date must follow start date.",
  );
export const settingsSchema = z
  .object({
    id: z.literal("preferences"),
    vehicle: text(120).min(1),
    mpg: z.number().finite().min(1).max(200),
    gasPrice: cost,
    contribution: z.number().finite().min(-1000).max(100000),
    people: text(120).min(1),
  })
  .strict();
export const kindSchema = z.enum(["trip", "visit", "source", "settings"]);
export const schemas = {
  trip: tripSchema,
  visit: visitSchema,
  source: sourceSchema,
  settings: settingsSchema,
};
export const requestSchema = z
  .object({
    kind: kindSchema,
    revision: z.number().int().min(0),
    data: z.unknown(),
  })
  .strict();
export const deleteSchema = z
  .object({ id, revision: z.number().int().min(1) })
  .strict();
