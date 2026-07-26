import { clamp, relationKey, type CountryId, type EngineResult, type GameEvent, type Rng, type WorldState } from '../core/types';

const EVENT_CHANCE = 0.025;

interface WildcardOutcome {
  world: WorldState;
  text: string;
  severity: GameEvent['severity'];
}

type WildcardGenerator = (world: WorldState, countryId: CountryId, rng: Rng) => WildcardOutcome | null;

function resourceDiscovery(world: WorldState, countryId: CountryId, rng: Rng): WildcardOutcome | null {
  const country = world.countries[countryId];
  if (country.provinceIds.length === 0) return null;
  const pid = country.provinceIds[rng.int(0, country.provinceIds.length - 1)];
  const province = world.provinces[pid];
  const boost = 1.15 + rng.next() * 0.15;
  return {
    world: {
      ...world,
      provinces: { ...world.provinces, [pid]: { ...province, economicOutput: province.economicOutput * boost } },
    },
    text: `A valuable resource discovery in ${province.name} spurs a local boom for ${country.name}.`,
    severity: 'notable',
  };
}

function naturalDisaster(world: WorldState, countryId: CountryId, rng: Rng): WildcardOutcome | null {
  const country = world.countries[countryId];
  if (country.provinceIds.length === 0) return null;
  const pid = country.provinceIds[rng.int(0, country.provinceIds.length - 1)];
  const province = world.provinces[pid];
  const factor = 1 - (0.1 + rng.next() * 0.1);
  return {
    world: {
      ...world,
      provinces: {
        ...world.provinces,
        [pid]: {
          ...province,
          economicOutput: Math.max(1, province.economicOutput * factor),
          unrest: clamp(province.unrest + 8, 0, 100),
        },
      },
    },
    text: `A natural disaster strikes ${province.name}, disrupting ${country.name}'s economy.`,
    severity: 'notable',
  };
}

function diplomaticIncident(world: WorldState, countryId: CountryId, rng: Rng): WildcardOutcome | null {
  const otherIds = Object.keys(world.countries).filter((id) => id !== countryId);
  if (otherIds.length === 0) return null;
  const otherId = otherIds[rng.int(0, otherIds.length - 1)];
  const key = relationKey(countryId, otherId);
  const relation = world.relations[key] ?? { a: countryId, b: otherId, score: 0, treaties: [] };
  const drop = 15 + rng.next() * 10;
  return {
    world: {
      ...world,
      relations: { ...world.relations, [key]: { ...relation, score: clamp(relation.score - drop, -100, 100) } },
    },
    text: `A diplomatic incident strains relations between ${world.countries[countryId].name} and ${world.countries[otherId].name}.`,
    severity: 'notable',
  };
}

function culturalFlourishing(world: WorldState, countryId: CountryId, rng: Rng): WildcardOutcome | null {
  const country = world.countries[countryId];
  const boost = 5 + rng.next() * 5;
  return {
    world: {
      ...world,
      countries: {
        ...world.countries,
        [countryId]: { ...country, publicOpinion: clamp(country.publicOpinion + boost, 0, 100) },
      },
    },
    text: `A wave of cultural achievement lifts national pride in ${country.name}.`,
    severity: 'minor',
  };
}

function epidemic(world: WorldState, countryId: CountryId, rng: Rng): WildcardOutcome | null {
  const country = world.countries[countryId];
  if (country.provinceIds.length === 0) return null;
  const provinces = { ...world.provinces };
  for (const pid of country.provinceIds) {
    const province = provinces[pid];
    provinces[pid] = { ...province, unrest: clamp(province.unrest + 5 + rng.next() * 10, 0, 100) };
  }
  return {
    world: {
      ...world,
      provinces,
      countries: { ...world.countries, [countryId]: { ...country, debt: country.debt + country.gdp * 0.03 } },
    },
    text: `An epidemic sweeps through ${country.name}, straining public order and finances.`,
    severity: 'major',
  };
}

const GENERATORS: WildcardGenerator[] = [
  resourceDiscovery,
  naturalDisaster,
  diplomaticIncident,
  culturalFlourishing,
  epidemic,
];

/**
 * "Random but simulation-driven historical events" — the wildcard layer on
 * top of everything that's already emergent from stats. Rare (2.5% chance
 * per country per turn), applies to AI and player countries alike since
 * these represent things happening to a country, not decisions it makes,
 * and every effect lands on the same fields (province output/unrest,
 * country opinion/debt, relation scores) the rest of the simulation already
 * reads — no special-casing needed downstream.
 */
export function tick(world: WorldState, rng: Rng): EngineResult {
  let next = world;
  const events: GameEvent[] = [];

  for (const country of Object.values(world.countries)) {
    if (rng.next() >= EVENT_CHANCE) continue;

    const generator = GENERATORS[rng.int(0, GENERATORS.length - 1)];
    const outcome = generator(next, country.id, rng);
    if (!outcome) continue;

    next = outcome.world;
    events.push({
      id: `wildcard-${country.id}-${world.turn}-${events.length}`,
      turn: world.turn,
      year: world.date.year,
      type: 'wildcard_event',
      countryIds: [country.id],
      text: outcome.text,
      severity: outcome.severity,
    });
  }

  return { world: next, events };
}
