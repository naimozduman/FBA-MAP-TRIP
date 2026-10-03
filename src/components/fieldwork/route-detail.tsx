"use client";
import { BookOpen, MapPin, Plus, X } from "lucide-react";
import { cityById } from "@/lib/fieldwork/data";
import type { Corridor, Source, Trip, Visit } from "@/lib/fieldwork/types";
import { dayLabel, duration } from "@/lib/fieldwork/math";
import { Action, IconAction, RouteFacts } from "./ui";
import { useEffect, useRef } from "react";
import CityBrief from "./city-brief";
import { sourceExclusion } from "@/lib/fieldwork/brief";
export function RouteDetail({
  route,
  trip,
  onClose,
  onPlan,
  onLog,
  onCity,
  sources,
}: {
  route: Corridor;
  trip: Trip | null;
  onClose: () => void;
  onPlan: () => void;
  onLog: () => void;
  onCity: (id: string) => void;
  sources: Source[];
}) {
  const stops =
      trip?.stops ??
      (route.id === 4
        ? ["fulton", "columbia", "jefferson-city"]
        : route.cities),
    back = trip?.returnStops ?? [];
  const routeSources = sources.filter((s) => s.routeId === route.id);
  return (
    <aside className="route-detail paper-panel">
      <div className="mobile-handle" />
      <div className="detail-head">
        <h2>{trip?.title ?? route.name}</h2>
        <IconAction label="Close route details" onClick={onClose}>
          <X size={20} />
        </IconAction>
      </div>
      <p className="route-summary">{route.summary}</p>
      <RouteFacts route={route} trip={trip} />
      <div className="mobile-stopline">
        <span>
          <i />
          St. Louis
        </span>
        {stops.slice(0, 3).map((id) => (
          <span key={id}>
            <i />
            {cityById[id].name}
          </span>
        ))}
        <span>
          <i />
          Home
        </span>
      </div>
      <p className="mobile-route-blurb">
        {route.reasons.map((r) => r.title).join(", ")}.{" "}
        {stops.length > 3
          ? `${stops.length} outbound stops in this corridor.`
          : ""}
      </p>
      <div className="detail-scroll">
        <section className="reason-list">
          <h3>Why this route</h3>
          {route.reasons.map((r, i) => (
            <div className="reason" key={r.title}>
              <span>{i + 1}</span>
              <div>
                <strong>{r.title}</strong>
                <p>{r.body}</p>
              </div>
            </div>
          ))}
        </section>
        <section className="stop-section">
          <h3>{trip ? "Planned stops" : "Route stops"}</h3>
          <ol className="stop-list">
            <li>
              <span className="stop-dot base" />
              <div>
                <strong>St. Louis</strong>
                <small>Start · your home base</small>
              </div>
            </li>
            {stops.map((id, i) => {
              const c = cityById[id];
              return (
                <li key={id}>
                  <span className="stop-dot" />
                  <button type="button" onClick={() => onCity(id)}>
                    <strong>{c.name}</strong>
                    <small>
                      {duration(c.minutes)} from base · {c.state}
                    </small>
                  </button>
                  <span className="stop-counter">{i + 1}</span>
                </li>
              );
            })}
            {back.map((id) => (
              <li key={id} className="return-stop">
                <span className="stop-dot" />
                <button type="button" onClick={() => onCity(id)}>
                  <strong>{cityById[id].name}</strong>
                  <small>Return stop</small>
                </button>
              </li>
            ))}
            <li className="return-stop">
              <span className="stop-dot" />
              <div>
                <strong>Return to St. Louis</strong>
                <small>
                  {trip ? dayLabel(trip.endDate) : "Direct return shown on map"}
                </small>
              </div>
            </li>
          </ol>
        </section>
        {routeSources.length > 0 && (
          <section className="detail-source-list">
            <h3>Source leads</h3>
            {routeSources.map((s) => (
              <button type="button" key={s.id} onClick={() => onCity(s.cityId)}>
                <BookOpen size={17} />
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.nextDate ? dayLabel(s.nextDate) : s.type}</small>
                </span>
              </button>
            ))}
          </section>
        )}
        <p className="strategy-note">{route.strategy}</p>
      </div>
      <div className="detail-actions">
        <Action variant="outline" className="mobile-log" onClick={onLog}>
          Log visit
        </Action>
        <Action onClick={onPlan}>
          <BookOpen size={20} />
          {trip ? "Edit this trip" : "Build this trip"}
        </Action>
      </div>
    </aside>
  );
}
export function PlaceDetail({
  cityId,
  route,
  sources,
  visits,
  onClose,
  onLog,
  onSource,
  onAddSource,
  onPlan,
}: {
  cityId: string;
  route: Corridor;
  sources: Source[];
  visits: Visit[];
  onClose: () => void;
  onLog: (source?: Source) => void;
  onSource: (s: Source) => void;
  onAddSource: () => void;
  onPlan: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    heading.current?.focus();
    return () => previous?.focus();
  }, [cityId]);
  const city = cityById[cityId],
    local = sources.filter((s) => s.cityId === cityId),
    history = visits.filter((v) => v.cityId === cityId);
  return (
    <aside className="route-detail place-detail paper-panel" aria-label="City details" data-testid="original-city-panel">
      <div className="mobile-handle" />
      <div className="detail-head">
        <h2 ref={heading} tabIndex={-1}>{city.name}, {city.state}</h2>
        <IconAction label="Close place details" onClick={onClose}>
          <X size={20} />
        </IconAction>
      </div>
      <p className="route-summary">
        Approx. {duration(city.minutes)} from St. Louis · historical estimate
      </p>
      <div className="route-facts">
        <span>
          <MapPin size={16} />
          {route.name}
        </span>
      </div>
      <div className="detail-scroll">
        <div className="place-totals">
          <div>
            <strong>{history.length}</strong>
            <span>visits</span>
          </div>
          <div>
            <strong>{history.reduce((n, v) => n + v.books, 0)}</strong>
            <span>books bought</span>
          </div>
        </div>
        <CityBrief cityId={cityId} visits={history} />
        <h3>Sources in {city.name}</h3>
        {local.length === 0 && (
          <p className="muted">
            No sources saved here yet. Add a shop, sale or pickup lead.
          </p>
        )}
        {local.map((s) => (
          <div className="source-item" key={s.id}>
            <button
              type="button"
              className="source-title"
              onClick={() => onSource(s)}
            >
              <strong>{s.name}</strong>
              <span>{s.type}</span>
            </button>
            <p>{s.hours || "Hours unknown"}</p>
            {s.historical && <p className="evidence-note">Recovered historical lead. Hours, prices and dates are unverified.</p>}
            {s.inventoryClass && <p className="muted">Inventory class {s.inventoryClass}</p>}
            {s.revisitCadence && <p className="muted">Revisit: {s.revisitCadence}</p>}
            {sourceExclusion(s) && <p className="scan-restricted">{sourceExclusion(s)}. Edit the source to record an explicit override reason.</p>}
            {s.scanPolicy === "Prohibited" && (
              <p className="scan-restricted">ISBN scanning prohibited</p>
            )}
            <button
              type="button"
              className="text-action"
              onClick={() => onLog(s)}
            >
              Log a visit
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-action add-source"
          onClick={onAddSource}
        >
          <Plus size={16} />
          Add source
        </button>
        {history.length > 0 && (
          <section className="place-history">
            <h3>Recent visits</h3>
            {history
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((v) => (
                <div key={v.id}>
                  <strong>{v.sourceName}</strong>
                  <small>
                    {dayLabel(v.date)} · {v.books} books
                  </small>
                </div>
              ))}
          </section>
        )}
      </div>
      <div className="detail-actions">
        <Action onClick={() => onLog()}>
          <span className="sr-only">Unsaved preview: </span>
          <BookOpen size={18} />
          Log visit in {city.name}
        </Action>
        <Action variant="outline" onClick={onPlan}>Add city to trip</Action>
      </div>
    </aside>
  );
}
