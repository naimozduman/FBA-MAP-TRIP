"use client";
import { BarChart3, BookOpen, Clock3, Coins } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/fieldwork/primitives/table";
import { corridors } from "@/lib/fieldwork/data";
import { money, money2, tripMetrics } from "@/lib/fieldwork/math";
import { Action, Empty, RouteNumber } from "./ui";
import type { Workspace } from "./use-workspace";
import { actualEconomics, observationSummary } from "@/lib/fieldwork/brief";
export default function InsightsView({
  workspace,
  onLog,
  onRoute,
}: {
  workspace: Workspace;
  onLog: () => void;
  onRoute: (id: number) => void;
}) {
  const { visits } = workspace;
  const trips = workspace.trips.filter(
    (t) => t.status !== "planned" || visits.some((v) => v.tripId === t.id),
  );
  const books = visits.reduce((s, v) => s + v.books, 0),
    hours = visits.reduce((s, v) => s + v.hours, 0),
    spend = visits.reduce((s, v) => s + v.spend, 0);
  const net =
    trips.reduce((s, t) => s + tripMetrics(t, visits).net, 0) +
    visits
      .filter((v) => !v.tripId)
      .reduce((s, v) => s + v.books * v.contribution, 0);
  const rows = corridors
    .map((r) => {
      const v = visits.filter((v) => v.routeId === r.id),
        t = trips.filter((t) => t.routeId === r.id),
        b = v.reduce((s, v) => s + v.books, 0),
        h = v.reduce((s, v) => s + v.hours, 0),
        observed = v.filter((v) => v.competition !== null),
        counted = v.filter((v) => v.scanned !== null),
        scanned = counted.reduce((s, v) => s + v.scanned!, 0),
        accepted = counted.reduce((s, v) => s + v.books, 0),
        totalHours =
          t.length > 0 &&
          t.every((t) => t.hours > 0) &&
          v.every((v) => v.tripId)
            ? t.reduce((s, t) => s + t.hours, 0)
            : 0;
      const n =
        t.reduce((s, t) => s + tripMetrics(t, visits).net, 0) +
        v
          .filter((v) => !v.tripId)
          .reduce((s, v) => s + v.books * v.contribution, 0);
      return {
        route: r,
        visits: v.length,
        books: b,
        booksPerHour: h ? b / h : null,
        buyRate: scanned ? (accepted / scanned) * 100 : null,
        acquisition: b ? v.reduce((s, v) => s + v.spend, 0) / b : null,
        competition: observed.length >= 3
          ? observed.reduce((s, v) => s + v.competition!, 0) / observed.length
          : null,
        net: n,
        tripHour: totalHours ? n / totalHours : null,
        hasData: v.length > 0 || t.length > 0,
      };
    })
    .sort((a, b) => b.books - a.books);
  return (
    <main className="page-view insights-view">
      <div className="page-heading">
        <div>
          <h1>Find your repeatable routes</h1>
          <p>Your own sourcing results, measured across the territory.</p>
        </div>
        <Action variant="outline" onClick={onLog}>
          Log visit
        </Action>
      </div>
      <div className="insight-totals">
        <div>
          <BookOpen />
          <span>Books bought</span>
          <strong>{books}</strong>
          <small>{visits.length} sourcing visits</small>
        </div>
        <div>
          <Clock3 />
          <span>Books / sourcing hour</span>
          <strong>{hours ? (books / hours).toFixed(1) : "—"}</strong>
          <small>{hours.toFixed(1)} hours logged</small>
        </div>
        <div>
          <Coins />
          <span>Average acquisition</span>
          <strong>{books ? money2(spend / books) : "—"}</strong>
          <small>{money(spend)} spent on books</small>
        </div>
        <div>
          <BarChart3 />
          <span>Projected contribution</span>
          <strong>{visits.length ? money(net) : "—"}</strong>
          <small>After recorded trip costs</small>
        </div>
      </div>
      {visits.length === 0 && (
        <Empty
          title="Good routes earn their place"
          body="Your first visit creates the baseline. After three trips, compare yield, cost, time and observed competition."
        >
          <Action onClick={onLog}>Log the first result</Action>
        </Empty>
      )}
      <section className="comparison-section">
        <div className="section-heading">
          <div>
            <h2>Corridor comparison</h2>
            <p>
              Competition stays unmeasured until you record it. Projections use
              your contribution estimates.
            </p>
          </div>
        </div>
        <div className="comparison-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corridor</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Books</TableHead>
                <TableHead>Books / hr</TableHead>
                <TableHead>Buy rate</TableHead>
                <TableHead>Cost / book</TableHead>
                <TableHead>Observed saturation (3+ visits)</TableHead>
                <TableHead>Projected net</TableHead>
                <TableHead>Net / trip hr</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.route.id}
                  className={!r.hasData ? "unmeasured-row" : ""}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="table-route"
                      onClick={() => onRoute(r.route.id)}
                    >
                      <RouteNumber id={r.route.id} small />
                      <strong>{r.route.name}</strong>
                    </button>
                  </TableCell>
                  <TableCell>{r.visits || "—"}</TableCell>
                  <TableCell>{r.hasData ? r.books : "-"}</TableCell>
                  <TableCell>
                    {r.booksPerHour !== null ? r.booksPerHour.toFixed(1) : "—"}
                  </TableCell>
                  <TableCell>
                    {r.buyRate !== null ? `${r.buyRate.toFixed(1)}%` : "—"}
                  </TableCell>
                  <TableCell>
                    {r.acquisition !== null ? money2(r.acquisition) : "—"}
                  </TableCell>
                  <TableCell>
                    {r.competition !== null
                      ? `${r.competition.toFixed(1)} / 10`
                      : "Unmeasured"}
                  </TableCell>
                  <TableCell>{r.hasData ? money(r.net) : "—"}</TableCell>
                  <TableCell>
                    {r.tripHour !== null ? money2(r.tripHour) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      <section className="actual-economics">
        <h2>Actual route economics</h2>
        <p className="muted">Realized book profit less actual travel, processing and sourcing labor. Projection inputs never fill missing actuals.</p>
        {workspace.trips.length === 0 ? <p className="muted">No actual trip budgets recorded.</p> : workspace.trips.map(trip => {
          const actual = actualEconomics(trip);
          return <p key={trip.id}><strong>{trip.title}</strong>: {actual ? `${money2(actual.net)} recorded actual route profit · ${actual.perHour === null ? "door-to-door hours unknown" : `${money2(actual.perHour)} / trip hour`}` : "Actual results incomplete"}</p>;
        })}
        <p className="muted">Inventory velocity remains unavailable without a linked sales cohort. Acquisition counts do not establish 30/60/90-day sell-through or 180-day unsold inventory.</p>
      </section>
      <div className="insights-footnote">
        <p>
          Projected net = book contribution after purchase cost and Amazon fees,
          minus logged travel, processing, and sourcing labor. Purchase cost is
          already included in your per-book contribution and is not deducted
          twice.
        </p>
        <p>
          Standalone visits exclude travel until attached to a trip. Sourcing
          hours measure time at sources. Enter total door-to-door hours in a
          trip to compare the full day&apos;s economics. Actual sales and
          sell-through are not imported.
        </p>
      </div>
      <section className="source-performance">
        <h2>Source yield</h2>
        {visits.length === 0 ? (
          <p className="muted">Source results appear after your first visit.</p>
        ) : (
          <div className="yield-rows">
            {Array.from(
              new Set(
                visits.map(
                  (v) =>
                    v.sourceId ??
                    `${v.cityId}:${v.sourceName.trim().toLowerCase()}`,
                ),
              ),
            ).map((key) => {
              const v = visits.filter(
                  (v) =>
                    (v.sourceId ??
                      `${v.cityId}:${v.sourceName.trim().toLowerCase()}`) ===
                    key,
                ),
                b = v.reduce((s, v) => s + v.books, 0),
                h = v.reduce((s, v) => s + v.hours, 0);
              return (
                <div key={key}>
                  <strong>{v[0].sourceName}</strong>
                  <span>{v.length} visits</span>
                  <span>{b} books</span>
                  <span>{h ? (b / h).toFixed(1) : "-"} books/hr</span>
                  <span>{((observationSummary(v).zeroBookStopRate ?? 0) * 100).toFixed(0)}% zero-book stops</span>
                  <details className="raw-observations"><summary>Raw visit observations</summary>{v.map(visit => <div key={visit.id}>
                    <strong>{visit.date} · {visit.sourceName}</strong>
                    <p>{visit.scanned === null ? "Scanned count unknown" : `${visit.scanned} scanned`} · {visit.books} bought · {visit.booksRejected ?? "Unknown"} rejected · {money2(visit.spend)} acquisition spend</p>
                    <p>{visit.scannersObserved ?? "Unknown"} scanner competitors · stock {visit.stockPicked ?? "unobserved"} · saturation {visit.competition ?? "unmeasured"}</p>
                    <p>{visit.arrivalTime || "Arrival unknown"} → {visit.departureTime || "Departure unknown"} (recorded source local time)</p>
                    <p>Projected revenue: {visit.projectedRevenue == null ? "unknown" : money2(visit.projectedRevenue)} · projected Amazon fees: {visit.projectedAmazonFees == null ? "unknown" : money2(visit.projectedAmazonFees)} · projected book profit: {visit.projectedProfit == null ? "unknown" : money2(visit.projectedProfit)}</p>
                    {visit.rejectionReason && <p>Rejections: {visit.rejectionReason}</p>}
                    {visit.restockFrequency && <p>Restock: {visit.restockFrequency}</p>}
                    {visit.organizerContact && <p>Contact: {visit.organizerContact}</p>}
                    <p>Bulk removal: {visit.acceptsBulk ?? "unknown"} · next sale/restock: {visit.nextRestockDate || "unknown"}</p>
                    {Object.entries(visit.quality ?? {}).map(([dimension, measurement]) => <p key={dimension}>{dimension.replaceAll("_", " ")}: {measurement.raw} {measurement.score === null ? "(not scored)" : `(${measurement.score} / 5)`}</p>)}
                    <p>{visit.notes}</p>
                  </div>)}</details>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
