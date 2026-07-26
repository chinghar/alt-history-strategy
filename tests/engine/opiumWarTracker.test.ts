import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { opiumWarTracker } from '../../src/engine/probability/outcomes/opiumWar';
import { recomputeAllProbabilities } from '../../src/engine/probability/historicalProbabilityEngine';
import { relationKey } from '../../src/engine/core/types';

describe('opiumWarTracker', () => {
  it('starts at a plausible, non-degenerate value reflecting British military superiority', () => {
    const world = buildWorld(scenario1836);
    const value = opiumWarTracker.estimate(world);
    expect(value).toBeGreaterThan(0.5);
    expect(value).toBeLessThan(1);
  });

  it('rises as the British-Chinese military gap widens', () => {
    const world = buildWorld(scenario1836);
    const before = opiumWarTracker.estimate(world);

    const widerGap = {
      ...world,
      countries: { ...world.countries, CHN: { ...world.countries['CHN'], militaryStrength: 10 } },
    };
    expect(opiumWarTracker.estimate(widerGap)).toBeGreaterThan(before);
  });

  it('rises as Anglo-Chinese relations deteriorate further', () => {
    const world = buildWorld(scenario1836);
    const before = opiumWarTracker.estimate(world);

    const key = relationKey('GBR', 'CHN');
    const worseRelations = {
      ...world,
      relations: { ...world.relations, [key]: { ...world.relations[key], score: -90 } },
    };
    expect(opiumWarTracker.estimate(worseRelations)).toBeGreaterThan(before);
  });

  it('is included in the 1836 scenario\'s active trackers and recomputed on the world', () => {
    const world = recomputeAllProbabilities(buildWorld(scenario1836));
    expect(world.probabilities['opium-war-british-victory']).toBeDefined();
  });

  it("doesn't leak into the Ottoman Decline tracker's great-power rival comparison", () => {
    // China is deliberately untagged 'great_power' so it can't silently
    // pull down the average rival military strength OTT is compared
    // against — a real coupling bug this test would have caught.
    const world = buildWorld(scenario1836);
    expect(world.countries['CHN'].tags).not.toContain('great_power');
  });
});
