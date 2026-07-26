import { clamp, type CountryId, type EngineResult, type PrimaryIndustry, type Rng, type WorldState } from '../core/types';
import { getCountryRelations } from '../core/queries';

/**
 * Baseline yearly growth by province industry type. This is what drives the
 * North/South economic divergence the American Civil War tracker watches:
 * industrial provinces compound faster than slave-agrarian ones without any
 * scripted event forcing it.
 */
const INDUSTRY_GROWTH: Record<PrimaryIndustry, number> = {
  industrial: 0.035,
  trade: 0.02,
  agrarian: 0.01,
  slave_agrarian: -0.004,
};

export function tick(world: WorldState, rng: Rng): EngineResult {
  const provinces = { ...world.provinces };
  const countries = { ...world.countries };

  for (const country of Object.values(world.countries)) {
    const sanctionCount = getCountryRelations(world, country.id).filter((r) =>
      r.treaties.includes('sanction'),
    ).length;
    const sanctionPenalty = sanctionCount * 0.015;
    const stabilityFactor = (country.government.stability - 50) / 1000;
    const taxDrag = Math.max(0, country.taxRate - 0.25) * 0.1;

    let newGdp = 0;
    for (const pid of country.provinceIds) {
      const province = provinces[pid];
      const unrestDrag = province.unrest / 2000;
      const jitter = (rng.next() - 0.5) * 0.01;
      const growth =
        INDUSTRY_GROWTH[province.primaryIndustry] +
        stabilityFactor -
        taxDrag -
        unrestDrag -
        sanctionPenalty +
        jitter;
      const economicOutput = Math.max(1, province.economicOutput * (1 + growth));
      provinces[pid] = { ...province, economicOutput };
      newGdp += economicOutput;
    }

    const taxRevenue = newGdp * country.taxRate;
    const governmentSpend = newGdp * 0.22;
    const deficit = governmentSpend - taxRevenue;
    const debt = Math.max(0, country.debt + deficit * 0.05);
    const gdpGrowth = country.gdp > 0 ? newGdp / country.gdp - 1 : 0;
    const unemployment = clamp(
      country.unemployment - gdpGrowth * 40 + (rng.next() - 0.5) * 0.5,
      1,
      40,
    );

    countries[country.id] = {
      ...country,
      gdp: newGdp,
      gdpGrowth,
      debt,
      unemployment,
    };
  }

  return { world: { ...world, countries, provinces }, events: [] };
}

/** Player decision: set a country's tax rate directly, bypassing the AI's own gradual adjustment. */
export function setTaxRate(world: WorldState, countryId: CountryId, taxRate: number): WorldState {
  const country = world.countries[countryId];
  if (!country) return world;
  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: { ...country, taxRate: clamp(taxRate, 0.05, 0.5) },
    },
  };
}
