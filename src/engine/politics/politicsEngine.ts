import {
  clamp,
  type EngineResult,
  type GameEvent,
  type GovernmentType,
  type Ideology,
  type Rng,
  type WorldState,
} from '../core/types';
import { averageProvinceUnrest } from '../core/queries';
import { templateFlavorTextProvider as flavor } from '../flavor/flavorTextProvider';

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

const NEW_LEADER_TITLE: Record<GovernmentType, string> = {
  absolute_monarchy: 'A Restored Monarch',
  constitutional_monarchy: 'A Reforming Monarch',
  republic: 'A Provisional President',
  empire: 'A New Dynasty',
  confederation: 'A Council of States',
};

export function tick(world: WorldState, rng: Rng): EngineResult {
  const countries = { ...world.countries };
  const provinces = { ...world.provinces };
  const events: GameEvent[] = [];

  for (const country of Object.values(world.countries)) {
    const avgUnrest = averageProvinceUnrest(world, country.provinceIds);

    let opinionDelta = country.gdpGrowth * 200;
    opinionDelta -= Math.max(0, country.unemployment - 10) * 0.3;
    opinionDelta -= avgUnrest / 20;
    opinionDelta += country.taxRate < 0.2 ? 0.5 : -(country.taxRate - 0.2) * 5;
    opinionDelta += (rng.next() - 0.5) * 1.5;

    let publicOpinion = clamp(country.publicOpinion + opinionDelta, 0, 100);

    const stabilityDelta = (publicOpinion - 50) / 20 + (rng.next() - 0.5) * 1.2;
    const previousStability = country.government.stability;
    let stability = clamp(previousStability + stabilityDelta, 0, 100);
    let government = { ...country.government, stability };
    let ideology = country.ideology;

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

    if (stability < COLLAPSE_STABILITY_FLOOR && rng.next() < COLLAPSE_CHANCE_PER_TURN) {
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
      ideology = otherIdeologies[rng.int(0, otherIdeologies.length - 1)];
      government = {
        type: newType,
        leaderName: NEW_LEADER_TITLE[newType],
        stability: 45 + rng.next() * 10,
      };
      publicOpinion = clamp(publicOpinion + 20, 0, 100);

      events.push({
        id: `regime-change-${country.id}-${world.turn}`,
        turn: world.turn,
        year: world.date.year,
        type: 'regime_change',
        countryIds: [country.id],
        text: flavorText,
        severity: 'major',
      });
    }

    countries[country.id] = { ...country, publicOpinion, government, ideology };

    for (const pid of country.provinceIds) {
      const province = provinces[pid];
      const unrestDelta =
        -country.gdpGrowth * 100 + (publicOpinion < 30 ? 2 : -1) + (rng.next() - 0.5) * 1.5;
      provinces[pid] = { ...province, unrest: clamp(province.unrest + unrestDelta, 0, 100) };
    }
  }

  return { world: { ...world, countries, provinces }, events };
}
