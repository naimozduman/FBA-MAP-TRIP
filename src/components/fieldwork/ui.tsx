"use client";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/fieldwork/primitives/button";
import { Input } from "@/components/fieldwork/primitives/input";
import { Textarea } from "@/components/fieldwork/primitives/textarea";
import { NativeSelect } from "@/components/fieldwork/primitives/native-select";
import { BookOpen, MapPin, Moon, Sun, Clock3 } from "lucide-react";
import type { Corridor, Trip } from "@/lib/fieldwork/types";
import { duration } from "@/lib/fieldwork/math";
export function Action({
  className = "",
  ...props
}: ComponentProps<typeof Button>) {
  return <Button className={`action ${className}`} {...props} />;
}
export function IconAction({
  label,
  children,
  ...props
}: ComponentProps<"button"> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className="icon-action"
      title={label}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
}
export function Field({
  label,
  hint,
  children,
  wide = false,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`form-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function TextField({
  label,
  hint,
  wide,
  ...props
}: ComponentProps<typeof Input> & {
  label: string;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <Field label={label} hint={hint} wide={wide}>
      <Input className="field-input" aria-label={label} {...props} />
    </Field>
  );
}
export function TextAreaField({
  label,
  hint,
  wide = true,
  ...props
}: ComponentProps<typeof Textarea> & {
  label: string;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <Field label={label} hint={hint} wide={wide}>
      <Textarea className="field-input textarea" rows={3} aria-label={label} {...props} />
    </Field>
  );
}
export function SelectField({
  label,
  hint,
  children,
  wide,
  ...props
}: ComponentProps<typeof NativeSelect> & {
  label: string;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <Field label={label} hint={hint} wide={wide}>
      <NativeSelect className="field-input" aria-label={label} {...props}>
        {children}
      </NativeSelect>
    </Field>
  );
}
export function RouteFacts({
  route,
  trip = null,
}: {
  route: Corridor;
  trip?: Trip | null;
}) {
  const format = trip
    ? trip.date === trip.endDate
      ? "Day trip"
      : "Overnight"
    : route.format;
  const places = trip
    ? trip.stops.length + trip.returnStops.length + 1
    : route.cities.length + 1;
  const Icon =
    format === "Overnight" ? Moon : format === "Long day" ? Clock3 : Sun;
  return (
    <div className="route-facts">
      <span>
        <BookOpen size={16} />
        {places} places
      </span>
      <span>
        <MapPin size={16} />
        {route.direction}
      </span>
      <span>
        <Icon size={16} />
        {format}
      </span>
    </div>
  );
}
export function Empty({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <BookOpen size={32} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{body}</p>
      {children}
    </div>
  );
}
export function RouteNumber({
  id,
  small = false,
}: {
  id: number;
  small?: boolean;
}) {
  return (
    <span className={`route-number ${small ? "small" : ""}`}>
      {String(id).padStart(2, "0")}
    </span>
  );
}
export function TravelLabel({ route }: { route: Corridor }) {
  return (
    <span>
      {duration(route.minutes)} to{" "}
      {route.anchor === "kc-mo"
        ? "Kansas City"
        : route.anchor === "cape"
          ? "Cape"
          : route.anchor === "springfield-mo"
            ? "Springfield"
            : route.anchor
                .split("-")
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" ")}
    </span>
  );
}
