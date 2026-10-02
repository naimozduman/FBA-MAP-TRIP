import type { Schedule } from "@/lib/planning/schedule";
import { displayTime } from "@/lib/planning/time";
export default function Timeline({ schedule, zone }: { schedule: Schedule; zone:string }) {
  return <section className="timeline"><h2>Door-to-door schedule</h2><div className={"schedule-status " + schedule.status} role="status"><strong>{schedule.status.charAt(0).toUpperCase()+schedule.status.slice(1)}</strong><ul>{schedule.reasons.map(r => <li key={r}>{r}</li>)}</ul></div>
    <p className="secondary">Provider estimates and configured buffers are not a guarantee. Unknown driving never becomes zero minutes.</p>
    <ol>{schedule.activities.map(a => <li key={a.id} className={"activity " + a.kind}><div className="activity-time">{displayTime(a.start,a.zone)}</div><div><strong>{a.label}</strong><span>Day {a.day+1} · {a.minutes === null ? "Duration unconfirmed" : Math.round(a.minutes) + " minutes"}{a.routeKind ? " · " + a.routeKind : ""}</span></div></li>)}</ol>
    <div className="schedule-totals"><span>Return: {displayTime(schedule.arrival,zone)}</span><span>{schedule.meters===null ? "Road miles unconfirmed" : (schedule.meters/1609.344).toFixed(1)+" road miles"}</span><span>{schedule.elapsedHours===null ? "Person-hours unconfirmed" : schedule.personHours!.reduce((s,h)=>s+h,0).toFixed(1)+" total person-hours (door-to-door)"}</span></div>
  </section>;
}
