"use client";
import { useMemo } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, Objects } from "topojson-specification";
import type { FeatureCollection } from "geojson";
import states from "us-atlas/states-10m.json";
import type { City, RouteLeg, Point } from "@/lib/model";
const visible = new Set(["29","20","17","18","21","47","05","19","31","40","39"]);
const topology = states as unknown as Topology<Objects>;
const referenceShapes = feature(topology, topology.objects.states) as FeatureCollection;
export default function ReferenceMap({ cities, selected, onSelect, legs, points=[] }: { cities: City[]; selected: string | null; onSelect: (c: City) => void; legs: RouteLeg[]; points?: Point[] }) {
  const { projection, path, shapes } = useMemo(() => {
    const shapes = referenceShapes;
    const projection = geoMercator().center([-90.5,38.7]).scale(2700).translate([380,350]);
    const coordinates=legs.flatMap(l=>l.geometry);
    if(coordinates.length>1&&new Set(coordinates.map(p=>p.join(','))).size>1)projection.fitExtent([[70,60],[690,610]],{type:'LineString',coordinates});
    return { projection, path: geoPath(projection), shapes };
  }, [legs]);
  return <div className="reference-map">
    <span className="map-note">{legs.length?'Provider road geometry · reference basemap':'Reference geography · route unavailable'}</span>
    <svg viewBox="0 0 760 700" role="group" aria-label="Midwest reference geography. Use the city list to explore.">
      <rect width="760" height="700" fill="#e8eddf" />
      {shapes.features.filter(s => visible.has(String(s.id).padStart(2,"0"))).map(s => <path key={s.id} d={path(s) || ""} fill="#eef0e3" stroke="#748473" strokeWidth="1.4" />)}
      {[["MISSOURI",-92.9,38.1],["KANSAS",-96,38.8],["ILLINOIS",-89.1,40.2],["INDIANA",-86.5,40.5],["ARKANSAS",-92.5,35.7],["IOWA",-93.5,41.3]].map(([name,lng,lat]) => {
        const p = projection([Number(lng),Number(lat)])!;
        return <text key={name} x={p[0]} y={p[1]} className="state-label">{name}</text>;
      })}
      {legs.map((leg,i) => <g key={i}><path d={path({ type: "LineString", coordinates: leg.geometry }) || ""} fill="none" stroke="#fffdf8" strokeWidth="8" /><path d={path({ type: "LineString", coordinates: leg.geometry }) || ""} fill="none" stroke={leg.kind === "return" ? "#994a2f" : leg.kind==='local'?'#795c24':"#304b3c"} strokeWidth="4" /></g>)}
      {points.map(p=>{const xy=projection([p.lng,p.lat])!;return <g key={p.id} transform={'translate('+xy[0]+','+xy[1]+')'}><rect x="-6" y="-6" width="12" height="12" fill="#202a22" stroke="#fffdf8" strokeWidth="2"/><text x="10" y="-10" className="city-label">{p.label}</text></g>;})}
      {cities.filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lng)).map(c => {
        const p = projection([c.lng!,c.lat!])!;
        return <g key={c.id} className="map-marker" onClick={() => onSelect(c)} onKeyDown={e => { if(e.key==="Enter" || e.key===" ") { e.preventDefault(); onSelect(c); } }} role="button" tabIndex={0} aria-label={"Explore city " + c.name + ", " + c.state} transform={"translate(" + p[0] + "," + p[1] + ")"}>
          <circle r="23" fill="transparent" /><circle r={selected === c.id ? 10 : 8} fill={selected === c.id ? "#994a2f" : "#304b3c"} stroke="#fffdf8" strokeWidth="3" />
          <text x="15" y="5" className="city-label">{c.name}</text>
        </g>;
      })}
    </svg>
    <div className="map-footer">{points.length&&points.every(p=>p.precision==='exact'&&p.confirmed)?'Selected exact access points · workspace private':'Approximate city markers · Affton / Lakeshire base unconfirmed'}</div>
  </div>;
}
