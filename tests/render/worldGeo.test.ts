import { describe, expect, it } from 'vitest';
import { countryFeatures } from '../../src/render/worldGeo';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { scenario431bce } from '../../src/data/scenarios/431bce';
import { scenario1200ce } from '../../src/data/scenarios/1200ce';
import { scenario1914 } from '../../src/data/scenarios/1914';
import { scenario1962 } from '../../src/data/scenarios/1962';
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

  it("resolves 1914's Ottoman Empire and Austria-Hungary onto their own polygons", () => {
    const world = buildWorld(scenario1914);
    expect(resolve('Turkey', world.countries)).toBe('OTT');
    expect(resolve('Austria', world.countries)).toBe('AUH');
    expect(resolve('Germany', world.countries)).toBe('GER');
  });

  it('resolves 1962 West Germany onto the shared Germany polygon and leaves East Germany unmapped, avoiding an intra-scenario collision', () => {
    const world = buildWorld(scenario1962);
    expect(resolve('Germany', world.countries)).toBe('FRG');
    const allCandidateIds = new Set(countryFeatures.flatMap((f) => f.countryIds));
    expect(allCandidateIds.has('GDR')).toBe(false);
  });

  it('every country in every scenario roster that has map geometry resolves to exactly itself (no intra-scenario collisions)', () => {
    for (const scenario of [scenario431bce, scenario1200ce, scenario1836, scenario1914, scenario1962, scenario2150]) {
      const world = buildWorld(scenario);
      for (const feature of countryFeatures) {
        const candidatesInThisWorld = feature.countryIds.filter((id) => id in world.countries);
        expect(candidatesInThisWorld.length).toBeLessThanOrEqual(1);
      }
    }
  });
});
