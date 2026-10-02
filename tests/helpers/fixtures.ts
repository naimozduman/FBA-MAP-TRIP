import type { TripDraft, Point, RouteLeg } from '@/lib/model';
import { newTrip, newCityVisit, newStop, withNights } from '@/lib/planning/draft';
import { routeWaypoints } from '@/lib/planning/schedule';
import { localInstant } from '@/lib/planning/time';
import { ids } from './database';
export const testPoint=(id:string,zone='America/Chicago'):Point=>({id,label:'Synthetic '+id,address:'Synthetic test access — not a real venue',lat:38.5,lng:-91,zone,precision:'exact',confirmed:true});
export function readyTrip(nights=0):TripDraft{
 let trip=withNights(newTrip([ids.owner,ids.partner],'2026-10-05'),nights);
 trip={...trip,origin:testPoint('base'),returnLocal:'18:00',driveBufferMinutes:0,transport:{...trip.transport,vehicleIds:['30000000-0000-4000-8000-000000000001'],driverAssignments:[{vehicleId:'30000000-0000-4000-8000-000000000001',userId:ids.owner}],eligibleDrivers:1,payloadKg:500,cargoKg:100,peopleGearKg:160,capacityLiters:700,cargoLiters:300},economics:{...trip.economics,usableBooks:100,contributionPerBookCents:200,contributionBasis:'Synthetic acquisition/fees/processing deducted',costs:[{id:'cost',name:'Synthetic travel estimate',cents:5000,basis:'fuel',vehicleId:null,pricing:'fixed',centsPerMile:null}]}};
 trip.days=trip.days.map((day,i)=>{const city=newCityVisit({id:ids.city,name:'Synthetic QA city',state:'XX',zone:'America/Chicago',lat:38.5,lng:-91,overview:'',provenance:'test only',corridor:''});const stop={...newStop(),name:'Synthetic source A',point:testPoint('store-'+i),minutes:180,windows:[{start:localInstant(day.date,'08:00',city.zone),end:localInstant(day.date,'18:00',city.zone)}],evidenceUrl:'https://example.invalid/test-only',checkedAt:'2026-10-01T12:00:00Z'};city.stops=[stop];return {...day,visits:[city],hotel:i<nights?testPoint('lodging-'+i):null,hotelConfirmed:i<nights,checkInWindow:i<nights?{start:localInstant(day.date,'13:00',city.zone),end:localInstant(day.date,'23:00',city.zone)}:null};});return trip;
}
export function syntheticLegs(trip:TripDraft,minutes=60):RouteLeg[]{const points=routeWaypoints(trip);return points.slice(1).map((w,i)=>({from:points[i].point.id,to:w.point.id,seconds:minutes*60,meters:60000,geometry:[[-91,38.5],[-90.9,38.55],[-90.8,38.6]],kind:w.kind,provider:'mapbox',fetchedAt:'2026-10-01T12:00:00Z'}));}
