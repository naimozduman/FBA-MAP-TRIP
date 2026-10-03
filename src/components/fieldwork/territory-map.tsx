"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layers, LocateFixed, Minus, Plus } from "lucide-react";
import type * as Leaflet from "leaflet";
import type { Corridor, Trip } from "@/lib/fieldwork/types";
import { cities, cityById, corridors } from "@/lib/fieldwork/data";
import { IconAction } from "./ui";
type Props = {
  route: Corridor | null;
  trip: Trip | null;
  cityId: string | null;
  onCity: (id: string) => void;
  onRoute: (id: number) => void;
  showAll: boolean;
};
export default function TerritoryMap({
  route,
  trip,
  cityId,
  onCity,
  onRoute,
  showAll,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<Leaflet.Map | null>(null),
    lib = useRef<typeof Leaflet | null>(null),
    lines = useRef<Leaflet.LayerGroup | null>(null),
    markers = useRef<Leaflet.LayerGroup | null>(null),
    tiles = useRef<Leaflet.TileLayer | null>(null),
    previousSelection = useRef<string | null>(null);
  const handlers = useRef({ onCity, onRoute });
  useEffect(() => {
    handlers.current = { onCity, onRoute };
  }, [onCity, onRoute]);
  const [ready, setReady] = useState(false),
    [streets, setStreets] = useState(true),
    [tileFail, setTileFail] = useState(false),
    [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let disposed = false;
    void (async () => {
      try {
        const L = await import("leaflet");
        if (disposed || !host.current) return;
        lib.current = L;
        const m = L.map(host.current, {
          zoomControl: false,
          attributionControl: true,
          minZoom: 5,
          maxZoom: 14,
          zoomSnap: 0.25,
          scrollWheelZoom: true,
        }).setView([38.3, -91.8], 7.25);
        if (m.getSize().x < 700) m.setView([40.9, -90], 5);
        map.current = m;
        m.attributionControl.setPrefix(false);
        const response = await fetch("/map/midwest.json");
        const data = (await response.json()) as Parameters<typeof L.geoJSON>[0];
        if (disposed) return;
        m.createPane("atlas");
        m.getPane("atlas")!.style.zIndex = "100";
        L.geoJSON(data, {
          pane: "atlas",
          interactive: false,
          style: {
            color: "#cacdc0",
            weight: 1,
            fillColor: "#e9ebe2",
            fillOpacity: 1,
          },
        }).addTo(m);
        m.attributionControl.addAttribution(
          '<a href="https://github.com/topojson/us-atlas" target="_blank" rel="noopener noreferrer">US Atlas / Census</a>',
        );
        const tile = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
            maxZoom: 18,
            opacity: 0.78,
          },
        ).addTo(m);
        tile.on("tileerror", () => {
          if (!disposed) setTileFail(true);
        });
        tile.on("tileload", () => {
          if (!disposed) setTileFail(false);
        });
        tiles.current = tile;
        lines.current = L.layerGroup().addTo(m);
        markers.current = L.layerGroup().addTo(m);
        L.control
          .scale({ position: "bottomright", imperial: true, metric: false })
          .addTo(m);
        for (const [name, lat, lng] of [
          ["MISSOURI", 38.35, -92.65],
          ["ILLINOIS", 40.1, -89.6],
          ["INDIANA", 40.2, -86.5],
          ["KANSAS", 38.5, -96.5],
          ["IOWA", 41.1, -93.2],
          ["KENTUCKY", 37.3, -86.1],
          ["ARKANSAS", 35.5, -92.7],
          ["TENNESSEE", 35.6, -88.7],
          ["OKLAHOMA", 36, -95.9],
        ] as [string, number, number][]) {
          L.marker([lat, lng], {
            interactive: false,
            keyboard: false,
            icon: L.divIcon({
              className: "state-label",
              html: name,
              iconSize: [120, 18],
              iconAnchor: [60, 9],
            }),
          }).addTo(m);
        }
        setReady(true);
        const observer = new ResizeObserver(() => m.invalidateSize());
        observer.observe(host.current);
        m.on("unload", () => observer.disconnect());
      } catch (e) {
        console.error("Map setup failed", e);
        if (!disposed) setLoadError(true);
      }
    })();
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current,
      t = tiles.current;
    if (!m || !t) return;
    if (streets) t.addTo(m);
    else m.removeLayer(t);
  }, [streets, ready]);
  useEffect(() => {
    const m = map.current,
      L = lib.current,
      g = lines.current,
      p = markers.current;
    if (!ready || !m || !L || !g || !p) return;
    g.clearLayers();
    p.clearLayers();
    if (showAll)
      corridors.forEach((r) => {
        if (r.id === route?.id) return;
        const coords = ["stl", ...r.cities].map(
          (id) => [cityById[id].lat, cityById[id].lng] as [number, number],
        );
        L.polyline(coords, {
          color: "#89947d",
          weight: 1.4,
          opacity: 0.28,
          interactive: true,
        })
          .on("click", () => handlers.current.onRoute(r.id))
          .addTo(g);
      });
    const stops =
        trip?.stops ??
        (route?.id === 4
          ? ["fulton", "columbia", "jefferson-city"]
          : (route?.cities ?? [])),
      back = trip?.returnStops ?? [];
    const selected = new Set(stops);
    if (stops.length) {
      const out = ["stl", ...stops];
      L.polyline(
        out.map(
          (id) => [cityById[id].lat, cityById[id].lng] as [number, number],
        ),
        { color: "#da6547", weight: 3.5, opacity: 1, interactive: false },
      ).addTo(g);
      const ret = [stops[stops.length - 1], ...back, "stl"];
      L.polyline(
        ret.map(
          (id) => [cityById[id].lat, cityById[id].lng] as [number, number],
        ),
        {
          color: "#687759",
          weight: 3,
          dashArray: "6 7",
          opacity: 0.85,
          interactive: false,
        },
      ).addTo(g);
    }
    const anchors = new Set(corridors.map((r) => r.anchor));
    for (const c of cities) {
      const base = c.id === "stl",
        active = selected.has(c.id) || back.includes(c.id),
        focus = c.id === cityId;
      const icon = L.divIcon({
        className: "map-pin-host",
        html: `<span class="map-pin ${base ? "base" : active ? "selected" : ""} ${focus ? "focused" : ""}">${base ? "<span></span>" : ""}</span>`,
        iconSize: base ? [24, 24] : active ? [14, 14] : [9, 9],
        iconAnchor: base ? [12, 12] : active ? [7, 7] : [4.5, 4.5],
      });
      const marker = L.marker([c.lat, c.lng], {
        icon,
        keyboard: true,
        title: `${c.name}, ${c.state}`,
        zIndexOffset: base ? 1000 : active ? 500 : 0,
      })
        .on("click", () => handlers.current.onCity(c.id))
        .addTo(p);
      const element = marker.getElement();
      if (element) {
        element.setAttribute("aria-label", `Explore city ${c.name}, ${c.state}`);
        element.setAttribute("data-city-id", c.id);
        const activate = (event: Event) => {
          const key = (event as KeyboardEvent).key;
          if (key !== "Enter" && key !== " ") return;
          L.DomEvent.stop(event);
          handlers.current.onCity(c.id);
        };
        L.DomEvent.on(element, "keydown", activate);
        marker.on("remove", () => L.DomEvent.off(element, "keydown", activate));
      }
      if (anchors.has(c.id) || base || active || focus)
        marker.bindTooltip(
          `${c.name}${c.id.startsWith("springfield") ? ` ${c.state}` : ""}`,
          {
            permanent: true,
            direction: active || base ? "right" : "top",
            offset: active || base ? [12, 0] : [0, -5],
            className: `map-label ${base ? "base-label" : ""}`,
          },
        );
    }
  }, [ready, route, trip, cityId, showAll]);
  const fit = useCallback(() => {
    const m = map.current;
    if (!m) return;
    const width = m.getSize().x;
    if (cityId && !trip) {
      const city = cityById[cityId];
      const panel = document.querySelector(".place-detail")?.getBoundingClientRect();
      const mapTop = host.current?.getBoundingClientRect().top ?? 64;
      const bottom = width < 700 && panel ? Math.max(120, m.getSize().y - (panel.top - mapTop) + 24) : 130;
      m.fitBounds([[cityById.stl.lat, cityById.stl.lng], [city.lat, city.lng]], {
        paddingTopLeft: width > 1100 ? [370, 55] : [28, 78],
        paddingBottomRight: width > 1100 ? [345, 130] : [28, bottom],
        maxZoom: 8,
      });
    } else if (trip || route) {
      const pts = [
        "stl",
        ...(trip?.stops ?? route!.cities),
        ...(trip?.returnStops ?? []),
      ].map((id) => [cityById[id].lat, cityById[id].lng] as [number, number]);
      m.fitBounds(pts, {
        paddingTopLeft: width > 1100 ? [370, 55] : [28, 78],
        paddingBottomRight: width > 1100 ? [345, 130] : [28, 390],
        maxZoom: 8,
      });
    } else
      m.setView(
        width < 700 ? [40.9, -90] : [38.3, -91.8],
        width < 700 ? 5 : 7.25,
      );
  }, [route, trip, cityId]);
  const selection = trip?.id ?? (cityId ? `city:${cityId}` : String(route?.id ?? "all"));
  const hasTrip = Boolean(trip);
  useEffect(() => {
    if (!ready) return;
    if (previousSelection.current === null && !hasTrip) {
      previousSelection.current = selection;
      return;
    }
    if (previousSelection.current === selection) return;
    previousSelection.current = selection;
    fit();
  }, [selection, hasTrip, ready, fit]);
  return (
    <div className="map-wrap">
      <div
        ref={host}
        className="territory-map"
        aria-label="Interactive sourcing map of the Midwest"
      />
      {loadError && (
        <div className="map-error">
          <p>The map is unavailable.</p>
          <p>Your routes and trip records remain accessible below.</p>
        </div>
      )}
      <div className="map-tools">
        <IconAction label="Zoom in" onClick={() => map.current?.zoomIn(0.5)}>
          <Plus />
        </IconAction>
        <IconAction label="Zoom out" onClick={() => map.current?.zoomOut(0.5)}>
          <Minus />
        </IconAction>
        <IconAction label="Fit territory or trip" onClick={fit}>
          <LocateFixed />
        </IconAction>
        <IconAction
          label={streets ? "Use atlas map" : "Use street map"}
          aria-pressed={!streets}
          onClick={() => setStreets((s) => !s)}
        >
          <Layers />
        </IconAction>
      </div>
      <div className="map-legend">
        <span>
          <i />
          Selected sketch
        </span>
        <span>
          <i className="return" />
          Return sketch
        </span>
        <small>
          Corridors are planning sketches.
          {tileFail && streets ? " Atlas view available." : ""}
        </small>
      </div>
    </div>
  );
}
