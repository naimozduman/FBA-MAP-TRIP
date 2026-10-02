"use client";
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { TripDraft, RouteResult, City, Point } from '@/lib/model';
import { routeWaypoints } from '@/lib/planning/schedule';
import ReferenceMap from './ReferenceMap';
const LiveMap=dynamic(()=>import('./LiveMap'),{ssr:false});
export default function TripRouteMap({trip,route,cities,onExplore}:{trip:TripDraft;route:RouteResult;cities:City[];onExplore:(c:City)=>void}){
 const points=useMemo(()=>{try{return routeWaypoints(trip).map(w=>w.point);}catch{return [] as Point[];}},[trip]);
 return <section className="trip-route-map"><h3>Round-trip road geometry</h3><div className="route-map-canvas">{process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?<LiveMap cities={cities} selected={null} onSelect={onExplore} legs={route.legs} points={points}/>:<ReferenceMap cities={cities} selected={null} onSelect={onExplore} legs={route.legs} points={points}/>}</div><p className="route-legend"><span>Forest: outbound / intercity</span><span>Ochre: local transfers</span><span>Rust: return home</span></p><p className="secondary">{route.status==='available'?'Only provider-returned geometry is drawn. Standard car routing does not guarantee truck clearance.':'Route unavailable. No driving lines are drawn.'}</p><div className="crew-options">{cities.map(c=><button key={c.id} className="text-button" onClick={()=>onExplore(c)}>Explore {c.name}</button>)}</div></section>;
}
