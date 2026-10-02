"use client";
import { useState } from "react";
import type { WorkspaceData } from "@/lib/model";
import { NumberField } from "@/components/ui/Fields";
import { localInstant } from "@/lib/planning/time";
export default function Results({data,preview,onSave}:{data:WorkspaceData;preview:boolean;onSave:(body:Record<string,unknown>)=>Promise<void>}) {
  const [city,setCity]=useState(data.cities[0]?.id||""),[bought,setBought]=useState<number|null>(null),[scanned,setScanned]=useState<number|null>(null),[usable,setUsable]=useState<number|null>(null),[cost,setCost]=useState<number|null>(null),[minutes,setMinutes]=useState<number|null>(null),[message,setMessage]=useState(""),[mutationKey,setMutationKey]=useState(()=>crypto.randomUUID()),[busy,setBusy]=useState(false);
  return <div className="results-page"><section><h1>Visits & results</h1><p>Keep the good sources and the dead stops. Acquired books are not realized sales profit.</p>
    <form onSubmit={async e=>{e.preventDefault();const v=new FormData(e.currentTarget);setBusy(true);try{
      const c=data.cities.find(c=>c.id===city);if(!c)throw new Error("Choose a city.");
      await onSave({city_id:city,source_id:String(v.get("source"))||null,trip_id:null,visited_at:localInstant(String(v.get("date")),String(v.get("time")),c.zone),bought,scanned,usable,purchase_cents:cost===null?null:Math.round(cost*100),minutes,notes:String(v.get("notes")),mutation_key:mutationKey});
      setMessage("Visit saved to the shared workspace.");setMutationKey(crypto.randomUUID());
    }catch(err){setMessage(err instanceof Error?err.message:"Visit not saved.");}finally{setBusy(false);}}}>
      <label>City<select value={city} onChange={e=>setCity(e.target.value)}>{data.cities.map(c=><option value={c.id} key={c.id}>{c.name}, {c.state}</option>)}</select></label><label>Actual source (optional)<select name="source"><option value="">Source not linked</option>{data.sources.filter(s=>s.city_id===city).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <div className="field-pair"><label>Visit local date<input name="date" type="date" required/></label><label>Visit local time<input name="time" type="time" required/></label></div>
      <div className="field-triple"><NumberField label="Books scanned" value={scanned} onChange={setScanned}/><NumberField label="Books bought (0 is meaningful)" value={bought} onChange={setBought}/><NumberField label="Observed / estimated usable books" value={usable} onChange={setUsable}/><NumberField label="Purchase cash ($)" step={0.01} value={cost} onChange={setCost}/><NumberField label="Sourcing minutes" value={minutes} onChange={setMinutes}/></div><label>Visit / source notes<textarea name="notes" maxLength={10000}/></label>
      {preview?<a className="secondary-button" href="/sign-in">Sign in to record results</a>:<button className="primary" disabled={busy}>{busy?"Saving…":"Save sourcing result"}</button>}
      {message&&<p role="status" className="notice">{message}</p>}
    </form>
  </section><section><h2>Our visit history</h2>{!data.visits.length?<p>No imported or recorded visits. Opportunities remain untested.</p>:<ul className="results-list">{data.visits.map(v=><li key={v.id}><h3>{data.cities.find(c=>c.id===v.city_id)?.name||"City reference unresolved"}</h3><span>{v.visited_at.slice(0,10)} · {v.bought===null?"Bought unknown":v.bought+" bought"} · {v.usable===null?"Usable unknown":v.usable+" usable"}</span><p>{v.notes}</p></li>)}</ul>}</section></div>;
}
