import {
  clamp,
  type Country,
  type CountryId,
  type EngineResult,
  type GameEvent,
  type GovernmentType,
  type Ideology,
  type Rng,
  type WorldState,
} from '../core/types';
import { averageProvinceUnrest } from '../core/queries';
import { templateFlavorTextProvider as flavor } from '../flavor/flavorTextProvider';
import { generateLeaderName } from '../leadership/namePools';

const COLLAPSE_STABILITY_FLOOR = 10;
const COLLAPSE_CHANCE_PER_TURN = 0.2;

const IDEOLOGIES: Ideology[] = ['conservative', 'liberal', 'nationalist', 'traditionalist', 'reformist'];

/** Peaceful reform path: crowns concede a constitution rather than fall. */
const REFORM_PATH: Partial<Record<GovernmentType, GovernmentType>> = {
  absolute_monarchy: 'constitutional_monarchy',
  empire: 'constitutional_monarchy',
};

/** Revolutionary path: the regime is overthrown outright. */
const REVOLUTION_PATH: Partial<Record<GovernmentType, GovernmentType>> = {
  absolute_monarchy: 'republic',
  constitutional_monarchy: 'republic',
  empire: 'republic',
};

/**
 * Topples or reforms a country's government: republics fracture into
 * confederations, monarchies/empires either reform into a constitutional
 * monarchy or fall to revolution, and a fresh leader (real generated name,
 * not a generic placeholder — see engine/leadership) takes over regardless
 * of which path was taken. Exported so the sandbox can force this outside
 * the normal per-turn collapse check, not just call it from tick() below.
 */
export function forceRegimeChange(world: WorldState, countryId: CountryId, rng: Rng): EngineResult {
  const country = world.countries[countryId];
  if (!country) return { world, events: [] };

  const government = country.government;
  let newType: GovernmentType = government.type;
  let flavorText: string;

  if (government.type === 'republic') {
    newType = 'confederation';
    flavorText = flavor.regimeChangeFracture(country.name, rng);
  } else if (rng.next() < 0.5 && REVOLUTION_PATH[government.type]) {
    newType = REVOLUTION_PATH[government.type]!;
    flavorText = flavor.regimeChangeRevolution(country.name, rng);
  } else if (REFORM_PATH[government.type]) {
    newType = REFORM_PATH[government.type]!;
    flavorText = flavor.regimeChangeReform(country.name, rng);
  } else {
    newType = government.type;
    flavorText = flavor.regimeChangeReshuffle(country.name, rng);
  }

  const otherIdeologies = IDEOLOGIES.filter((i) => i !== country.ideology);
  const ideology = otherIdeologies[rng.int(0, otherIdeologies.length - 1)];
  const isInstitutional = world.institutionalLeadershipCountryIds.includes(countryId);
  const leaderName = generateLeaderName(countryId, newType, isInstitutional, rng);

  const nextCountry: Country = {
    ...country,
    publicOpinion: clamp(country.publicOpinion + 20, 0, 100),
    government: { type: newType, leaderName, stability: 45 + rng.next() * 10 },
    ideology,
    lastLeadershipChangeTurn: world.turn,
  };

  const event: GameEvent = {
    id: `regime-change-${countryId}-${world.turn}`,
    turn: world.turn,
    year: world.date.year,
    type: 'regime_change',
    countryIds: [countryId],
    text: flavorText,
    severity: 'major',
  };

  return {
    world: { ...world, countries: { ...world.countries, [countryId]: nextCountry } },
    events: [event],
  };
}

export function tick(world: WorldState, rng: Rng): EngineResult {
  let countries = { ...world.countries };
  const provinces = { ...world.provinces };
  const events: GameEvent[] = [];

  for (const country of Object.values(world.countries)) {
    const avgUnrest = averageProvinceUnrest(world, country.provinceIds);

    let opinionDelta = country.gdpGrowth * 200;
    opinionDelta -= Math.max(0, country.unemployment - 10) * 0.3;
    opinionDelta -= avgUnrest / 20;
    opinionDelta += country.taxRate < 0.2 ? 0.5 : -(country.taxRate - 0.2) * 5;
    opinionDelta += (rng.next() - 0.5) * 1.5;

    const publicOpinion = clamp(country.publicOpinion + opinionDelta, 0, 100);

    const stabilityDelta = (publicOpinion - 50) / 20 + (rng.next() - 0.5) * 1.2;
    const previousStability = country.government.stability;
    const stability = clamp(previousStability + stabilityDelta, 0, 100);
    const government = { ...country.government, stability };

    if (previousStability >= 25 && stability < 25) {
      events.push({
        id: `gov-crisis-${country.id}-${world.turn}`,
        turn: world.turn,
        year: world.date.year,
        type: 'government_crisis',
        countryIds: [country.id],
        text: flavor.governmentCrisis(country.name, rng),
        severity: 'major',
      });
    }

    countries[country.id] = { ...country, publicOpinion, government };

    if (stability < COLLAPSE_STABILITY_FLOOR && rng.next() < COLLAPSE_CHANCE_PER_TURN) {
      const result = forceRegimeChange({ ...world, countries }, country.id, rng);
      countries = result.world.countries;
      events.push(...result.events);
    }

    const finalOpinion = countries[country.id].publicOpinion;
    for (const pid of country.provinceIds) {
      const province = provinces[pid];
      const unrestDelta =
        -country.gdpGrowth * 100 + (finalOpinion < 30 ? 2 : -1) + (rng.next() - 0.5) * 1.5;
      provinces[pid] = { ...province, unrest: clamp(province.unrest + unrestDelta, 0, 100) };
    }
  }

  return { world: { ...world, countries, provinces }, events };
}
