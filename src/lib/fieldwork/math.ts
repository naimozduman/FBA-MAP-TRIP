import { cityById } from "./data";
import type { Trip, Visit } from "./types";
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
export const money2 = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
export const duration = (m: number) =>
  m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;
export const dayLabel = (d: string) =>
  d
    ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not scheduled";
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function milesBetween(a: string, b: string) {
  const p = cityById[a],
    q = cityById[b];
  if (!p || !q) return 0;
  const rad = Math.PI / 180;
  const dlat = (q.lat - p.lat) * rad,
    dlng = (q.lng - p.lng) * rad;
  const n =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(p.lat * rad) * Math.cos(q.lat * rad) * Math.sin(dlng / 2) ** 2;
  return 3959 * 2 * Math.atan2(Math.sqrt(n), Math.sqrt(1 - n));
}
export function estimateMiles(stops: string[], back: string[] = []) {
  const all = ["stl", ...stops, ...back, "stl"];
  return Math.round(
    all.slice(1).reduce((s, id, i) => s + milesBetween(all[i], id), 0) * 1.25,
  );
}
export function travelCost(t: Trip) {
  return (t.miles / t.mpg) * t.gasPrice + t.hotel + t.tolls + t.other;
}
export function tripMetrics(t: Trip, all: Visit[]) {
  const v = all.filter((v) => v.tripId === t.id);
  const books = v.reduce((s, x) => s + x.books, 0);
  const hours = v.reduce((s, x) => s + x.hours, 0);
  const contribution = v.reduce((s, x) => s + x.books * x.contribution, 0);
  const net = contribution - travelCost(t) - t.processing - hours * t.laborRate;
  return {
    visits: v,
    books,
    hours,
    contribution,
    net,
    spend: v.reduce((s, x) => s + x.spend, 0),
    totalHours: t.hours || hours,
  };
}

export function newId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const s = Array.from(b, (n) => n.toString(16).padStart(2, "0")).join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}
