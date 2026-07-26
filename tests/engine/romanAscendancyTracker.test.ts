import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario431bce } from '../../src/data/scenarios/431bce';
import { romanAscendancyTracker } from '../../src/engine/probability/outcomes/romanAscendancy';

describe('romanAscendancyTracker', () => {
  it('starts low, reflecting that Rome is an underdog in 431 BCE', () => {
    const world = buildWorld(scenario431bce);
    const value = romanAscendancyTracker.estimate(world);
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(0.5);
  });

  it('rises as Rome grows stronger relative to Carthage and Syracuse', () => {
    const world = buildWorld(scenario431bce);
    const before = romanAscendancyTracker.estimate(world);

    const stronger = {
      ...world,
      countries: {
        ...world.countries,
        ROM: { ...world.countries['ROM'], gdp: world.countries['ROM'].gdp * 5, militaryStrength: 200 },
      },
    };
    expect(romanAscendancyTracker.estimate(stronger)).toBeGreaterThan(before);
  });

  it('falls as Rome grows less stable', () => {
    const world = buildWorld(scenario431bce);
    const before = romanAscendancyTracker.estimate(world);

    const unstable = {
      ...world,
      countries: {
        ...world.countries,
        ROM: { ...world.countries['ROM'], government: { ...world.countries['ROM'].government, stability: 5 } },
      },
    };
    expect(romanAscendancyTracker.estimate(unstable)).toBeLessThan(before);
  });

  it('returns 0 if Rome does not exist in the world', () => {
    const world = buildWorld(scenario431bce);
    const { ROM: _rom, ...rest } = world.countries;
    expect(romanAscendancyTracker.estimate({ ...world, countries: rest })).toBe(0);
  });
});
