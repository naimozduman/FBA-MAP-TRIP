"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Check, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/fieldwork/primitives/sheet";
import { Checkbox } from "@/components/fieldwork/primitives/checkbox";
import { cities, cityById, corridors, routeById } from "@/lib/fieldwork/data";
import {
  estimateMiles,
  money,
  today,
  travelCost,
  newId,
} from "@/lib/fieldwork/math";
import type { Settings, Trip } from "@/lib/fieldwork/types";
import { tripSchema } from "@/lib/fieldwork/validation";
import {
  Action,
  IconAction,
  SelectField,
  TextAreaField,
  TextField,
} from "./ui";
import type { Workspace } from "./use-workspace";
import { toast } from "sonner";
import { actualEconomics } from "@/lib/fieldwork/brief";
function defaultStops(routeId: number) {
  if (routeId === 4) return ["fulton", "columbia", "jefferson-city"];
  if (routeId === 7) return ["hannibal", "quincy"];
  const r = routeById[routeId],
    index = r.cities.indexOf(r.anchor);
  return r.cities.slice(Math.max(0, index - 1), index + 1);
}
function makeTrip(routeId: number, settings: Settings, cityId?: string | null): Trip {
  const stops = cityId && cityId !== "stl" ? [cityId] : defaultStops(routeId);
  return {
    id: newId(),
    routeId,
    title: routeById[routeId].name,
    date: today(),
    endDate: today(),
    reason: routeById[routeId].strategy,
    people: settings.people,
    vehicle: settings.vehicle,
    status: "planned",
    stops,
    returnStops: [],
    miles: estimateMiles(stops),
    mpg: settings.mpg,
    gasPrice: settings.gasPrice,
    hotel: 0,
    tolls: 0,
    other: 0,
    expectedBooks: 0,
    contribution: settings.contribution,
    hours: 0,
    processing: 0,
    laborRate: 0,
    notes: "",
  };
}
export default function TripPlanner({
  open,
  onClose,
  initial,
  routeId,
  workspace,
  onSaved,
  cityId,
}: {
  open: boolean;
  onClose: () => void;
  initial: Trip | null;
  routeId: number;
  workspace: Workspace;
  onSaved: (t: Trip) => void;
  cityId?: string | null;
}) {
  const [trip, setTrip] = useState<Trip | null>(() => {
      return initial
        ? {
            ...initial,
            stops: [...initial.stops],
            returnStops: [...initial.returnStops],
          }
        : makeTrip(routeId, workspace.settings, cityId);
    }),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [addId, setAddId] = useState("");
  const [draftRevision] = useState(
    () =>
      workspace.records.find((record) => record.id === initial?.id)?.revision ??
      0,
  );
  const set = (key: keyof Trip, value: unknown) =>
    setTrip((t) => (t ? { ...t, [key]: value } : t));
  const stopChange = (
    next: string[],
    back: string[] = trip?.returnStops ?? [],
  ) => {
    setTrip((t) =>
      t
        ? {
            ...t,
            stops: next,
            returnStops: back,
            miles: estimateMiles(next, back),
          }
        : t,
    );
  };
  const reorder = (index: number, by: number, back = false) => {
    if (!trip) return;
    const a = [...(back ? trip.returnStops : trip.stops)];
    const to = index + by;
    if (to < 0 || to >= a.length) return;
    [a[index], a[to]] = [a[to], a[index]];
    stopChange(back ? trip.stops : a, back ? a : trip.returnStops);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;
    const checked = tripSchema.safeParse(trip);
    if (!checked.success) {
      setError(checked.error.issues[0].message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await workspace.save("trip", trip, draftRevision);
      toast.success("Trip kept in this unsaved preview. Reloading clears it.");
      onSaved(trip);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The trip was not saved.");
    } finally {
      setSaving(false);
    }
  };
  const row = (id: string, index: number, back = false) => {
    const a = back ? trip!.returnStops : trip!.stops;
    return (
      <div className={`planner-stop ${back ? "back" : ""}`} key={id}>
        <span className="stop-order">{index + 1}</span>
        <div>
          <strong>{cityById[id].name}</strong>
          <small>{cityById[id].state}</small>
        </div>
        <IconAction
          label={`Move ${cityById[id].name} earlier`}
          disabled={index === 0}
          onClick={() => reorder(index, -1, back)}
        >
          <ArrowUp size={16} />
        </IconAction>
        <IconAction
          label={`Move ${cityById[id].name} later`}
          disabled={index === a.length - 1}
          onClick={() => reorder(index, 1, back)}
        >
          <ArrowDown size={16} />
        </IconAction>
        <IconAction
          label={`Remove ${cityById[id].name} stop`}
          onClick={() =>
            stopChange(
              back ? trip!.stops : a.filter((x) => x !== id),
              back ? a.filter((x) => x !== id) : trip!.returnStops,
            )
          }
        >
          <X size={16} />
        </IconAction>
      </div>
    );
  };
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v && !saving) onClose();
      }}
    >
      <SheetContent className="work-sheet planner-sheet">
        <SheetHeader className="work-sheet-header">
          <SheetTitle>
            {initial ? "Edit trip" : "Plan a sourcing trip"}
          </SheetTitle>
          <SheetDescription>
            Choose your stops, your reason, and the cost of going. This unsaved preview clears on reload. Mileage and budget defaults are editable estimates.
          </SheetDescription>
        </SheetHeader>
        {trip && (
          <form className="sheet-form" onSubmit={submit}>
            <div className="sheet-scroll">
              <div className="form-grid">
                <TextField
                  label="Trip name"
                  value={trip.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                  wide
                  maxLength={120}
                />
                <SelectField
                  label="Corridor"
                  disabled={workspace.visits.some(
                    (visit) => visit.tripId === trip.id,
                  )}
                  hint={
                    workspace.visits.some((visit) => visit.tripId === trip.id)
                      ? "Corridor is fixed once visits are logged."
                      : undefined
                  }
                  value={trip.routeId}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    const stops = defaultStops(n);
                    setTrip((t) =>
                      t
                        ? {
                            ...t,
                            routeId: n,
                            title: routeById[n].name,
                            reason: routeById[n].strategy,
                            stops,
                            returnStops: [],
                            miles: estimateMiles(stops),
                          }
                        : t,
                    );
                  }}
                >
                  {corridors.map((r) => (
                    <option value={r.id} key={r.id}>
                      {String(r.id).padStart(2, "0")} · {r.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Trip status"
                  value={trip.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option value="planned">Planned</option>
                  <option value="active">On the road</option>
                  <option value="complete">Complete</option>
                </SelectField>
                <TextField
                  label="Departure date"
                  type="date"
                  required
                  value={trip.date}
                  onChange={(e) => {
                    setTrip((t) =>
                      t
                        ? {
                            ...t,
                            date: e.target.value,
                            endDate:
                              t.endDate < e.target.value
                                ? e.target.value
                                : t.endDate,
                          }
                        : t,
                    );
                  }}
                />
                <TextField
                  label="Return date"
                  type="date"
                  required
                  min={trip.date}
                  value={trip.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
                <TextAreaField
                  label="Why are we going?"
                  required
                  value={trip.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  placeholder="Confirmed sale, fresh inventory, a source to test…"
                  maxLength={2000}
                />
              </div>
              <section className="form-section">
                <h3>Out and back</h3>
                <p className="muted">
                  St. Louis is added at both ends. Reorder stops to match your
                  plan.
                </p>
                <div className="planner-home">
                  <MapHome />
                  St. Louis <small>Departure</small>
                </div>
                {trip.stops.map((id, i) => row(id, i))}
                <div className="stop-picker">
                  <SelectField
                    label="Add a place"
                    value={addId}
                    onChange={(e) => setAddId(e.target.value)}
                  >
                    <option value="">Choose a city</option>
                    {cities
                      .filter(
                        (c) =>
                          c.id !== "stl" &&
                          !trip.stops.includes(c.id) &&
                          !trip.returnStops.includes(c.id),
                      )
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}, {c.state}
                        </option>
                      ))}
                  </SelectField>
                  <Action
                    type="button"
                    variant="outline"
                    disabled={!addId}
                    onClick={() => {
                      stopChange([...trip.stops, addId]);
                      setAddId("");
                    }}
                  >
                    <Plus size={16} />
                    Outbound
                  </Action>
                  <Action
                    type="button"
                    variant="outline"
                    disabled={!addId}
                    onClick={() => {
                      stopChange(trip.stops, [...trip.returnStops, addId]);
                      setAddId("");
                    }}
                  >
                    <Plus size={16} />
                    Return
                  </Action>
                </div>
                {trip.returnStops.length > 0 && (
                  <div className="return-heading">Return stops</div>
                )}
                {trip.returnStops.map((id, i) => row(id, i, true))}
                <div className="planner-home back">
                  <MapHome />
                  St. Louis <small>Home</small>
                </div>
                <details className="corridor-picker">
                  <summary>Choose from this corridor&apos;s places</summary>
                  <div className="corridor-options">
                    {routeById[trip.routeId].cities.map((id) => (
                      <label key={id}>
                        <Checkbox
                          checked={trip.stops.includes(id)}
                          disabled={trip.returnStops.includes(id)}
                          onCheckedChange={(v) =>
                            stopChange(
                              v
                                ? [...trip.stops, id]
                                : trip.stops.filter((x) => x !== id),
                            )
                          }
                        />
                        <span>{cityById[id].name}</span>
                      </label>
                    ))}
                  </div>
                </details>
              </section>
              <section className="form-section">
                <h3>Your Explorer trip</h3>
                <div className="form-grid">
                  <TextField
                    label="Vehicle"
                    value={trip.vehicle}
                    required
                    onChange={(e) => set("vehicle", e.target.value)}
                    maxLength={120}
                  />
                  <TextField
                    label="Traveling with"
                    value={trip.people}
                    required
                    onChange={(e) => set("people", e.target.value)}
                    maxLength={120}
                  />
                  <TextField
                    label="Total round-trip miles"
                    type="number"
                    min={0}
                    step={1}
                    value={trip.miles}
                    onChange={(e) => set("miles", Number(e.target.value))}
                    hint="Sketch estimate. Replace with road mileage."
                  />
                  <TextField
                    label="Fuel economy (MPG)"
                    type="number"
                    min={1}
                    max={200}
                    step={0.1}
                    value={trip.mpg}
                    onChange={(e) => set("mpg", Number(e.target.value))}
                  />
                  <TextField
                    label="Gas price ($/gallon)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={trip.gasPrice}
                    onChange={(e) => set("gasPrice", Number(e.target.value))}
                  />
                  <TextField
                    label="Lodging ($, total)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={trip.hotel}
                    onChange={(e) => set("hotel", Number(e.target.value))}
                  />
                  <TextField
                    label="Tolls & parking ($)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={trip.tolls}
                    onChange={(e) => set("tolls", Number(e.target.value))}
                  />
                  <TextField
                    label="Other travel costs ($)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={trip.other}
                    onChange={(e) => set("other", Number(e.target.value))}
                  />
                </div>
              </section>
              <section className="form-section">
                <h3>Buying target & projected economics</h3>
                <div className="form-grid">
                  <TextField
                    label="Target books"
                    type="number"
                    min={0}
                    step={1}
                    value={trip.expectedBooks}
                    onChange={(e) =>
                      set("expectedBooks", Number(e.target.value))
                    }
                  />
                  <TextField
                    label="Expected contribution / book ($)"
                    type="number"
                    step={0.01}
                    value={trip.contribution}
                    onChange={(e) =>
                      set("contribution", Number(e.target.value))
                    }
                    hint="After Amazon fees and book purchase cost."
                  />
                  <TextField
                    label="Total trip hours"
                    type="number"
                    min={0}
                    step={0.25}
                    value={trip.hours}
                    onChange={(e) => set("hours", Number(e.target.value))}
                    hint="Door to door. Replace estimate after the trip."
                  />
                  <TextField
                    label="Processing costs ($)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={trip.processing}
                    onChange={(e) => set("processing", Number(e.target.value))}
                  />
                  <TextField
                    label="Sourcing labor ($/hour)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={trip.laborRate}
                    onChange={(e) => set("laborRate", Number(e.target.value))}
                    hint="Applied to logged sourcing hours."
                  />
                  <TextAreaField
                    label="Trip notes"
                    value={trip.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Opening times, arrival plan, loading space, who to contact…"
                    maxLength={4000}
                  />
                </div>
              </section>
              <details className="actual-budget"><summary>Record actual route economics</summary><p className="muted">Enter measured amounts after the trip. Unknowns stay blank; zero means confirmed. Book profit already includes acquisition and marketplace fees.</p>
                <div className="form-grid">{([ ["actualBookProfit", "Realized book profit after acquisition and fees ($)"], ["actualTravelCost", "Actual fuel, tolls, lodging and other travel ($)"], ["actualProcessingCost", "Actual processing costs ($)"], ["actualSourcingLaborCost", "Actual sourcing labor costs ($)"], ["actualTripHours", "Actual door-to-door hours"] ] as const).map(([key, label]) => <TextField key={key} label={label} type="number" step={key === "actualTripHours" ? 0.25 : 0.01} min={key === "actualBookProfit" ? undefined : 0} value={trip[key] ?? ""} onChange={e => set(key, e.target.value === "" ? null : Number(e.target.value))} />)}</div>
                <p className="evidence-note">{actualEconomics(trip) ? `Recorded actual route profit: ${money(actualEconomics(trip)!.net)}. ${actualEconomics(trip)!.perHour === null ? "Actual trip hours unknown." : `${money(actualEconomics(trip)!.perHour!)} per door-to-door hour.`}` : "Actual route profit unavailable until all actual cost fields are recorded."}</p>
              </details>
            </div>
            <div className="sheet-bottom">

              <div className="planner-budget">
                <span>
                  Travel budget<strong>{money(travelCost(trip))}</strong>
                </span>
                <span>
                  Travel break-even
                  <strong>
                    {trip.contribution > 0
                      ? `${Math.ceil(travelCost(trip) / trip.contribution)} books`
                      : "No positive contribution"}
                  </strong>
                </span>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <Action
                type="submit"
                disabled={saving || workspace.loading || !!workspace.error}
              >
                <Check size={18} />
                {saving ? "Saving…" : initial ? "Keep changes in preview" : "Keep trip in preview"}
              </Action>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
function MapHome() {
  return <BookOpen size={18} />;
}
