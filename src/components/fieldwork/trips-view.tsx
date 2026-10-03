"use client";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  Map,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/fieldwork/primitives/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/fieldwork/primitives/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/fieldwork/primitives/table";
import { cityById, routeById } from "@/lib/fieldwork/data";
import {
  dayLabel,
  money,
  money2,
  tripMetrics,
  travelCost,
} from "@/lib/fieldwork/math";
import type { Trip, Visit } from "@/lib/fieldwork/types";
import { Action, Empty, RouteNumber } from "./ui";
import type { Workspace } from "./use-workspace";
import { toast } from "sonner";
export default function TripsView({
  workspace,
  onPlan,
  onMap,
  onLog,
  onEditVisit,
  onRemove,
  initialTab = "plans",
}: {
  workspace: Workspace;
  onPlan: (t?: Trip) => void;
  onMap: (t: Trip) => void;
  onLog: (t?: Trip) => void;
  onEditVisit: (v: Visit) => void;
  onRemove: (id: string) => void;
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab),
    [busy, setBusy] = useState("");
  const trips = workspace.trips
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  const visits = workspace.visits
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  const changeStatus = async (t: Trip, status: Trip["status"]) => {
    setBusy(t.id);
    try {
      const revision = workspace.records.find(record => record.id === t.id)?.revision ?? 0;
      await workspace.save("trip", { ...t, status }, revision);
      toast.success(
        status === "active" ? "Trip started" : "Trip marked complete",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The trip was not updated.");
    } finally {
      setBusy("");
    }
  };
  return (
    <main className="page-view trips-view">
      <div className="page-heading">
        <div>
          <h1>Trips & visit history</h1>
          <p>Your next sourcing day, and the record of every stop.</p>
        </div>
        <Action onClick={() => onPlan()}>
          <Plus size={17} />
          Plan a trip
        </Action>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="view-tabs">
        <TabsList className="view-tablist">
          <TabsTrigger value="plans">
            Trip plans <span>{trips.length}</span>
          </TabsTrigger>
          <TabsTrigger value="history">
            Visit history <span>{visits.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plans">
          {trips.length === 0 ? (
            <Empty
              title="Your first trip starts here"
              body="Pick a corridor, choose your stops, and save a reason to go."
            >
              <Action onClick={() => onPlan()}>
                <CalendarDays size={17} />
                Plan a trip
              </Action>
            </Empty>
          ) : (
            <div className="trip-rows">
              {trips.map((t) => {
                const m = tripMetrics(t, visits);
                return (
                  <article className="trip-item" key={t.id}>
                    <div className="trip-item-head">
                      <RouteNumber id={t.routeId} />
                      <div>
                        <h2>{t.title}</h2>
                        <p>
                          {dayLabel(t.date)}
                          {t.endDate !== t.date
                            ? ` to ${dayLabel(t.endDate)}`
                            : ""}{" "}
                          · {t.vehicle} · {t.people}
                        </p>
                      </div>
                      <span className={`trip-status ${t.status}`}>
                        {t.status === "active"
                          ? "On the road"
                          : t.status === "complete"
                            ? "Complete"
                            : "Planned"}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="icon-action"
                            aria-label={`More actions for ${t.title}`}
                          >
                            <MoreHorizontal />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onPlan(t)}>
                            <Pencil size={16} />
                            Edit trip
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRemove(t.id)}>
                            <Trash2 size={16} />
                            Remove trip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="trip-reason">{t.reason}</p>
                    <div className="trip-stops-line">
                      <span>St. Louis</span>
                      {t.stops.map((id) => (
                        <span key={id}>{cityById[id].name}</span>
                      ))}
                      {t.returnStops.map((id) => (
                        <span key={id}>{cityById[id].name}</span>
                      ))}
                      <span>Home</span>
                    </div>
                    <div className="trip-numbers">
                      <div>
                        <strong>{money(travelCost(t))}</strong>
                        <span>travel estimate</span>
                      </div>
                      <div>
                        <strong>{t.expectedBooks}</strong>
                        <span>book target</span>
                      </div>
                      <div>
                        <strong>{m.books}</strong>
                        <span>books logged</span>
                      </div>
                      <div>
                        <strong>{m.visits.length}</strong>
                        <span>visits logged</span>
                      </div>
                    </div>
                    <div className="trip-actions">
                      <Action variant="outline" onClick={() => onMap(t)}>
                        <Map size={16} />
                        View on map
                      </Action>
                      <Action variant="outline" onClick={() => onLog(t)}>
                        <BookOpen size={16} />
                        Log visit
                      </Action>
                      {t.status !== "complete" && (
                        <Action
                          disabled={busy === t.id}
                          onClick={() =>
                            void changeStatus(
                              t,
                              t.status === "planned" ? "active" : "complete",
                            )
                          }
                        >
                          <Check size={16} />
                          {t.status === "planned"
                            ? "Start trip"
                            : "Complete trip"}
                        </Action>
                      )}
                      {t.status === "complete" && m.visits.length > 0 && (
                        <span className="trip-net">
                          {money(m.net)} projected after trip costs
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="history">
          <div className="history-toolbar">
            <p className="muted">
              {visits.reduce((s, v) => s + v.books, 0)} books recorded across{" "}
              {visits.length} visits
            </p>
            <Action variant="outline" onClick={() => onLog()}>
              <Plus size={16} />
              Log visit
            </Action>
          </div>
          {visits.length === 0 ? (
            <Empty
              title="Every stop has a story"
              body="Log books bought, the price, your time, and the quality of the shelves."
            >
              <Action onClick={() => onLog()}>Log your first visit</Action>
            </Empty>
          ) : (
            <div className="history-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visit</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Books</TableHead>
                    <TableHead>Book cost</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="visit-title"
                          onClick={() => onEditVisit(v)}
                        >
                          <strong>{v.sourceName}</strong>
                          <small>
                            {dayLabel(v.date)} · {v.sourceType}
                          </small>
                        </button>
                      </TableCell>
                      <TableCell>
                        <strong>
                          {cityById[v.cityId].name}, {cityById[v.cityId].state}
                        </strong>
                        <small>{routeById[v.routeId].name}</small>
                      </TableCell>
                      <TableCell className="books-cell">{v.books}</TableCell>
                      <TableCell>{money2(v.spend)}</TableCell>
                      <TableCell>{v.hours}</TableCell>
                      <TableCell>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="icon-action"
                            aria-label={`Edit visit to ${v.sourceName}`}
                            onClick={() => onEditVisit(v)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-action"
                            aria-label={`Remove visit to ${v.sourceName}`}
                            onClick={() => onRemove(v.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
