import {
  clamp,
  relationKey,
  type CountryId,
  type EngineResult,
  type GameEvent,
  type Rng,
  type WorldState,
} from '../core/types';
import { templateFlavorTextProvider as flavor } from '../flavor/flavorTextProvider';
import { declareWar, suePeace } from '../warfare/warfareEngine';
import { setTreaty } from '../diplomacy/diplomacyEngine';
import { forceRegimeChange } from '../politics/politicsEngine';
import { forceLeadershipChange } from '../leadership/leaderEngine';
import { TECH_REGISTRY } from '../research/techs';
import { isUnlockable } from '../research/researchEngine';
import {
  resourceDiscovery,
  naturalDisaster,
  culturalFlourishing,
  epidemic,
} from '../events/wildcardEventsEngine';

export type ForceableEventType =
  | 'economic_boom'
  | 'recession'
  | 'government_crisis'
  | 'regime_change'
  | 'leadership_change'
  | 'war_declared'
  | 'peace'
  | 'alliance_formed'
  | 'sanctions_imposed'
  | 'diplomatic_incident'
  | 'resource_discovery'
  | 'natural_disaster'
  | 'cultural_flourishing'
  | 'epidemic'
  | 'tech_breakthrough';

export interface ForceableEventDef {
  id: ForceableEventType;
  label: string;
  description: string;
  needsSecondCountry: boolean;
}

/**
 * Every event a player can inject via the sandbox panel, grouped roughly by
 * how "immediate" vs. "sets up future turns" the effect is. All of these
 * reuse the exact same state-transform functions the normal simulation
 * calls (declareWar, setTreaty, forceRegimeChange, the wildcard generators,
 * ...) — forcing an event doesn't run a separate parallel system, it just
 * calls the same machinery on demand, so whatever happens next unfolds
 * through the regular per-turn engines exactly like an organic event would.
 */
export const FORCEABLE_EVENTS: ForceableEventDef[] = [
  { id: 'economic_boom', label: 'Economic Boom', description: 'Sharply boosts output in every province — watch GDP, opinion, and stability respond over the next few turns.', needsSecondCountry: false },
  { id: 'recession', label: 'Recession', description: 'Sharply cuts output in every province.', needsSecondCountry: false },
  { id: 'government_crisis', label: 'Government Crisis', description: "Crashes stability into crisis territory — raises the odds of a regime collapse on a future turn, doesn't guarantee one.", needsSecondCountry: false },
  { id: 'regime_change', label: 'Regime Change', description: 'Immediately topples or reforms the government and installs a new leader.', needsSecondCountry: false },
  { id: 'leadership_change', label: 'Leadership Change', description: 'Immediately holds an election or succession without changing the government type.', needsSecondCountry: false },
  { id: 'war_declared', label: 'Declare War', description: 'The first country declares war on the second, pulling in existing allies.', needsSecondCountry: true },
  { id: 'peace', label: 'Force Peace', description: 'Ends whatever war the first country is currently fighting in.', needsSecondCountry: false },
  { id: 'alliance_formed', label: 'Form Alliance', description: 'Forms an alliance between the two chosen countries.', needsSecondCountry: true },
  { id: 'sanctions_imposed', label: 'Impose Sanctions', description: 'The first country sanctions the second.', needsSecondCountry: true },
  { id: 'diplomatic_incident', label: 'Diplomatic Incident', description: 'Sharply drops relations between the two chosen countries.', needsSecondCountry: true },
  { id: 'resource_discovery', label: 'Resource Discovery', description: 'A boom in one of the country’s provinces.', needsSecondCountry: false },
  { id: 'natural_disaster', label: 'Natural Disaster', description: 'Damages output and raises unrest in one of the country’s provinces.', needsSecondCountry: false },
  { id: 'cultural_flourishing', label: 'Cultural Flourishing', description: 'A wave of national pride lifts public opinion.', needsSecondCountry: false },
  { id: 'epidemic', label: 'Epidemic', description: 'Raises unrest nationwide and strains the treasury.', needsSecondCountry: false },
  { id: 'tech_breakthrough', label: 'Tech Breakthrough', description: 'Instantly unlocks a random tech the country could otherwise research.', needsSecondCountry: false },
];

function makeEvent(world: WorldState, type: string, countryIds: CountryId[], text: string, severity: GameEvent['severity']): GameEvent {
  return {
    id: `forced-${type}-${countryIds.join('-')}-${world.turn}-${world.eventLog.length}`,
    turn: world.turn,
    year: world.date.year,
    type: `forced_${type}`,
    countryIds,
    text,
    severity,
  };
}

