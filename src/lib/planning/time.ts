import { Temporal } from "@js-temporal/polyfill";
export function localInstant(date: string, time: string, zone: string, disambiguation: "reject" | "earlier" | "later" = "reject"): string {
  return Temporal.PlainDateTime.from(date + "T" + time).toZonedDateTime(zone, { disambiguation }).toInstant().toString();
}
export function addMinutes(instant: string, minutes: number): string {
  return Temporal.Instant.from(instant).add({ seconds: Math.round(minutes * 60) }).toString();
}
export function minutesBetween(a: string, b: string): number {
  return (Temporal.Instant.from(b).epochMilliseconds - Temporal.Instant.from(a).epochMilliseconds) / 60000;
}
export function compareInstants(a: string, b: string): number {
  return Temporal.Instant.compare(Temporal.Instant.from(a), Temporal.Instant.from(b));
}
export function plusDays(date: string, days: number): string {
  return Temporal.PlainDate.from(date).add({ days }).toString();
}
export function displayTime(instant: string | null, zone: string): string {
  if (!instant) return "Time unconfirmed";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: zone, timeZoneName: "short" }).format(new Date(instant));
}
