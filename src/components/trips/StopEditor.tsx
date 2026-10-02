"use client";
import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Clock } from "lucide-react";
import type { Stop } from "@/lib/model";
import { NumberField, PointFields } from "@/components/ui/Fields";
import { localInstant, compareInstants } from "@/lib/planning/time";
export default function StopEditor({ stop, date, zone, onChange, onRemove, onMove, index, count }: { stop: Stop; date: string; zone: string; onChange: (s: Stop) => void; onRemove: () => void; onMove: (direction: number) => void; index: number; count: number }) {
  const [expanded, setExpanded] = useState(false), [error, setError] = useState("");
  return <div className="stop-row">
    <div className="stop-top"><span className="stop-number">{index + 1}</span><label className="grow">Store / event name<input value={stop.name} onChange={e => onChange({ ...stop, name: e.target.value })} /></label><button className="icon-button" aria-label={"Move " + stop.name + " up"} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={18} /></button><button className="icon-button" aria-label={"Move " + stop.name + " down"} disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown size={18} /></button><button className="icon-button" aria-label={"Remove " + stop.name} onClick={onRemove}><Trash2 size={18} /></button></div>
    <div className="field-triple"><NumberField label="Sourcing minutes" min={1} value={stop.minutes} onChange={v => onChange({ ...stop, minutes: v ?? 1 })} /><NumberField label="Parking minutes" value={stop.parkingMinutes} onChange={v => onChange({ ...stop, parkingMinutes: v ?? 0 })} /><NumberField label="Loading minutes" value={stop.loadingMinutes} onChange={v => onChange({ ...stop, loadingMinutes: v ?? 0 })} /></div>
    <button className="text-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><Clock size={16} />{expanded ? "Hide location & opening windows" : "Edit location & opening windows"}</button>
    {expanded && <div className="stop-detail">
      <label>Source type<select value={stop.category} onChange={e => onChange({ ...stop, category: e.target.value as Stop["category"] })}>{["library_sale","independent","thrift","charity","church","estate","outlet","regular_goodwill","half_price_books","other"].map(c => <option key={c} value={c}>{c.replaceAll("_"," ")}</option>)}</select></label>
      {(stop.category === "regular_goodwill" || stop.category === "half_price_books") && <label>Explicit current-trip exception reason<input value={stop.exceptionReason} onChange={e => onChange({ ...stop, exceptionReason: e.target.value })} required /></label>}
      <PointFields point={stop.point} zone={zone} label="Exact store / event access" onChange={point => onChange({ ...stop, point })} />
      <form className="opening-form" onSubmit={e => {
        e.preventDefault(); const fields = new FormData(e.currentTarget);
        try {
          const day = String(fields.get("date")), z = stop.point?.zone || zone;
          const start = localInstant(day,String(fields.get("start")),z), end = localInstant(String(fields.get("endDate")),String(fields.get("end")),z);
          if(compareInstants(start,end)>=0) throw new Error("Closing must be after opening. Overnight openings need the next date.");
          const evidence = String(fields.get("evidence"));
          if(!evidence.startsWith("https://")) throw new Error("Provide the actual HTTPS source for these hours.");
          const checked = String(fields.get("checked"));
          if(!checked) throw new Error("Enter the actual source check date.");
          onChange({ ...stop, windows: [...(stop.windows || []),{ start,end }], evidenceUrl: evidence, checkedAt: new Date(checked + "T12:00:00Z").toISOString() }); setError("");
        } catch(err) { setError(err instanceof Error ? err.message : "Invalid local time or window."); }
      }}><h4>Dated opening / appointment window</h4><div className="field-pair"><label>Opening date<input name="date" type="date" defaultValue={date} required /></label><label>Opens<input name="start" type="time" required /></label></div><div className="field-pair"><label>Closing date<input name="endDate" type="date" defaultValue={date} required /></label><label>Closes<input name="end" type="time" required /></label></div><label>Hours / event source<input name="evidence" type="url" defaultValue={stop.evidenceUrl || ""} required /></label><label>Actually checked on<input name="checked" type="date" defaultValue={stop.checkedAt?.slice(0,10) || ""} required /></label><button className="secondary-button">Apply opening window</button></form>
      {error && <p role="alert">{error}</p>}
      {(stop.windows || []).map((w,i) => <div key={i} className="window-row"><span>{w.start} → {w.end}</span><button className="text-button" onClick={() => onChange({ ...stop, windows: stop.windows!.filter((_,j) => j!==i) })}>Remove window</button></div>)}
      <p className="secondary">Unknown hours remain unconfirmed. Opening at 6 a.m. is never inferred from departure.</p>
    </div>}
  </div>;
}