function forceEconomicBoom(world: WorldState, countryId: CountryId, rng: Rng): EngineResult {
  const country = world.countries[countryId];
  if (!country) return { world, events: [] };
  const boost = 1.2 + rng.next() * 0.15;
  const provinces = { ...world.provinces };
  for (const pid of country.provinceIds) {
    provinces[pid] = { ...provinces[pid], economicOutput: provinces[pid].economicOutput * boost };
  }
  const event = makeEvent(world, 'economic_boom', [countryId], flavor.boomHeadline(country.name, rng), 'notable');
  return { world: { ...world, provinces }, events: [event] };
}

function forceRecession(world: WorldState, countryId: CountryId, rng: Rng): EngineResult {
  const country = world.countries[countryId];
  if (!country) return { world, events: [] };
  const factor = 1 - (0.15 + rng.next() * 0.15);
  const provinces = { ...world.provinces };
  for (const pid of country.provinceIds) {
    provinces[pid] = { ...provinces[pid], economicOutput: Math.max(1, provinces[pid].economicOutput * factor) };
  }
  const event = makeEvent(world, 'recession', [countryId], flavor.recessionHeadline(country.name, rng), 'notable');
  return { world: { ...world, provinces }, events: [event] };
}

function forceGovernmentCrisis(world: WorldState, countryId: CountryId, rng: Rng): EngineResult {
  const country = world.countries[countryId];
  if (!country) return { world, events: [] };
  const stability = 5 + rng.next() * 8;
  const countries = {
    ...world.countries,
    [countryId]: { ...country, government: { ...country.government, stability } },
  };
  const event = makeEvent(world, 'government_crisis', [countryId], flavor.governmentCrisis(country.name, rng), 'major');
  return { world: { ...world, countries }, events: [event] };
}

function forceWarDeclared(world: WorldState, attackerId: CountryId, defenderId: CountryId, rng: Rng): EngineResult {
  const attacker = world.countries[attackerId];
  const defender = world.countries[defenderId];
  if (!attacker || !defender) return { world, events: [] };
  const nextWorld = declareWar(world, attackerId, defenderId);
  if (nextWorld === world) return { world, events: [] };
  const event = makeEvent(world, 'war_declared', [attackerId, defenderId], flavor.warDeclared(attacker.name, defender.name, rng), 'major');
  return { world: nextWorld, events: [event] };
}

function forcePeace(world: WorldState, countryId: CountryId, rng: Rng): EngineResult {
  const country = world.countries[countryId];
  if (!country) return { world, events: [] };
  const nextWorld = suePeace(world, countryId);
  if (nextWorld === world) return { world, events: [] };
  const event = makeEvent(world, 'peace', [countryId], flavor.peaceSued(country.name, rng), 'major');
  return { world: nextWorld, events: [event] };
}

function forceAllianceFormed(world: WorldState, aId: CountryId, bId: CountryId, rng: Rng): EngineResult {
  const a = world.countries[aId];
  const b = world.countries[bId];
  if (!a || !b) return { world, events: [] };
  const nextWorld = setTreaty(world, aId, bId, 'alliance', true);
  const event = makeEvent(world, 'alliance_formed', [aId, bId], flavor.allianceFormed(a.name, b.name, rng), 'notable');
  return { world: nextWorld, events: [event] };
}

function forceSanctionsImposed(world: WorldState, aId: CountryId, bId: CountryId, rng: Rng): EngineResult {
  const a = world.countries[aId];
  const b = world.countries[bId];
  if (!a || !b) return { world, events: [] };
  const nextWorld = setTreaty(world, aId, bId, 'sanction', true);
  const event = makeEvent(world, 'sanctions_imposed', [aId, bId], flavor.sanctionImposed(a.name, b.name, rng), 'notable');
  return { world: nextWorld, events: [event] };
}

function forceDiplomaticIncident(world: WorldState, aId: CountryId, bId: CountryId, rng: Rng): EngineResult {
  const a = world.countries[aId];
  const b = world.countries[bId];
  if (!a || !b) return { world, events: [] };
  const key = relationKey(aId, bId);
  const relation = world.relations[key] ?? { a: aId, b: bId, score: 0, treaties: [] };
  const drop = 20 + rng.next() * 15;
  const relations = { ...world.relations, [key]: { ...relation, score: clamp(relation.score - drop, -100, 100) } };
  const event = makeEvent(world, 'diplomatic_incident', [aId, bId], flavor.diplomaticIncident(a.name, b.name, rng), 'notable');
  return { world: { ...world, relations }, events: [event] };
}

