import type { SupabaseClient } from "@supabase/supabase-js";
import type { City, WorkspaceData } from "@/lib/model";
import { pointSchema, tripSchema } from "@/lib/model";
import { provisionalBase } from './base';
export async function workspaceData(client: SupabaseClient, workspaceId: string): Promise<WorkspaceData> {
  const tables = ["cities", "sources", "food_places", "source_visits", "trips", "workspace_members", "workspace_settings", "profiles", "vehicles", "source_events", "notes", "corridors", "corridor_cities"] as const;
  const results = await Promise.all(tables.map(table => table === "profiles" ? client.from(table).select("*") : client.from(table).select("*").eq("workspace_id", workspaceId)));
  if (results.some(r => r.error)) throw new Error("Workspace data could not be read.");
  const [cities, sources, food, visits, trips, members, settings, profiles, vehicles, events, notes, corridors, corridorCities] = results.map(r => r.data || []);
  return {
    workspaceId, vehicles, events, notes, corridors, corridorCities,
    cities: cities.map(c => ({ id: c.id, name: c.name, state: c.state, zone: c.zone, lat: c.lat, lng: c.lng, overview: c.overview, provenance: c.provenance, corridor: c.corridor })) as City[],
    sources, food, visits,
    trips: trips.map(t => tripSchema.parse(t.draft)),
    members: members.filter(m => m.active).map(m => ({ user_id: m.user_id, role: m.role, display_name: profiles.find(p => p.id === m.user_id)?.display_name || "Workspace member" })),
    origin: pointSchema.safeParse(settings[0]?.origin).success ? pointSchema.parse(settings[0].origin) : provisionalBase
  };
}
