import { clamp, type EngineResult, type Rng, type WorldState } from '../core/types';

/**
 * Deliberately minimal for the vertical slice: upkeep cost and a slow drift
 * toward a GDP-proportional target strength. No recruitment queues, no
 * combat resolution yet — see "Explicitly deferred" in the project plan.
 */
export function tick(world: WorldState, rng: Rng): EngineResult {
  const countries = { ...world.countries };

  for (const country of Object.values(world.countries)) {
    const upkeep = country.militaryStrength * 0.02 * (country.gdp / 100_000);
    const debt = Math.max(0, country.debt + upkeep);

    const targetStrength = (country.gdp / 100_000) * (country.taxRate * 4);
    const drift = (targetStrength - country.militaryStrength) * 0.05 + (rng.next() - 0.5) * 0.5;
    const militaryStrength = clamp(country.militaryStrength + drift, 0, 1000);

    countries[country.id] = { ...country, debt, militaryStrength };
  }

  return { world: { ...world, countries }, events: [] };
}
