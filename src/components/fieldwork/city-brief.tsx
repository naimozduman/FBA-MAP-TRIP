import { cityBrief, observationSummary, sourcingBrief } from "@/lib/fieldwork/brief";
import { money2 } from "@/lib/fieldwork/math";
import type { Visit } from "@/lib/fieldwork/types";
export default function CityBrief({ cityId, visits }: { cityId: string; visits: Visit[] }) {
  const memberships = cityBrief(cityId);
  const observations = observationSummary(visits);
  return <section className="city-brief">
    <h3>Sourcing brief</h3>
    <p className="evidence-note">Travel times, market size, competition and inventory are supplied estimates. Confirm sources before departure.</p>
    {memberships.length === 0 && <p className="muted">No original corridor membership. Explore this locality independently.</p>}
    {memberships.map(({ original, brief }) => <details key={original.id} open={memberships.length === 1}>
      <summary>{original.name}</summary>
      <p>{brief.market_role}</p>
      <p className="muted">Competition proxy: {brief.competition_proxy}. Volume proxy: {brief.volume_proxy}. Neither is measured stock or an empirical saturation score.</p>
      <ul>{brief.strategy.map(item => <li key={item}>{item}</li>)}</ul>
      <details><summary>Corridor leads — locations and current details unverified</summary><ul>{brief.source_leads.map(lead => <li key={lead.name}><strong>{lead.name}</strong>: {lead.details_as_supplied}</li>)}</ul></details>
    </details>)}
    <h3>Observed results</h3>
    <p>{observations.samples ? `${observations.samples} visits · last ${observations.lastVisit}` : "Untested · no visit observations"}</p>
    {observations.samples > 0 && <p className="muted">{observations.booksPerHour === null ? "Hours unknown" : `${observations.booksPerHour.toFixed(1)} books / sourcing hour`} · {observations.averageCost === null ? "Acquisition cost per book unavailable" : `${money2(observations.averageCost)} / book`} · {((observations.zeroBookStopRate ?? 0) * 100).toFixed(0)}% zero-book visits</p>}
    <p className="muted">{observations.saturation === null ? `Saturation: awaiting three scored visits (${observations.saturationSamples} recorded).` : `Observed saturation: ${observations.saturation.toFixed(1)} / 10 across ${observations.saturationSamples} scored visits.`}</p>
    <details><summary>Source classes & revisit guidance</summary>
      <ul>{sourcingBrief.source_classes.map(item => <li key={item.id}><strong>Class {item.id}: {item.name}</strong> — {item.examples.join(", ")}</li>)}</ul>
      <p>{sourcingBrief.source_strategy}</p>
      <ul>{sourcingBrief.revisit_logic.map(item => <li key={item.condition}>{item.condition}: {item.cadence}.</li>)}</ul>
    </details>
    <p className="muted">Halal food: no verified venue supplied for this city. Confirm the business, scope and hours before choosing a meal stop.</p>
  </section>;
}
