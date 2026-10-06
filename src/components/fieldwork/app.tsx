"use client";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Map as MapIcon,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings as SettingsIcon,
  WifiOff,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/fieldwork/primitives/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/fieldwork/primitives/dropdown-menu";
import { Toaster } from "@/components/fieldwork/primitives/sonner";
import { cities, corridors, routeById } from "@/lib/fieldwork/data";
import type { Pane, Source, Trip, Visit } from "@/lib/fieldwork/types";
import { Action, IconAction } from "./ui";
import { useWorkspace } from "./use-workspace";
import TerritoryMap from "./territory-map";
import ExplorePanel from "./explore-panel";
import { PlaceDetail, RouteDetail } from "./route-detail";
import RouteLibrary from "./route-library";
import TripsView from "./trips-view";
import InsightsView from "./insights-view";
import TripPlanner from "./trip-planner";
import VisitDialog from "./visit-dialog";
import SourceDialog from "./source-dialog";
import SettingsDialog from "./settings-dialog";
import RemoveDialog from "./remove-dialog";
export default function FieldworkApp() {
  const workspace = useWorkspace();
  const [pane, setPane] = useState<Pane>("map"),
    [routeId, setRouteId] = useState(4),
    [detailOpen, setDetailOpen] = useState(false),
    [cityId, setCityId] = useState<string | null>(null),
    [selectedTripId, setSelectedTripId] = useState<string | null>(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All");
  const [plannerOpen, setPlannerOpen] = useState(false),
    [plannerCityId, setPlannerCityId] = useState<string | null>(null),
    [plannerInitial, setPlannerInitial] = useState<Trip | null>(null),
    [visitOpen, setVisitOpen] = useState(false),
    [visitInitial, setVisitInitial] = useState<Visit | null>(null),
    [visitSource, setVisitSource] = useState<Source | null>(null),
    [visitTripId, setVisitTripId] = useState<string | null>(null),
    [visitCity, setVisitCity] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false),
    [sourceInitial, setSourceInitial] = useState<Source | null>(null),
    [settingsOpen, setSettingsOpen] = useState(false),
    [removeId, setRemoveId] = useState<string | null>(null),
    [mobileSearch, setMobileSearch] = useState(false);
  const route = routeById[routeId],
    trip = workspace.trips.find((t) => t.id === selectedTripId) ?? null;
  const chooseRoute = (id: number) => {
    setRouteId(id);
    setCityId(null);
    setSelectedTripId(null);
    setDetailOpen(true);
    setPane("map");
    setMobileSearch(false);
  };
  const chooseCity = (id: string) => {
    const match = route.cities.includes(id)
      ? route
      : corridors.find((r) => r.cities.includes(id));
    if (match) {
      setRouteId(match.id);
      if (match.id !== routeId) setSelectedTripId(null);
    }
    setCityId(id);
    setDetailOpen(true);
    setPane("map");
    setMobileSearch(false);
  };
  const plan = (id = routeId, t: Trip | null = null, selectedCity: string | null = null) => {
    setPlannerCityId(selectedCity);
    setRouteId(id);
    setPlannerInitial(t);
    setPlannerOpen(true);
  };
  const log = (
    s: Source | null = null,
    t: Trip | null = trip,
    v: Visit | null = null,
  ) => {
    if (s) setRouteId(s.routeId);
    if (t) setRouteId(t.routeId);
    if (v) setRouteId(v.routeId);
    setVisitSource(s);
    setVisitTripId(t?.id ?? null);
    setVisitCity(s?.cityId ?? v?.cityId ?? cityId);
    setVisitInitial(v);
    setVisitOpen(true);
  };
  const showSource = (s: Source) => {
    setSourceInitial(s);
    setSourceOpen(true);
  };
  const addSource = () => {
    setSourceInitial(null);
    setSourceOpen(true);
  };
  const showTrip = (t: Trip) => {
    setRouteId(t.routeId);
    setSelectedTripId(t.id);
    setCityId(null);
    setDetailOpen(true);
    setPane("map");
  };
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => Promise<void> | void;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const register = (tool: unknown) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: controller.signal }),
        ).catch((e) => console.error("Fieldwork tool registration failed", e));
      } catch (e) {
        console.error("Fieldwork tool registration failed", e);
      }
    };
    register({
      name: "get_sourcing_territory",
      title: "Read sourcing territory",
      description:
        "Read Fieldwork's 15 corridors and town-center places. Times are approximate and paths are planning sketches.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({
        corridors: corridors.map((r) => ({
          id: r.id,
          name: r.name,
          direction: r.direction,
          anchor: r.anchor,
          minutes: r.minutes,
          format: r.format,
          cities: r.cities,
        })),
        places: cities,
      }),
    });
    register({
      name: "start_trip_plan",
      title: "Start a trip plan",
      description:
        "Open the visible trip planner for a corridor. This stages a draft and does not save a trip.",
      inputSchema: {
        type: "object",
        properties: { routeId: { type: "integer", minimum: 1, maximum: 15 } },
        required: ["routeId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input: unknown) => {
        if (
          !input ||
          typeof input !== "object" ||
          !("routeId" in input) ||
          typeof input.routeId !== "number" ||
          !Number.isInteger(input.routeId) ||
          !routeById[input.routeId] ||
          Object.keys(input).length !== 1
        )
          throw new Error("Choose a routeId from 1 to 15.");
        setRouteId(input.routeId);
        setPlannerInitial(null);
        setPlannerOpen(true);
        return { staged: true, routeId: input.routeId, saved: false };
      },
    });
    return () => controller.abort();
  }, []);
  return (
    <div className="fieldwork-app">
      <header className="app-header">
        <button
          type="button"
          className="wordmark"
          onClick={() => setPane("map")}
          aria-label="Fieldwork home"
        >
          <BookOpen strokeWidth={1.5} />
          <span>Fieldwork</span>
        </button>
        <div className="header-actions">
          <span className="home-base">
            <MapPin size={18} />
            St. Louis, MO
          </span>
          <span className="storage-label" title="Trips, visits and sources save in this browser">{workspace.loading ? "Loading records…" : workspace.error ? "Storage unavailable" : "Saved on this device"}</span>
          <Action
            variant="outline"
            onClick={() => log()}
            disabled={workspace.loading || !!workspace.error}
            className="header-log"
          >
            Log visit
          </Action>
          <Action onClick={() => plan()} className="header-plan" disabled={workspace.loading || !!workspace.error}>
            Plan trip
          </Action>
          <IconAction
            label="Workspace settings"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon />
          </IconAction>
        </div>
      </header>
      {workspace.error && (
        <div className="connection-strip" role="alert">
          <WifiOff size={16} />
          <span>{workspace.error}</span>
          <button type="button" onClick={() => void workspace.reload()}>
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}
      <Tabs
        id="main"
        className="main-tabs"
        value={pane}
        onValueChange={(v) => setPane(v as Pane)}
      >
        <TabsContent value="map" className="map-page" forceMount>
          <TerritoryMap
            route={detailOpen ? route : null}
            trip={trip}
            cityId={cityId}
            onCity={chooseCity}
            onRoute={chooseRoute}
            showAll={false}
          />
          <ExplorePanel
            selectedId={detailOpen ? routeId : null}
            query={query}
            setQuery={setQuery}
            filter={filter}
            setFilter={setFilter}
            onRoute={chooseRoute}
            onCity={chooseCity}
          />
          <div className="mobile-search">
            <button
              type="button"
              onClick={() => setMobileSearch((v) => !v)}
              aria-expanded={mobileSearch}
            >
              <Search size={18} />
              <span>Search routes or places</span>
            </button>
          </div>
          {mobileSearch && (
            <div className="mobile-search-panel">
              <ExplorePanel
                selectedId={routeId}
                query={query}
                setQuery={setQuery}
                filter={filter}
                setFilter={setFilter}
                onRoute={chooseRoute}
                onCity={chooseCity}
              />
            </div>
          )}
          {detailOpen &&
            (cityId ? (
              <PlaceDetail
                cityId={cityId}
                route={route}
                sources={workspace.sources}
                visits={workspace.visits}
                onClose={() => {
                  setCityId(null);
                  setDetailOpen(false);
                }}
                onLog={(s) => log(s ?? null)}
                onSource={showSource}
                onAddSource={addSource}
                onPlan={() => plan(routeId, null, cityId)}
              />
            ) : (
              <RouteDetail
                route={route}
                trip={trip}
                sources={workspace.sources}
                onClose={() => setDetailOpen(false)}
                onPlan={() => plan(routeId, trip)}
                onLog={() => log()}
                onCity={chooseCity}
              />
            ))}
          <div className="mobile-map-caption">
            Planning sketches · {cities.length - 1} places
          </div>
        </TabsContent>
        <TabsContent value="routes" className="content-page">
          <RouteLibrary
            onRoute={chooseRoute}
            onPlan={(id) => plan(id)}
            onSource={showSource}
            onAddSource={addSource}
            sources={workspace.sources}
          />
        </TabsContent>
        <TabsContent value="trips" className="content-page">
          <TripsView
            workspace={workspace}
            onPlan={(t) => plan(t?.routeId ?? routeId, t ?? null)}
            onMap={showTrip}
            onLog={(t) => log(null, t ?? null)}
            onEditVisit={(v) => log(null, null, v)}
            onRemove={setRemoveId}
          />
        </TabsContent>
        <TabsContent value="insights" className="content-page">
          <InsightsView
            workspace={workspace}
            onLog={() => log()}
            onRoute={chooseRoute}
          />
        </TabsContent>
        <nav className="bottom-dock" aria-label="Main navigation">
          <TabsList className="dock-tabs">
            {[
              { id: "map", label: "Map", Icon: MapIcon },
              { id: "routes", label: "Routes", Icon: Route },
              { id: "trips", label: "Trips", Icon: CalendarDays },
              { id: "insights", label: "Insights", Icon: BarChart3 },
            ].map(({ id, label, Icon }) => (
              <TabsTrigger className="dock-tab" key={id} value={id}>
                <Icon strokeWidth={1.7} />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="dock-divider" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="dock-add"
                aria-label="Add trip, visit or source"
              >
                <Plus />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="end"
              sideOffset={18}
              className="quick-menu"
            >
              <DropdownMenuItem onClick={() => plan()}>
                <CalendarDays size={18} />
                Plan trip
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => log()}>
                <BookOpen size={18} />
                Log visit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={addSource}>
                <MapPin size={18} />
                Add source
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </Tabs>
      {plannerOpen && !workspace.loading && (
        <TripPlanner
          open={plannerOpen}
          onClose={() => setPlannerOpen(false)}
          initial={plannerInitial}
          cityId={plannerCityId}
          routeId={routeId}
          workspace={workspace}
          onSaved={showTrip}
        />
      )}
      {visitOpen && !workspace.loading && (
        <VisitDialog
          open={visitOpen}
          onClose={() => setVisitOpen(false)}
          initial={visitInitial}
          routeId={routeId}
          cityId={visitCity}
          source={visitSource}
          tripId={visitTripId}
          workspace={workspace}
        />
      )}
      {sourceOpen && !workspace.loading && (
        <SourceDialog
          open={sourceOpen}
          onClose={() => setSourceOpen(false)}
          initial={sourceInitial}
          cityId={cityId}
          routeId={routeId}
          workspace={workspace}
          onLog={(s) => {
            setSourceOpen(false);
            log(s);
          }}
          onDelete={(id) => {
            setSourceOpen(false);
            setRemoveId(id);
          }}
        />
      )}
      {settingsOpen && !workspace.loading && (
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          workspace={workspace}
        />
      )}
      <RemoveDialog
        id={removeId}
        onClose={() => {
          setRemoveId(null);
        }}
        workspace={workspace}
      />
      <Toaster position="top-center" richColors theme="light" />
    </div>
  );
}
