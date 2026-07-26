import type { CountryId, Relation, WorldState } from './types';

/** All relations involving a given country, regardless of which side it's stored on. */
export function getCountryRelations(world: WorldState, countryId: CountryId): Relation[] {
  return Object.values(world.relations).filter((r) => r.a === countryId || r.b === countryId);
}

export function getOtherParty(relation: Relation, countryId: CountryId): CountryId {
  return relation.a === countryId ? relation.b : relation.a;
}

export function averageProvinceUnrest(world: WorldState, provinceIds: string[]): number {
  if (provinceIds.length === 0) return 0;
  const total = provinceIds.reduce((sum, id) => sum + world.provinces[id].unrest, 0);
  return total / provinceIds.length;
}

export function countriesWithTag(world: WorldState, tag: string) {
  return Object.values(world.countries).filter((c) => c.tags.includes(tag));
}
