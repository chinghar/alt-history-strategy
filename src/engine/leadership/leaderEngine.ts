import {
  clamp,
  type Country,
  type CountryId,
  type EngineResult,
  type GameEvent,
  type GovernmentType,
  type Rng,
  type WorldState,
} from '../core/types';
import { generateLeaderName } from './namePools';
import { templateFlavorTextProvider as flavor } from '../flavor/flavorTextProvider';

const ELECTION_INTERVAL_TURNS = 5;
const SUCCESSION_MIN_TENURE_TURNS = 5;
const SUCCESSION_CHANCE_PER_TURN = 0.1;

const ELECTED_TYPES: readonly GovernmentType[] = ['republic', 'confederation'];
const HEREDITARY_TYPES: readonly GovernmentType[] = ['absolute_monarchy', 'constitutional_monarchy', 'empire'];

/**
 * Applies one leadership change to a country: a new name/title (person or
 * institutional body, see namePools.ts), a small stability/opinion effect,
 * and a narrative event. Elections carry a reliable "fresh mandate" bump;
 * successions carry a small random swing either way, reflecting how an
 * untested new ruler's initial reception is genuinely uncertain rather than
 * guaranteed goodwill.
 */
function applyLeadershipChange(
  world: WorldState,
  country: Country,
  rng: Rng,
  isElection: boolean,
): { country: Country; event: GameEvent } {
  const isInstitutional = world.institutionalLeadershipCountryIds.includes(country.id);
  const leaderName = generateLeaderName(country.id, country.government.type, isInstitutional, rng);

  const stabilityDelta = isElection ? 4 : (rng.next() - 0.5) * 8;
  const opinionDelta = isElection ? 3 : 0;

  const nextCountry: Country = {
    ...country,
    government: {
      ...country.government,
      leaderName,
      stability: clamp(country.government.stability + stabilityDelta, 0, 100),
    },
    publicOpinion: clamp(country.publicOpinion + opinionDelta, 0, 100),
    lastLeadershipChangeTurn: world.turn,
  };

  const text = isElection
    ? flavor.leaderElected(country.name, leaderName, rng)
    : flavor.leaderSucceeds(country.name, leaderName, rng);

  const event: GameEvent = {
    id: `leadership-${country.id}-${world.turn}`,
    turn: world.turn,
    year: world.date.year,
    type: isElection ? 'leader_elected' : 'leader_succession',
    countryIds: [country.id],
    text,
    severity: 'notable',
  };

  return { country: nextCountry, event };
}

/**
 * Rotates leadership over time so a country's founding leader doesn't stay
 * in office for the entire game. Republics/confederations hold regular
 * elections on a fixed term; monarchies/empires get an irregular succession
 * once a minimum tenure has passed, mimicking an eventual death or
 * abdication rather than a scheduled handover.
 */
export function tick(world: WorldState, rng: Rng): EngineResult {
  const countries = { ...world.countries };
  const events: GameEvent[] = [];

  for (const country of Object.values(world.countries)) {
    const tenure = world.turn - country.lastLeadershipChangeTurn;
    const isElected = ELECTED_TYPES.includes(country.government.type);
    const isHereditary = HEREDITARY_TYPES.includes(country.government.type);

    if (isElected && tenure >= ELECTION_INTERVAL_TURNS) {
      const { country: next, event } = applyLeadershipChange(world, country, rng, true);
      countries[country.id] = next;
      events.push(event);
    } else if (isHereditary && tenure >= SUCCESSION_MIN_TENURE_TURNS && rng.next() < SUCCESSION_CHANCE_PER_TURN) {
      const { country: next, event } = applyLeadershipChange(world, country, rng, false);
      countries[country.id] = next;
      events.push(event);
    }
  }

  return { world: { ...world, countries }, events };
}

/** Sandbox entry point: force an immediate leadership change for one country, bypassing tenure/interval checks. */
export function forceLeadershipChange(world: WorldState, countryId: CountryId, rng: Rng): EngineResult {
  const country = world.countries[countryId];
  if (!country) return { world, events: [] };

  const isElection = ELECTED_TYPES.includes(country.government.type);
  const { country: next, event } = applyLeadershipChange(world, country, rng, isElection);

  return {
    world: { ...world, countries: { ...world.countries, [countryId]: next } },
    events: [event],
  };
}
