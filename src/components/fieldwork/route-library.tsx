"use client";
import { useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { cityById, corridors } from "@/lib/fieldwork/data";
import { dayLabel, duration } from "@/lib/fieldwork/math";
import { Action, RouteNumber } from "./ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/fieldwork/primitives/table";
import type { Source } from "@/lib/fieldwork/types";
import { sourcingBrief, sourceExclusion } from "@/lib/fieldwork/brief";
export default function RouteLibrary({
  onRoute,
  onPlan,
  onSource,
  onAddSource,
  sources,
}: {
  onRoute: (id: number) => void;
  onPlan: (id: number) => void;
  onSource: (s: Source) => void;
  onAddSource: () => void;
  sources: Source[];
}) {
  const [query, setQuery] = useState(""),
    [direction, setDirection] = useState("All directions"),
    [inventoryClass, setInventoryClass] = useState("");
  const list = corridors.filter(
    (r) =>
      (direction === "All directions" || r.direction.includes(direction)) &&
      `${r.name} ${r.cities.map((id) => cityById[id].name).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const upcoming = sources
    .filter(
      (s) =>
        s.nextDate &&
        (s.endDate || s.nextDate) >= new Date().toISOString().slice(0, 10),
    )
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  return (
    <main className="page-view route-library">
      <div className="page-heading">
        <div>
          <h1>Your sourcing territory</h1>
          <p>
            15 repeatable corridors from St. Louis. Choose an anchor, then build
            the day.
          </p>
        </div>
        <Action variant="outline" onClick={onAddSource}>
          <Plus size={17} />
          Add source
        </Action>
      </div>
      <div className="library-controls">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search corridors"
            placeholder="Find a corridor or city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
        >
          {[
            "All directions",
            "West",
            "Southwest",
            "North",
            "East",
            "South",
          ].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="corridor-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Corridor</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Anchor drive</TableHead>
              <TableHead>Trip format</TableHead>
              <TableHead>Places</TableHead>
              <TableHead>
                <span className="sr-only">Plan</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <button
                    type="button"
                    className="table-route"
                    onClick={() => onRoute(r.id)}
                  >
                    <RouteNumber id={r.id} small />
                    <span>
                      <strong>{r.name}</strong>
                      <small>{r.summary}</small>
                    </span>
                  </button>
                </TableCell>
                <TableCell>{r.direction}</TableCell>
                <TableCell>
                  <strong>{duration(r.minutes)}</strong>
                  <small>
                    {cityById[r.anchor].name}, {cityById[r.anchor].state}
                  </small>
                </TableCell>
                <TableCell>
                  <span
                    className={`format-tag ${r.format === "Overnight" ? "overnight" : ""}`}
                  >
                    {r.format}
                  </span>
                </TableCell>
                <TableCell>{r.cities.length + 1}</TableCell>
                <TableCell>
                  <Action variant="ghost" onClick={() => onPlan(r.id)}>
                    Plan trip
                  </Action>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mobile-corridors">
        {list.map((r) => (
          <article key={r.id}>
            <div className="route-card-title">
              <RouteNumber id={r.id} />
              <button type="button" onClick={() => onRoute(r.id)}>
                <h2>{r.name}</h2>
                <p>{r.summary}</p>
              </button>
            </div>
            <div className="mobile-corridor-meta">
              <span>
                <MapPin size={14} />
                {r.direction}
              </span>
              <span>
                <Clock3 size={14} />
                {duration(r.minutes)}
              </span>
              <span>{r.format}</span>
            </div>
            <div className="route-card-actions">
              <button
                type="button"
                className="text-action"
                onClick={() => onRoute(r.id)}
              >
                View on map
                <ChevronRight size={15} />
              </button>
              <Action variant="outline" onClick={() => onPlan(r.id)}>
                Plan trip
              </Action>
            </div>
          </article>
        ))}
      </div>
      {list.length === 0 && (
        <p className="muted">No corridors match your search.</p>
      )}
      <section className="brief-guide">
        <h2>Travel bands</h2><p className="muted">User-supplied approximate one-way times before traffic, sourcing, meals or loading. Boundary bands overlap; use confirmed inventory to decide.</p>
        <div className="travel-band-grid">{sourcingBrief.travel_bands.map(band => <div key={band.hours_as_supplied}><strong>{band.hours_as_supplied} hours</strong><span>{band.classification}</span></div>)}</div>
        <p className="muted">108 destinations plus the St. Louis reference base, across 15 original corridors. Every recovered city ID is retained.</p>
      </section>
      <section className="sources-section">
        <div className="section-heading">
          <div>
            <h2>Sale dates & repeatable sources</h2>
            <p>
              Recovered historical leads. Hours, prices and dates are unverified. Check official details and scanner rules before leaving.
            </p>
          </div>
          <span className="meta">
            6 recovered leads, plus your preview sources
          </span>
        </div>
        <div className="source-rows">
          <label className="source-class-filter">Inventory class <select aria-label="Inventory class" value={inventoryClass} onChange={e => setInventoryClass(e.target.value)}><option value="">All classes</option>{sourcingBrief.source_classes.map(item => <option key={item.id} value={item.id}>Class {item.id}: {item.name}</option>)}</select></label>
          {[
            ...upcoming,
            ...sources.filter((s) => !upcoming.some((u) => u.id === s.id)),
          ].filter(source => !sourceExclusion(source) && (!inventoryClass || source.inventoryClass === Number(inventoryClass))).map((s) => (
            <button
              type="button"
              className="source-row"
              key={s.id}
              onClick={() => onSource(s)}
            >
              <div className="source-date">
                {s.nextDate ? (
                  <>
                    <strong>
                      {new Date(s.nextDate + "T12:00:00").toLocaleDateString(
                        "en-US",
                        { day: "numeric" },
                      )}
                    </strong>
                    <span>
                      {new Date(s.nextDate + "T12:00:00").toLocaleDateString(
                        "en-US",
                        { month: "short" },
                      )}
                    </span>
                  </>
                ) : (
                  <BookOpen size={22} />
                )}
              </div>
              <span>
                <strong>{s.name}</strong>
                <small>
                  {cityById[s.cityId].name}, {cityById[s.cityId].state} ·{" "}
                  {s.nextDate
                    ? `${dayLabel(s.nextDate)}${s.endDate && s.endDate !== s.nextDate ? ` to ${dayLabel(s.endDate)}` : ""}`
                    : s.type}
                </small>
              </span>
              <span className="source-price">{s.pricing}</span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
