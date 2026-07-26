import { clamp, type EngineResult, type GameEvent, type Rng, type WorldState } from '../core/types';
import { averageProvinceUnrest } from '../core/queries';

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

    const publicOpinion = clamp(country.publicOpinion + opinionDelta, 0, 100);

    const stabilityDelta = (publicOpinion - 50) / 20 + (rng.next() - 0.5) * 1.2;
    const previousStability = country.government.stability;
    const stability = clamp(previousStability + stabilityDelta, 0, 100);

    countries[country.id] = {
      ...country,
      publicOpinion,
      government: { ...country.government, stability },
    };

    for (const pid of country.provinceIds) {
      const province = provinces[pid];
      const unrestDelta =
        -country.gdpGrowth * 100 + (publicOpinion < 30 ? 2 : -1) + (rng.next() - 0.5) * 1.5;
      provinces[pid] = { ...province, unrest: clamp(province.unrest + unrestDelta, 0, 100) };
    }

    if (previousStability >= 25 && stability < 25) {
      events.push({
        id: `gov-crisis-${country.id}-${world.turn}`,
        turn: world.turn,
        year: world.date.year,
        type: 'government_crisis',
        countryIds: [country.id],
        text: `${country.name}'s government teeters on the edge of collapse as stability craters.`,
        severity: 'major',
      });
    }
  }

  return { world: { ...world, countries, provinces }, events };
}
