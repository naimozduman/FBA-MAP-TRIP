"use client";
import { useState } from 'react';
import type { Opening } from '@/lib/model';
import { localInstant, compareInstants } from '@/lib/planning/time';
export default function WindowFields({label,window,onChange,date,zone}:{label:string;window:Opening|null;onChange:(v:Opening|null)=>void;date:string;zone:string}) {
  const [error,setError]=useState('');
  return <fieldset className="opening-form"><legend>{label}</legend>{window&&<p>{new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:zone}).format(new Date(window.start))} → {new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:zone}).format(new Date(window.end))} ({zone}) <button type="button" className="text-button" onClick={()=>onChange(null)}>Clear</button></p>}
    <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{const start=localInstant(String(f.get('startDate')),String(f.get('start')),zone),end=localInstant(String(f.get('endDate')),String(f.get('end')),zone);if(compareInstants(start,end)>=0)throw new Error('End must follow start.');onChange({start,end});setError('');}catch(err){setError(err instanceof Error?err.message:'Invalid date/time.');}}}>
      <div className="field-pair"><label>From date<input type="date" name="startDate" defaultValue={date} required/></label><label>From local time<input type="time" name="start" required/></label><label>Until date<input type="date" name="endDate" defaultValue={date} required/></label><label>Until local time<input type="time" name="end" required/></label></div><button className="secondary-button">Apply {label.toLowerCase()}</button>
    </form>{error&&<p role="alert">{error}</p>}
  </fieldset>;
}
