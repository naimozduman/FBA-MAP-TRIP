import {it,expect} from 'vitest';
import { addCityToDay } from '@/lib/planning/add-city';
import { readyTrip } from '../helpers/fixtures';
import { ids } from '../helpers/database';
it('adding two sources in one city preserves a single shared window on the selected day',()=>{let t=readyTrip(1);const city={id:ids.city,name:'Synthetic QA city',state:'XX',zone:'America/Chicago',lat:38.5,lng:-91,overview:'',provenance:'',corridor:''};const source={id:crypto.randomUUID(),city_id:city.id,name:'Synthetic second source',category:'independent' as const,point:null,windows:null,evidence_url:null,checked_at:null,is_lead:true};t=addCityToDay(t,1,city,source);expect(t.days[1].visits).toHaveLength(1);expect(t.days[1].visits[0].stops).toHaveLength(2);expect(t.days[1].visits[0].reservedMinutes).toBe(240);expect(t.days[0].visits[0].stops).toHaveLength(1);t=addCityToDay(t,1,city);expect(t.days[1].visits).toHaveLength(1);});
