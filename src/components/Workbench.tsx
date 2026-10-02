"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, CalendarDays, List, Settings, Plus, MapPin, Pencil, Menu, LogOut, RefreshCw } from "lucide-react";
import type { City, Source, SourceEvent, TripDraft, WorkspaceData, RouteResult, Point } from "@/lib/model";
import { tripSchema } from "@/lib/model";
import { newTrip } from "@/lib/planning/draft";
import { addCityToDay } from '@/lib/planning/add-city';
import { buildSchedule } from "@/lib/planning/schedule";
import { routeRevision } from "@/lib/routing/revision";
import { tripConflicts } from "@/lib/planning/transport";
import ReferenceMap from "./map/ReferenceMap";
import CityPanel from "./cities/CityPanel";
import CatalogDialog from "./cities/CatalogDialog";
import TripPlanner from "./trips/TripPlanner";
import Results from "./results/Results";
import Dialog from "./ui/Dialog";
import { PointFields } from "./ui/Fields";
import { browserClient } from "@/lib/supabase/browser";
const LiveMap=dynamic(()=>import("./map/LiveMap"),{ssr:false,loading:()=> <div className="map-loading">Loading geographic map…</div>});
const emptyRoute=(revision:string,reason:string):RouteResult=>({status:"unavailable",revision,reason,legs:[]});
export default function Workbench({initialData,preview,userId}:{initialData:WorkspaceData;preview:boolean;userId:string|null}) {
  const router = useRouter();
  const [data,setData]=useState(initialData),[tab,setTab]=useState<"Explore"|"Trips"|"Results"|"Settings">("Explore"),[query,setQuery]=useState(""),[corridor,setCorridor]=useState(""),[selected,setSelected]=useState<City|null>(()=>initialData.cities.find(c=>c.name==="Rolla")||initialData.cities[0]||null),[sheet,setSheet]=useState(false),[menu,setMenu]=useState(false),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[baseDialog,setBaseDialog]=useState(false),[base,setBase]=useState<Point|null>(initialData.origin),[catalog,setCatalog]=useState<"source"|"food"|"city"|"vehicle"|"event"|null>(null);
  const [trip,setTrip]=useState<TripDraft>(()=>{const date=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());return {...newTrip(initialData.members.map(m=>m.user_id),date),origin:initialData.origin};});
  const revision=routeRevision(trip), latest=useRef(trip);
  const [activeDay,setActiveDay]=useState(0);
  const [road,setRoad]=useState<RouteResult>(()=>emptyRoute("","Route unavailable: confirm actual source addresses and provider access.")),[autoRoute,setAutoRoute]=useState(false);
  useEffect(()=>{latest.current=trip;},[trip]);
  const route=road.revision===revision?road:emptyRoute(revision,"Route unavailable: itinerary changed; geometry must be recalculated.");
  const cities=data.cities.filter(c=>(c.name+" "+c.state).toLowerCase().includes(query.toLowerCase())&&(!corridor||c.corridor===corridor||data.corridorCities.some(m=>m.city_id===c.id&&m.corridor_id===corridor)));
  const conflicts=useMemo(()=>tripConflicts(trip,data.trips),[trip,data.trips]);
  const schedule=useMemo(()=>buildSchedule(trip,road.revision===revision?road.legs:[],conflicts),[trip,road,revision,conflicts]);
  async function request(path:string,body?:unknown) {
    if(preview||!data.workspaceId)throw new Error("Sign in to use shared persistence and authenticated road routing. This preview is unsaved.");
    const response=await fetch("/api/workspaces/"+data.workspaceId+"/"+path,{method:body===undefined?"GET":"POST",headers:body===undefined?undefined:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body),cache:"no-store"});
    const result=await response.json();if(!response.ok)throw new Error(result.error||"Operation not confirmed.");return result;
  }
  async function reload() { const result=await request("data");setData(result as WorkspaceData); }
  async function runRoute(signal?:AbortSignal) {
    if(preview||!data.workspaceId){setRoad(emptyRoute(routeRevision(latest.current),"Route unavailable: sign in and configure Mapbox Directions."));return;}
    const draft=latest.current;
    try {
      const response=await fetch("/api/workspaces/"+data.workspaceId+"/routes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft),signal,cache:"no-store"});
      const result=await response.json();
      if(signal?.aborted)return;
      const currentRevision=routeRevision(latest.current);
      if(currentRevision!==routeRevision(draft))return;
      setRoad(response.ok?result:emptyRoute(currentRevision,result.error||"Route unavailable."));
    } catch { if(!signal?.aborted)setRoad(emptyRoute(routeRevision(draft),"Route unavailable: network or provider failure.")); }
  }
  useEffect(()=>{
    if(!autoRoute)return;
    const controller=new AbortController();
    const timeout=setTimeout(()=>{void runRoute(controller.signal);},650);
    return()=>{clearTimeout(timeout);controller.abort();};
    // The ordered-point revision drives provider queries; work durations and costs do not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[revision,autoRoute,data.workspaceId,preview]);
  function selectCity(city:City){setSelected(city);setSheet(true);setMessage("");}
  function addCity(city:City,source?:Source,event?:SourceEvent){
    setTrip(t=>addCityToDay(t,activeDay,city,source,event));setTab("Trips");setSheet(false);setMessage("Added explicitly to Day "+(Math.min(activeDay,trip.nights)+1)+". Sources in the same city share one work window; verify its full schedule.");
  }
  function freshTrip(){setTrip({...newTrip(data.members.map(m=>m.user_id),trip.days[0].date),origin:data.origin});setActiveDay(0);setAutoRoute(false);setTab("Trips");setMessage("New unsaved trip. Saved trips remain in the workspace.");}
  const navItems=[{name:"Explore",Icon:Search},{name:"Trips",Icon:CalendarDays},{name:"Results",Icon:List},{name:"Settings",Icon:Settings}] as const;
  return <div className="app-shell">
    <header className="app-header"><Link className="wordmark" href="/">Fieldwork</Link><button className="icon-button mobile-only" aria-label="Open navigation" aria-expanded={menu} onClick={()=>setMenu(!menu)}><Menu/></button><nav className={menu?"open":""} aria-label="Main navigation">{navItems.map(({name,Icon})=><button key={name} className={tab===name?"active":""} aria-current={tab===name?"page":undefined} onClick={()=>{setTab(name);setMenu(false);setSheet(false);}}><Icon size={20}/>{name}</button>)}</nav><button className="primary new-trip-button" onClick={freshTrip}><Plus size={19}/>New trip</button>{!preview&&<button className="icon-button" aria-label="Sign out" onClick={async()=>{const result=await browserClient().auth.signOut();if(result.error)setMessage("Sign-out could not be confirmed.");else {router.replace("/sign-in");router.refresh();}}}><LogOut size={20}/></button>}</header>
    <div className="app-status">{preview?<><span>Preview · no live data imported</span><a href="/sign-in">Sign in to save</a></>:<><span>Private Fieldwork workspace · {data.members.find(m=>m.user_id===userId)?.display_name}</span><button className="text-button" onClick={()=>{void reload().catch(e=>setMessage(e.message));}}><RefreshCw size={14}/>Reload workspace</button></>}</div>
    {message&&<div className="app-message" role="status">{message}<button className="text-button" onClick={()=>setMessage("")}>Dismiss</button></div>}
    <main id="main" className={"app-main "+(tab==="Explore"?"explore-main":"")} data-tab={tab}>
      {tab==="Explore"&&<div className={"explore-layout "+(sheet?"sheet-open":"")}>
        <aside className="city-rail"><h1>Explore cities</h1><label className="search-field"><Search size={19}/><span className="sr-only">Search cities</span><input placeholder="Search cities…" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="corridor-filter">Discovery corridor<select value={corridor} onChange={e=>setCorridor(e.target.value)}><option value="">All sourcing cities</option>{data.corridors.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}{Array.from(new Set(data.cities.map(c=>c.corridor))).filter(Boolean).map(c=><option key={c}>{c}</option>)}</select></label><div className="city-list">{cities.map(c=><button data-cityid={c.id} key={c.id} className={selected?.id===c.id?"selected":""} onClick={()=>selectCity(c)}><MapPin size={19}/><span>{c.name}, {c.state}</span><span className="sr-only">Explore city</span></button>)}</div>{!cities.length&&<p>No cities match. Import actual data or add a sourced city.</p>}<button className="text-button" onClick={()=>setCatalog("city")}><Plus size={16}/>Add sourcing city</button><p className="rail-note">{preview?"Territory references reconstructed from the handoff. The advertised 15 corridors / 108 places are not imported or reconciled.":"Catalog records are workspace-private; city leads are not confirmed stores."}</p></aside>
        <div className="map-region">{process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?<LiveMap cities={cities} selected={selected?.id||null} onSelect={selectCity} legs={route.legs} points={data.origin?[data.origin]:[]}/>:<ReferenceMap cities={cities} selected={selected?.id||null} onSelect={selectCity} legs={route.legs} points={data.origin?[data.origin]:[]}/>}</div>
        {selected?<CityPanel key={selected.id} onExplore={selectCity} onNewEvent={()=>setCatalog("event")} onNote={async body=>{await request("notes",body);await reload();setMessage("City note saved to the workspace.");}} city={selected} data={data} preview={preview} onAdd={()=>addCity(selected)} onClose={()=>{setSheet(false);document.querySelector<HTMLButtonElement>('button[data-cityid="'+CSS.escape(selected.id)+'"]')?.focus();}} onSource={(s,e)=>addCity(selected,s,e)} targetDay={Math.min(activeDay,trip.nights)+1} onNewSource={()=>setCatalog("source")}/>:<aside className="city-panel"><h2>Explore a city</h2><p>Select a geographic reference or import the actual Fieldwork catalog.</p></aside>}
      </div>}
      {tab==="Trips"&&<><div className="conflict-banner">{conflicts.map(c=><p className="notice" key={c}>{c}</p>)}</div><TripPlanner key={trip.id} dayIndex={activeDay} onDayChange={setActiveDay} onExplore={city=>{selectCity(city);setTab("Explore");}} trip={trip} data={data} preview={preview} schedule={schedule} route={route} onChange={setTrip} onNew={freshTrip} onLoad={t=>{setTrip(t);setActiveDay(0);setMessage("Loaded persisted workspace trip.");}} busy={busy} onRoute={()=>{if(autoRoute)void runRoute();else setAutoRoute(true);}} onSave={()=>{setBusy(true);void request("trips",trip).then(result=>{const saved=tripSchema.parse(result.trip);setTrip(saved);setData(d=>({...d,trips:[...d.trips.filter(t=>t.id!==saved.id),saved]}));setMessage("Trip persisted to the shared workspace. "+(result.conflicts?.join(" ")||""));}).catch(e=>setMessage(e.message)).finally(()=>setBusy(false));}}/></>}
      {tab==="Results"&&<Results data={data} preview={preview} onSave={async body=>{await request("visits",body);await reload();}}/>}
      {tab==="Settings"&&<div className="settings-page"><h1>Workspace settings</h1><section><h2>Private base</h2><p>{data.origin?.label||"Affton / Lakeshire area — approximate"}</p><p>{data.origin?.confirmed?"Exact departure pin confirmed.":"An exact pin must be confirmed before reliable trip times."}</p><button className="secondary-button" onClick={()=>{setBase(data.origin);setBaseDialog(true);}}>Edit shared base</button></section><section><h2>Source preferences</h2><p>Prioritize low-cost library sales, independent sellers, thrift/charity/church/estate sources and outlets. Regular Goodwill retail and Half Price Books are excluded by default; a trip-specific exception needs a reason.</p></section><section><h2>Shared workspace</h2><ul>{data.members.map(m=><li key={m.user_id}>{m.display_name} · {preview?"reference crew, not an account":m.role}</li>)}</ul><p>Invite-only. No shared password or automatic invitations.</p></section><section><h2>Vehicle resources</h2><p>Actual people, vehicles, capacities and eligible drivers must be confirmed. Parallel plans cannot reuse the same resource at the same time.</p><button className="secondary-button" onClick={()=>setCatalog("vehicle")}>Add vehicle resource</button></section><section><h2>Food evidence</h2><p>Record an actual business, source and checked date. Cuisine never establishes halal status.</p><label>City<select value={selected?.id||""} onChange={e=>setSelected(data.cities.find(c=>c.id===e.target.value)||null)}>{data.cities.map(c=><option key={c.id} value={c.id}>{c.name}, {c.state}</option>)}</select></label><button className="secondary-button" disabled={!selected} onClick={()=>setCatalog("food")}>Add food evidence</button></section></div>}
    </main>
    <footer className="app-footer"><MapPin size={19}/><span>{data.origin?.label||"Affton / Lakeshire area — approximate"}</span><button className="text-button" onClick={()=>{setBase(data.origin);setBaseDialog(true);}}><Pencil size={16}/>Edit base</button></footer>
    {baseDialog&&<Dialog title="Confirm the private base" onClose={()=>setBaseDialog(false)}><p>Affton / Lakeshire is a provisional area. Enter your actual access pin; no street address is guessed.</p><PointFields point={base} onChange={setBase} label="Private departure point"/><button className="primary" disabled={!base} onClick={()=>{if(preview){setData(d=>({...d,origin:base}));setTrip(t=>({...t,origin:base}));setMessage("Base changed in this unsaved preview only.");setBaseDialog(false);return;}void request("settings",base).then(()=>{setData(d=>({...d,origin:base}));setTrip(t=>({...t,origin:base}));setBaseDialog(false);setMessage("Private workspace base saved.");}).catch(e=>setMessage(e.message));}}>{preview?"Use in unsaved preview":"Save private shared base"}</button></Dialog>}
    {catalog&&<CatalogDialog sources={data.sources} kind={catalog} city={selected} preview={preview} onClose={()=>setCatalog(null)} onSave={async body=>{await request("catalog",body);await reload();setMessage("Workspace catalog record saved with its provided evidence.");}}/>}
  </div>;
}
