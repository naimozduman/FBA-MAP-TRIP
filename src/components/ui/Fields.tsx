"use client";
import { useState } from "react";
import type { Point } from "@/lib/model";
export function NumberField({ label, value, onChange, min = 0, max, step = 1 }: { label: string; value: number | null; onChange: (value: number | null) => void; min?: number; max?: number; step?: number }) {
  return <label>{label}<input type="number" min={min} max={max} step={step} value={value ?? ""} placeholder="Unknown" onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))} /></label>;
}
export function PointFields({ point, onChange, label = "Location", zone = "America/Chicago" }: { point: Point | null; onChange: (p: Point | null) => void; label?: string; zone?: string }) {
  const [values, setValues] = useState({ name: point?.label || "", address: point?.address || "", lat: point ? String(point.lat) : "", lng: point ? String(point.lng) : "", zone: point?.zone || zone, confirmed: point?.confirmed || false });
  function update(next: typeof values) {
    setValues(next);
    const valid = next.lat.trim() && next.lng.trim() && Number.isFinite(Number(next.lat)) && Number.isFinite(Number(next.lng)) && Math.abs(Number(next.lat)) <= 90 && Math.abs(Number(next.lng)) <= 180;
    onChange(valid ? { id: point?.id || crypto.randomUUID(), label: next.name || label, address: next.address, lat: Number(next.lat), lng: Number(next.lng), zone: next.zone, precision: next.confirmed ? "exact" : "approximate", confirmed: next.confirmed } : null);
  }
  return <fieldset className="location-fields"><legend>{label}</legend>
    <label>Location name<input value={values.name} onChange={e => update({ ...values, name: e.target.value })} /></label>
    <label>Actual address<input value={values.address} onChange={e => update({ ...values, address: e.target.value })} placeholder="Enter an actual selected address" /></label>
    <div className="field-pair"><label>Latitude<input type="number" min="-90" max="90" step="any" value={values.lat} onChange={e => update({ ...values, lat: e.target.value })} /></label><label>Longitude<input type="number" min="-180" max="180" step="any" value={values.lng} onChange={e => update({ ...values, lng: e.target.value })} /></label></div>
    <label>IANA time zone<input value={values.zone} onChange={e => update({ ...values, zone: e.target.value })} /></label>
    <label className="check-label"><input type="checkbox" checked={values.confirmed} onChange={e => update({ ...values, confirmed: e.target.checked })} />I confirm this exact access pin</label>
  </fieldset>;
}
