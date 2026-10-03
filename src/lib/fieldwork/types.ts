export type City = {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  minutes: number;
};
export type Corridor = {
  id: number;
  name: string;
  direction: string;
  anchor: string;
  minutes: number;
  format: "Day trip" | "Long day" | "Overnight";
  cities: string[];
  summary: string;
  reasons: { title: string; body: string }[];
  targets: string[];
  hypothesis: string;
  strategy: string;
};
export type Trip = {
  actualBookProfit?: number | null;
  actualTravelCost?: number | null;
  actualProcessingCost?: number | null;
  actualSourcingLaborCost?: number | null;
  actualTripHours?: number | null;
  id: string;
  routeId: number;
  title: string;
  date: string;
  endDate: string;
  reason: string;
  people: string;
  vehicle: string;
  status: "planned" | "active" | "complete";
  stops: string[];
  returnStops: string[];
  miles: number;
  mpg: number;
  gasPrice: number;
  hotel: number;
  tolls: number;
  other: number;
  expectedBooks: number;
  contribution: number;
  hours: number;
  processing: number;
  laborRate: number;
  notes: string;
};
export type Visit = {
  arrivalTime?: string;
  departureTime?: string;
  projectedRevenue?: number | null;
  projectedAmazonFees?: number | null;
  projectedProfit?: number | null;
  booksRejected?: number | null;
  rejectionReason?: string;
  scannersObserved?: number | null;
  stockPicked?: "unknown" | "fresh" | "picked";
  restockFrequency?: string;
  organizerContact?: string;
  acceptsBulk?: "unknown" | "yes" | "no";
  nextRestockDate?: string;
  quality?: Partial<Record<QualityDimension, { score: number | null; raw: string }>>;
  id: string;
  routeId: number;
  tripId: string | null;
  cityId: string;
  sourceId: string | null;
  sourceName: string;
  sourceType: string;
  date: string;
  books: number;
  scanned: number | null;
  spend: number;
  hours: number;
  contribution: number;
  competition: number | null;
  notes: string;
};
export type Source = {
  historical?: boolean;
  inventoryClass?: number | null;
  revisitCadence?: string;
  exclusionOverrideReason?: string;
  id: string;
  routeId: number;
  cityId: string;
  name: string;
  type: string;
  address: string;
  hours: string;
  pricing: string;
  contact: string;
  url: string;
  scanPolicy: "Unknown" | "Allowed" | "Prohibited";
  notes: string;
  verifiedAt: string;
  nextDate: string;
  endDate: string;
};
export type Settings = {
  id: "preferences";
  vehicle: string;
  mpg: number;
  gasPrice: number;
  contribution: number;
  people: string;
};
export type Kind = "trip" | "visit" | "source" | "settings";
export type RecordData = Trip | Visit | Source | Settings;
export type StoredRecord = {
  id: string;
  kind: Kind;
  revision: number;
  data: RecordData;
};
export type Pane = "map" | "routes" | "trips" | "insights";
export const qualityDimensions = ["volume", "profitability", "price", "restock_frequency", "competition", "relationship_potential", "accessibility_loading"] as const;
export type QualityDimension = typeof qualityDimensions[number];
export const defaultSettings: Settings = {
  id: "preferences",
  vehicle: "Ford Explorer",
  mpg: 20,
  gasPrice: 3.5,
  contribution: 8,
  people: "Naim & Kerem",
};
