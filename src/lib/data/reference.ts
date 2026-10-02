import type { City, WorkspaceData } from "@/lib/model";
import { provisionalBase } from './base';
// Reconstructed references from the handoff territory, not recovered legacy records.
// Coordinates are rounded city-centre references, never store navigation or a private home pin.
const reference = "Fieldwork handoff territory narrative; approximate city reference, not a legacy import.";
export const referenceCities: City[] = [
  { id: "columbia-mo", name: "Columbia", state: "MO", zone: "America/Chicago", lat: 38.95, lng: -92.33, overview: "A Missouri city in the Central Missouri sourcing territory.", provenance: reference, corridor: "Central Missouri" },
  { id: "rolla-mo", name: "Rolla", state: "MO", zone: "America/Chicago", lat: 37.95, lng: -91.77, overview: "A city on the I-44 sourcing corridor.", provenance: reference, corridor: "I-44" },
  { id: "springfield-mo", name: "Springfield", state: "MO", zone: "America/Chicago", lat: 37.21, lng: -93.29, overview: "A southwest Missouri city in the Ozarks sourcing territory.", provenance: reference, corridor: "Ozarks" },
  { id: "kansas-city-mo", name: "Kansas City", state: "MO", zone: "America/Chicago", lat: 39.10, lng: -94.58, overview: "A Missouri metro and a reference for the western sourcing territory.", provenance: reference, corridor: "Western territory" },
  { id: "quincy-il", name: "Quincy", state: "IL", zone: "America/Chicago", lat: 39.94, lng: -91.41, overview: "An Illinois city in the Hannibal / Quincy territory.", provenance: reference, corridor: "Hannibal / Quincy" },
  { id: "indianapolis-in", name: "Indianapolis", state: "IN", zone: "America/Indiana/Indianapolis", lat: 39.77, lng: -86.16, overview: "An Indiana city in the eastern sourcing territory. Local time differs from the Missouri base.", provenance: reference, corridor: "Eastern territory" }
];
export const previewData: WorkspaceData = {
  workspaceId: null, vehicles: [], events: [], notes: [], corridors: [], corridorCities: [], cities: referenceCities, sources: [], food: [], visits: [], trips: [], origin: provisionalBase,
  members: [
    { user_id: "preview-naim", display_name: "Naim", role: "owner" },
    { user_id: "preview-kerem", display_name: "Kerem", role: "partner" }
  ]
};
