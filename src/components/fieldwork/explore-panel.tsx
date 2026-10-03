"use client";
import { Search, ChevronRight } from "lucide-react";
import { cityById, cities, corridors } from "@/lib/fieldwork/data";
import { duration } from "@/lib/fieldwork/math";
import { RouteNumber } from "./ui";
export default function ExplorePanel({
  selectedId,
  query,
  setQuery,
  filter,
  setFilter,
  onRoute,
  onCity,
}: {
  selectedId: number | null;
  query: string;
  setQuery: (v: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  onRoute: (id: number) => void;
  onCity: (id: string) => void;
}) {
  const order = [4, 1, 7, 9, 12, 13, 11, 8, 2, 5, 6, 14, 15, 3, 10];
  const list = order
    .map((id) => corridors.find((r) => r.id === id)!)
    .filter(
      (r) =>
        (filter === "All" ||
          (filter === "Day trip" && r.format !== "Overnight") ||
          r.format === filter) &&
        (!query ||
          `${r.name} ${r.direction} ${r.cities.map((id) => cityById[id].name).join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase())),
    );
  const places = query.trim()
    ? cities
        .filter((c) =>
          `${c.name} ${c.state}`.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 6)
    : [];
  return (
    <aside className="explore-panel paper-panel">
      <h1>Explore the territory</h1>
      <div className="search-field">
        <Search size={19} />
        <input
          aria-label="Search routes or places"
          placeholder="Search routes or places"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
          >
            ×
          </button>
        )}
      </div>
      <div className="filter-row">
        {["All", "Day trip", "Overnight"].map((s) => (
          <button
            type="button"
            key={s}
            className={filter === s ? "selected" : ""}
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="explore-list">
        {places.length > 0 && (
          <div className="place-results">
            {places.map((c) => (
              <button type="button" key={c.id} onClick={() => onCity(c.id)}>
                <span>
                  {c.name}, {c.state}
                </span>
                <small>{duration(c.minutes)} from base</small>
              </button>
            ))}
          </div>
        )}
        {list.map((r) => (
          <button
            type="button"
            key={r.id}
            className={`explore-row ${selectedId === r.id ? "active" : ""}`}
            onClick={() => onRoute(r.id)}
          >
            <RouteNumber id={r.id} />
            <span>
              <strong>{r.name}</strong>
              <small>
                {r.direction} · {duration(r.minutes)} · {r.cities.length + 1}{" "}
                places
              </small>
            </span>
            <ChevronRight size={17} />
          </button>
        ))}
        {list.length === 0 && (
          <p className="no-results">No corridors match this search.</p>
        )}
      </div>
      <footer>
        {corridors.length} corridors · {cities.length - 1} places
      </footer>
    </aside>
  );
}
