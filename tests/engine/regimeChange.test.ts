import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { tick as politicsTick } from '../../src/engine/politics/politicsEngine';
import { createRng } from '../../src/engine/core/rng';
import { americanCivilWarTracker } from '../../src/engine/probability/outcomes/americanCivilWar';
import { ottomanDeclineTracker } from '../../src/engine/probability/outcomes/ottomanDecline';
import type { CountryId, WorldState } from '../../src/engine/core/types';

function crashStability(world: WorldState, countryId: CountryId): WorldState {
  const country = world.countries[countryId];
  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: { ...country, government: { ...country.government, stability: 5 } },
    },
  };
}

describe('politicsEngine regime change', () => {
  it('fractures a collapsing republic into a confederation, and the American Civil War tracker responds', () => {
    let world = crashStability(buildWorld(scenario1836), 'USA');
    const rng = createRng(3);

    let changed = false;
    for (let i = 0; i < 60 && !changed; i++) {
      world = crashStability(world, 'USA');
      const result = politicsTick(world, rng);
      world = result.world;
      if (result.events.some((e) => e.type === 'regime_change')) changed = true;
    }

    expect(changed).toBe(true);
    expect(world.countries['USA'].government.type).toBe('confederation');
    expect(americanCivilWarTracker.estimate(world)).toBeGreaterThan(0.9);
  });

  it('reforms or overthrows a collapsing empire, and a revolution moves the Ottoman decline tracker', () => {
    let world = crashStability(buildWorld(scenario1836), 'OTT');
    const rng = createRng(11);

    let changed = false;
    for (let i = 0; i < 60 && !changed; i++) {
      world = crashStability(world, 'OTT');
      const result = politicsTick(world, rng);
      world = result.world;
      if (result.events.some((e) => e.type === 'regime_change')) changed = true;
    }

    expect(changed).toBe(true);
    const newType = world.countries['OTT'].government.type;
    expect(['constitutional_monarchy', 'republic']).toContain(newType);
    if (newType === 'republic') {
      expect(ottomanDeclineTracker.estimate(world)).toBeGreaterThan(0.9);
    }
  });

  it('always assigns a different ideology than before on regime change', () => {
    let world = crashStability(buildWorld(scenario1836), 'ESP');
    const originalIdeology = world.countries['ESP'].ideology;
    const rng = createRng(5);

    let changed = false;
    for (let i = 0; i < 60 && !changed; i++) {
      world = crashStability(world, 'ESP');
      const result = politicsTick(world, rng);
      world = result.world;
      if (result.events.some((e) => e.type === 'regime_change')) changed = true;
    }

    expect(changed).toBe(true);
    expect(world.countries['ESP'].ideology).not.toBe(originalIdeology);
  });
});
