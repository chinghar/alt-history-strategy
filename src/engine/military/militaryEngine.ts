import { clamp, type EngineResult, type Rng, type WorldState } from '../core/types';

/**
 * Deliberately minimal for the vertical slice: upkeep cost and a slow drift
 * toward a GDP-proportional target strength. No recruitment queues, no
 * combat resolution yet — see "Explicitly deferred" in the project plan.
 */
export function tick(world: WorldState, rng: Rng): EngineResult {
  const countries = { ...world.countries };

  for (const country of Object.values(world.countries)) {
    // Upkeep and target strength scale off gdp * taxRate directly — our GDP
    // figures run in the tens-to-thousands (see the 1836 scenario), not the
    // hundreds of thousands, so no extra divisor belongs here.
    const upkeep = (country.militaryStrength / 100) * country.gdp * 0.005;
    const debt = Math.max(0, country.debt + upkeep);

    const targetStrength = country.gdp * country.taxRate * 0.5 + country.techMilitaryBonus;
    const drift = (targetStrength - country.militaryStrength) * 0.03 + (rng.next() - 0.5) * 0.5;
    const militaryStrength = clamp(country.militaryStrength + drift, 0, 1000);

    countries[country.id] = { ...country, debt, militaryStrength };
  }

  return { world: { ...world, countries }, events: [] };
}
