"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { City, RouteLeg, Point } from "@/lib/model";
import ReferenceMap from "./ReferenceMap";
export default function LiveMap({ cities, selected, onSelect, legs, points=[] }: { cities: City[]; selected: string | null; onSelect: (c: City) => void; legs: RouteLeg[]; points?: Point[] }) {
  const container = useRef<HTMLDivElement>(null), map = useRef<mapboxgl.Map | null>(null);
  const latestSelect = useRef(onSelect), [failed, setFailed] = useState(false);
  useEffect(() => { latestSelect.current=onSelect; },[onSelect]);
  useEffect(() => {
    if (!container.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
    const instance = new mapboxgl.Map({ container: container.current, style: "mapbox://styles/mapbox/light-v11", center: [-90.34,38.55], zoom: 5.1, attributionControl: true });
    map.current=instance;
    instance.addControl(new mapboxgl.NavigationControl());
    instance.on("error", () => setFailed(true));
    instance.on("load", () => {
      for (const layer of instance.getStyle().layers || []) {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) { instance.setPaintProperty(layer.id,'text-color','#202a22'); instance.setPaintProperty(layer.id,'text-halo-color','#fffdf8'); instance.setPaintProperty(layer.id,'text-halo-width',1.5); }
        if (layer.type === 'line' && /road.*(motorway|trunk|primary|secondary)/.test(layer.id)) { instance.setPaintProperty(layer.id,'line-color','#657160'); instance.setPaintProperty(layer.id,'line-opacity',1); }
      }
      instance.addSource("fieldwork-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      instance.addLayer({ id: "route-casing", type: "line", source: "fieldwork-route", paint: { "line-color": "#fffdf8", "line-width": 8 } });
      instance.addLayer({ id: "route", type: "line", source: "fieldwork-route", paint: { "line-color": ["match",["get","kind"],"return","#994a2f","local","#795c24","#304b3c"], "line-width": 4 } });
    });
    return () => { instance.remove(); map.current=null; };
  },[]);
  useEffect(() => {
    const instance = map.current;
    if(!instance) return;
    const markers = cities.filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lng)).map(city => {
      const button = document.createElement("button"); button.type="button"; button.className="live-marker";
      button.textContent=city.name; button.setAttribute("aria-label","Explore city " + city.name + ", " + city.state);
      button.dataset.selected=String(selected===city.id);
      button.onclick=e => { e.stopPropagation(); latestSelect.current(city); };
      return new mapboxgl.Marker({ element: button }).setLngLat([city.lng!,city.lat!]).addTo(instance);
    });
    return () => markers.forEach(m => m.remove());
  },[cities,selected]);
  useEffect(()=>{
    const instance=map.current;if(!instance)return;
    const markers=points.map(p=>{const el=document.createElement('span');el.className='route-point';el.textContent=p.label;return new mapboxgl.Marker({element:el}).setLngLat([p.lng,p.lat]).addTo(instance);});
    return()=>markers.forEach(m=>m.remove());
  },[points]);
  useEffect(() => {
    const instance=map.current; if(!instance) return;
    const update = () => { (instance.getSource("fieldwork-route") as mapboxgl.GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: legs.map(l => ({ type: "Feature", properties: { kind:l.kind }, geometry: { type:"LineString",coordinates:l.geometry } })) });
      if(legs.length){const bounds=new mapboxgl.LngLatBounds();legs.forEach(l=>l.geometry.forEach(p=>bounds.extend(p)));instance.fitBounds(bounds,{padding:65,maxZoom:12,duration:0});}
    };
    if(instance.isStyleLoaded()) update(); else instance.once("load",update);
  },[legs]);
  if(failed) return <ReferenceMap cities={cities} selected={selected} onSelect={onSelect} legs={legs} points={points} />;
  return <div className="live-map" ref={container} aria-label="City exploration map" />;
}
