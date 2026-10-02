import type { TripDraft,City,Source,SourceEvent } from '@/lib/model';
import { newCityVisit,newStop } from './draft';
export function addCityToDay(trip:TripDraft,dayIndex:number,city:City,source?:Source,event?:SourceEvent):TripDraft{
 const index=Math.max(0,Math.min(dayIndex,trip.days.length-1));
 return {...trip,days:trip.days.map((day,i)=>{if(i!==index)return day;
  const existing=day.visits.find(v=>v.cityId===city.id);
  const stop=source?{...newStop(),sourceId:source.id,eventId:event?.id||null,kind:event?'event' as const:'store' as const,name:event?.name||source.name,category:source.category,point:source.point,windows:event?event.windows:source.windows,evidenceUrl:event?event.evidence_url:source.evidence_url,checkedAt:event?event.checked_at:source.checked_at}:null;
  if(existing)return {...day,visits:day.visits.map(v=>v.id===existing.id&&stop?{...v,stops:[...v.stops,stop]}:v)};
  const visit=newCityVisit(city);if(stop)visit.stops=[stop];return {...day,visits:[...day.visits,visit]};
 })};
}
