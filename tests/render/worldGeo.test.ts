import { describe, expect, it } from 'vitest';
import { countryFeatures } from '../../src/render/worldGeo';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { scenario2150 } from '../../src/data/scenarios/2150';

function resolve(geoName: string, countries: Record<string, unknown>): string | null {
  const feature = countryFeatures.find((f) => f.geoName === geoName);
  if (!feature) return null;
  return feature.countryIds.find((id) => id in countries) ?? null;
}

describe('worldGeo', () => {
  it('carries every era\'s candidate CountryId for geoNames shared across scenarios', () => {
    const japan = countryFeatures.find((f) => f.geoName === 'Japan');
    expect(japan?.countryIds).toEqual(expect.arrayContaining(['JPN', 'PPA']));

    const brazil = countryFeatures.find((f) => f.geoName === 'Brazil');
    expect(brazil?.countryIds).toEqual(expect.arrayContaining(['BRA', 'SAU']));

    const france = countryFeatures.find((f) => f.geoName === 'France');
    expect(france?.countryIds).toEqual(expect.arrayContaining(['FRA', 'EUF']));
  });

  it("resolves a shared geoName to 1836's country when the 1836 world is active", () => {
    const world = buildWorld(scenario1836);
    expect(resolve('Japan', world.countries)).toBe('JPN');
    expect(resolve('Brazil', world.countries)).toBe('BRA');
    expect(resolve('France', world.countries)).toBe('FRA');
  });

  it("resolves the same shared geoName to 2150's country when the 2150 world is active", () => {
    const world = buildWorld(scenario2150);
    expect(resolve('Japan', world.countries)).toBe('PPA');
    expect(resolve('Brazil', world.countries)).toBe('SAU');
    expect(resolve('France', world.countries)).toBe('EUF');
  });

  it('leaves the Lunar Commonwealth with no map geometry', () => {
    const allCandidateIds = new Set(countryFeatures.flatMap((f) => f.countryIds));
    expect(allCandidateIds.has('LUC')).toBe(false);
  });
});