function forceTechBreakthrough(world: WorldState, countryId: CountryId, rng: Rng): EngineResult {
  const country = world.countries[countryId];
  if (!country) return { world, events: [] };
  const available = world.availableTechIds.filter((id) => isUnlockable(TECH_REGISTRY[id], country));
  if (available.length === 0) return { world, events: [] };
  const tech = TECH_REGISTRY[available[rng.int(0, available.length - 1)]];

  const countries = {
    ...world.countries,
    [countryId]: {
      ...country,
      unlockedTechIds: [...country.unlockedTechIds, tech.id],
      techGrowthBonus: country.techGrowthBonus + (tech.effectKind === 'growth_bonus' ? tech.effectValue : 0),
      techMilitaryBonus: country.techMilitaryBonus + (tech.effectKind === 'military_bonus' ? tech.effectValue : 0),
      currentResearchId: country.currentResearchId === tech.id ? null : country.currentResearchId,
    },
  };
  const event = makeEvent(world, 'tech_breakthrough', [countryId], flavor.techUnlocked(country.name, tech.name, rng), 'notable');
  return { world: { ...world, countries }, events: [event] };
}

function forceWildcard(
  world: WorldState,
  countryId: CountryId,
  rng: Rng,
  type: 'resource_discovery' | 'natural_disaster' | 'cultural_flourishing' | 'epidemic',
  generator: (world: WorldState, countryId: CountryId, rng: Rng) => { world: WorldState; text: string; severity: GameEvent['severity'] } | null,
): EngineResult {
  const country = world.countries[countryId];
  if (!country) return { world, events: [] };
  const outcome = generator(world, countryId, rng);
  if (!outcome) return { world, events: [] };
  const event = makeEvent(world, type, [countryId], outcome.text, outcome.severity);
  return { world: outcome.world, events: [event] };
}

/**
 * Sandbox entry point: apply one forced event to the world outside the
 * normal turn loop. Whatever state it changes gets picked up by the regular
 * engines on the next Next Turn click exactly like an organic event would —
 * forcing a war doesn't resolve the war, it just starts it; forcing a
 * recession doesn't end it, it just knocks output down for warfareEngine/
 * economyEngine/politicsEngine to keep reacting to afterward.
 */
export function forceEvent(
  world: WorldState,
  type: ForceableEventType,
  countryId: CountryId,
  secondCountryId: CountryId | null,
  rng: Rng,
): EngineResult {
  switch (type) {
    case 'economic_boom':
      return forceEconomicBoom(world, countryId, rng);
    case 'recession':
      return forceRecession(world, countryId, rng);
    case 'government_crisis':
      return forceGovernmentCrisis(world, countryId, rng);
    case 'regime_change':
      return forceRegimeChange(world, countryId, rng);
    case 'leadership_change':
      return forceLeadershipChange(world, countryId, rng);
    case 'war_declared':
      return secondCountryId ? forceWarDeclared(world, countryId, secondCountryId, rng) : { world, events: [] };
    case 'peace':
      return forcePeace(world, countryId, rng);
    case 'alliance_formed':
      return secondCountryId ? forceAllianceFormed(world, countryId, secondCountryId, rng) : { world, events: [] };
    case 'sanctions_imposed':
      return secondCountryId ? forceSanctionsImposed(world, countryId, secondCountryId, rng) : { world, events: [] };
    case 'diplomatic_incident':
      return secondCountryId ? forceDiplomaticIncident(world, countryId, secondCountryId, rng) : { world, events: [] };
    case 'resource_discovery':
      return forceWildcard(world, countryId, rng, 'resource_discovery', resourceDiscovery);
    case 'natural_disaster':
      return forceWildcard(world, countryId, rng, 'natural_disaster', naturalDisaster);
    case 'cultural_flourishing':
      return forceWildcard(world, countryId, rng, 'cultural_flourishing', culturalFlourishing);
    case 'epidemic':
      return forceWildcard(world, countryId, rng, 'epidemic', epidemic);
    case 'tech_breakthrough':
      return forceTechBreakthrough(world, countryId, rng);
    default:
      return { world, events: [] };
  }
}
