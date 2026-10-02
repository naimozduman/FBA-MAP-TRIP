import type { City, Point } from '@/lib/model';
export type CityEstimate={status:'available'|'unavailable';minutes:number|null;miles:number|null;reason:string;fetchedAt:string|null};
export async function cityEstimate(origin:Point|null,city:City,token:string|undefined,request:typeof fetch=fetch):Promise<CityEstimate>{
 const fail=(reason:string):CityEstimate=>({status:'unavailable',minutes:null,miles:null,reason,fetchedAt:null});
 if(!origin?.confirmed||origin.precision!=='exact')return fail('Route unavailable: confirm the exact private base first.');
 if(!token)return fail('Route unavailable: Mapbox Directions is not configured.');
 if(city.lat===null||city.lng===null)return fail('Route unavailable: city reference coordinates are unknown.');
 const url=new URL('https://api.mapbox.com/directions/v5/mapbox/driving/'+origin.lng+','+origin.lat+';'+city.lng+','+city.lat);url.searchParams.set('access_token',token);url.searchParams.set('overview','false');
 try{const response=await request(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)return fail(response.status===429?'Route unavailable: provider limit reached.':'Route unavailable: provider request failed.');const payload=await response.json();const route=payload.routes?.[0];if(payload.code!=='Ok'||!route||!Number.isFinite(route.duration)||!Number.isFinite(route.distance)||route.duration<0||route.distance<0)return fail('Route unavailable: no usable road estimate.');return {status:'available',minutes:route.duration/60,miles:route.distance/1609.344,reason:'Approximate city-centre estimate · typical/static car driving · not store navigation',fetchedAt:new Date().toISOString()};}catch{return fail('Route unavailable: provider or network failure.');}
}
