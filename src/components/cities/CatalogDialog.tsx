"use client";
import { useState } from 'react';
import type { City, Point, Source, Opening } from '@/lib/model';
import Dialog from '@/components/ui/Dialog';
import { PointFields, NumberField } from '@/components/ui/Fields';
import WindowFields from '@/components/ui/WindowFields';
type Kind='source'|'food'|'city'|'vehicle'|'event';
export default function CatalogDialog({kind,city,sources,onClose,onSave,preview}:{kind:Kind;city:City|null;sources:Source[];onClose:()=>void;onSave:(body:Record<string,unknown>)=>Promise<void>;preview:boolean}){
 const [point,setPoint]=useState<Point|null>(null),[window,setWindow]=useState<Opening|null>(null),[lat,setLat]=useState<number|null>(null),[lng,setLng]=useState<number|null>(null),[payload,setPayload]=useState<number|null>(null),[volume,setVolume]=useState<number|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:city?.zone||'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 return <Dialog title={{source:'Record a source / lead',food:'Record food evidence',city:'Add sourcing city',vehicle:'Add a vehicle resource',event:'Record a dated source event'}[kind]} onClose={onClose}>
  {preview&&<p className="notice">Reference preview. Sign in to persist workspace records.</p>}
  {(kind==='source'||kind==='food')&&<PointFields point={point} onChange={setPoint} zone={city?.zone} label="Actual access location (if known)"/>}
  {['source','food','event'].includes(kind)&&<WindowFields label="Dated opening / event window" window={window} onChange={setWindow} date={today} zone={point?.zone||city?.zone||'America/Chicago'}/>}
  <form onSubmit={async e=>{e.preventDefault();const values=new FormData(e.currentTarget);setBusy(true);setError('');try{
   const name=String(values.get('name')),evidence=String(values.get('evidence')||'').trim()||null,checked=String(values.get('checked')||''),checkedAt=checked?new Date(checked+'T12:00:00Z').toISOString():null;let body:Record<string,unknown>;
   if(kind==='city')body={kind,name,state:String(values.get('state')),zone:String(values.get('zone')),lat,lng,overview:String(values.get('overview')),provenance:String(values.get('provenance')),corridor:String(values.get('corridor'))};
   else if(kind==='vehicle')body={kind,name,payload_kg:payload,volume_liters:volume};
   else if(kind==='event')body={kind,name,source_id:String(values.get('source_id')),windows:window?[window]:null,evidence_url:evidence,checked_at:checkedAt};
   else if(kind==='food')body={kind,name,city_id:city?.id,status:String(values.get('status')),evidence_url:evidence,checked_at:checkedAt,scope:String(values.get('scope')),point,windows:window?[window]:null};
   else body={kind,name,city_id:city?.id,category:String(values.get('category')),is_lead:values.get('lead')==='on',point,windows:window?[window]:null,evidence_url:evidence,checked_at:checkedAt};
   await onSave(body);onClose();
  }catch(err){setError(err instanceof Error?err.message:'Not saved.');}finally{setBusy(false);}}}>
   <label>{kind==='vehicle'?'Vehicle resource name':'Actual name'}<input name="name" required maxLength={200}/></label>
   {kind==='city'&&<><div className="field-pair"><label>State<input name="state" required/></label><label>IANA time zone<input name="zone" defaultValue="America/Chicago" required/></label></div><div className="field-pair"><NumberField label="Approximate city latitude" value={lat} min={-90} max={90} onChange={setLat}/><NumberField label="Approximate city longitude" value={lng} min={-180} max={180} onChange={setLng}/></div><label>Factual overview<textarea name="overview"/></label><label>Overview / location provenance<textarea name="provenance"/></label><label>Discovery corridor label<input name="corridor"/></label></>}
   {kind==='vehicle'&&<div className="field-pair"><NumberField label="Verified usable payload kg" value={payload} onChange={setPayload}/><NumberField label="Verified usable cargo liters" value={volume} onChange={setVolume}/></div>}
   {kind==='source'&&<><label>Source type<select name="category">{['library_sale','independent','thrift','charity','church','estate','outlet','regular_goodwill','half_price_books','other'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label><label className="check-label"><input type="checkbox" name="lead" defaultChecked/>Unconfirmed / recurring lead</label><p className="secondary">Uncheck only with exact access, dated opening hours and checked evidence. A recurring lead is separate from a dated sale.</p></>}
   {kind==='event'&&<label>Hosting source<select name="source_id" required><option value="">Choose an actual source</option>{sources.filter(s=>s.city_id===city?.id).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
   {kind==='food'&&<><label>Halal evidence status<select name="status"><option value="unverified">Unverified</option><option value="community_reported">Community reported</option><option value="business_stated">Business stated</option><option value="certified">Certified</option></select></label><label>Scope / certifier / partial menu<textarea name="scope"/></label></>}
   {['source','food','event'].includes(kind)&&<><label>Actual evidence URL<input name="evidence" type="url" placeholder="https://"/></label><label>Actually checked on<input name="checked" type="date"/></label></>}
   {error&&<p role="alert" className="notice">{error}</p>}<button className="primary" disabled={busy||preview}>{busy?'Saving…':'Save workspace record'}</button>{preview&&<a href="/sign-in">Sign in to save</a>}
  </form>
 </Dialog>;
}
