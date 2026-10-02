import type { RouteResult, TripDraft } from "@/lib/model";
import { routeWaypoints } from "@/lib/planning/schedule";
import { routeRevision } from './revision';
export async function calculateRoadRoute(trip: TripDraft, token: string | undefined, request: typeof fetch = fetch): Promise<RouteResult> {
  const revision = routeRevision(trip);
  const unavailable = (reason: string): RouteResult => ({ status: "unavailable", revision, legs: [], reason });
  if (!token) return unavailable("Route unavailable: Mapbox Directions is not configured.");
  let points: ReturnType<typeof routeWaypoints>;
  try { points = routeWaypoints(trip); } catch(e) { return unavailable("Route unavailable: " + (e instanceof Error ? e.message : "invalid points")); }
  if (points.length > 120) return unavailable("Route unavailable: this itinerary exceeds the application's bounded route size.");
  const legs: RouteResult["legs"] = [];
  const totalDeadline = AbortSignal.timeout(45000);
  try {
    for (let offset = 0; offset < points.length - 1; offset += 9) {
      const chunk = points.slice(offset, offset + 10);
      const coordinates = chunk.map(p => p.point.lng + "," + p.point.lat).join(";");
      const url = new URL("https://api.mapbox.com/directions/v5/mapbox/driving/" + coordinates);
      url.searchParams.set("access_token", token);
      url.searchParams.set("geometries", "geojson");
      url.searchParams.set("overview", "full");
      url.searchParams.set("steps", "true");
      const response = await request(url, { cache: "no-store", signal: AbortSignal.any([totalDeadline, AbortSignal.timeout(12000)]) });
      if (!response.ok) return unavailable(response.status === 429 ? "Route unavailable: provider rate limit reached." : "Route unavailable: provider request failed.");
      const payload = await response.json() as { code?: string; waypoints?: { location: number[]; distance?: number }[]; routes?: { legs?: { duration: number; distance: number; steps?: { geometry?: { coordinates?: [number, number][] } }[] }[] }[] };
      if (payload.code !== "Ok") return unavailable("Route unavailable: no driving route returned.");
      if (!payload.waypoints || payload.waypoints.length !== chunk.length || payload.waypoints.some(p => p.distance === undefined || !Number.isFinite(p.distance) || p.distance > 500)) return unavailable("Route unavailable: road access snapping could not be verified. Confirm the address.");
      const returned = payload.routes?.[0]?.legs;
      if (!returned || returned.length !== chunk.length - 1) return unavailable("Route unavailable: incomplete route legs.");
      returned.forEach((leg, i) => {
        const geometry = (leg.steps || []).flatMap(s => s.geometry?.coordinates || []);
        if (geometry.length < 2 || !Number.isFinite(leg.duration) || leg.duration < 0 || !Number.isFinite(leg.distance) || leg.distance < 0 || geometry.some(p => p.length !== 2 || !p.every(Number.isFinite) || Math.abs(p[0])>180 || Math.abs(p[1])>90)) throw new Error("invalid provider geometry");
        legs.push({ from: chunk[i].point.id, to: chunk[i + 1].point.id, seconds: leg.duration, meters: leg.distance, geometry, kind: chunk[i + 1].kind, provider: "mapbox", fetchedAt: new Date().toISOString() });
      });
    }
    return { status: "available", revision, legs, reason: null };
  } catch { return unavailable("Route unavailable: provider timeout, network or invalid response."); }
}
